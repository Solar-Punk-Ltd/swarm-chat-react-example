import { BatchId, Bee } from "@ethersphere/bee-js";
import { ethers, Signature } from "ethers";
import { v4 as uuidv4 } from "uuid";
import { HexString } from "@solarpunkltd/gsoc/dist/types";

import { SwarmChatUtils } from "./utils";
import { EventEmitter } from "./eventEmitter";
import { AsyncQueue } from "./asyncQueue";

import {
  ChatSettings,
  ErrorObject,
  EthAddress,
  GsocSubscribtion,
  MessageData,
  User,
  UserWithIndex,
} from "./types";

import { EVENTS } from "./constants";
export class SwarmChat {
  private bee = new Bee("http://65.108.40.58:1733");
  private emitter = new EventEmitter();

  private messagesQueue: AsyncQueue;
  private users: UserWithIndex[] = [];
  private usersLoading = false;
  private gsocResourceId: HexString<number> = "";
  private gsocSubscribtion: GsocSubscribtion | null = null;
  private fetchMessageInterval: NodeJS.Timeout | null = null;
  private keepUserAliveInterval: NodeJS.Timeout | null = null;
  private utils: SwarmChatUtils;
  private topic: string;
  private stamp: BatchId;
  private nickname: string;
  private ownAddress: EthAddress;
  private ownIndex: number = -1;
  private privateKey: string;

  private eventStates: Record<string, boolean> = {
    loadingInitUsers: false,
    loadingUsers: false,
    loadingRegistration: false,
  };

  constructor(settings: ChatSettings) {
    this.bee = this.bee = new Bee(settings.url);
    this.gsocResourceId = settings.gsocResourceId || "";
    this.emitter = new EventEmitter();

    this.utils = new SwarmChatUtils(this.handleError.bind(this));
    this.messagesQueue = new AsyncQueue(
      { waitable: true },
      this.handleError.bind(this)
    );

    this.stamp = settings.stamp;
    this.topic = settings.topic;
    this.nickname = settings.nickname;
    this.ownAddress = settings.ownAddress;
    this.privateKey = settings.privateKey;

    console.info(`SwarmChat created, version: v0.1.8 or above`);
  }

  public getEmitter() {
    return this.emitter;
  }

  public listenToNewSubscribers() {
    try {
      this.emitter.emit(EVENTS.LOADING_INIT_USERS, true);
      this.gsocSubscribtion = this.utils.subscribeToGsoc(
        this.bee.url,
        this.stamp,
        this.topic,
        this.gsocResourceId,
        this.userRegistrationOnGsoc.bind(this)
      );
    } catch (error) {
      this.handleError({
        error: error as unknown as Error,
        context: `Could not create Users feed!`,
        throw: true,
      });
    }
  }

  public stopListenToNewSubscribers() {
    if (this.gsocSubscribtion) {
      this.gsocSubscribtion.close();
      this.gsocSubscribtion = null;
    }
  }

  public startKeepMeAliveProcess() {
    this.keepUserAliveInterval = setInterval(() => this.keepUserAlive(), 5000);
  }

  public stopKeepMeAliveProcess() {
    if (this.keepUserAliveInterval) {
      clearInterval(this.keepUserAliveInterval);
      this.keepUserAliveInterval = null;
    }
  }

  public startMessagesFetchProcess() {
    this.fetchMessageInterval = setInterval(
      () => this.readMessagesForAll(),
      5000
    );
  }

  public stopMessagesFetchProcess() {
    if (this.fetchMessageInterval) {
      clearInterval(this.fetchMessageInterval);
      this.fetchMessageInterval = null;
    }
  }

  public isUserRegistered(userAddress: EthAddress): boolean {
    const findResult = this.users.find((user) => user.address === userAddress);
    return !!findResult;
  }

  public async keepUserAlive() {
    try {
      this.emitStateEvent(EVENTS.LOADING_REGISTRATION, true);

      const wallet = new ethers.Wallet(this.privateKey);
      const address = wallet.address as EthAddress;

      if (address.toLowerCase() !== this.ownAddress.toLowerCase()) {
        throw new Error(
          "The provided address does not match the address derived from the private key"
        );
      }

      const timestamp = Date.now();
      const signature = (await wallet.signMessage(
        JSON.stringify({ username: this.nickname, address, timestamp })
      )) as unknown as Signature;

      const newUser: User = {
        address,
        timestamp,
        signature,
        username: this.nickname,
      };

      if (!this.utils.validateUserObject(newUser)) {
        throw new Error("User object validation failed");
      }

      const result = await this.utils.sendMessageToGsoc(
        this.bee.url,
        this.stamp,
        this.topic,
        this.gsocResourceId,
        JSON.stringify(newUser)
      );

      if (!result?.payload.length) throw "Error writing User object to GSOC!";
      console.log("keepUserAlive - User object sent successfully");
    } catch (error) {
      this.handleError({
        error: error as unknown as Error,
        context: `registerUser`,
        throw: false,
      });
    } finally {
      this.emitStateEvent(EVENTS.LOADING_REGISTRATION, false);
    }
  }

  public orderMessages(messages: MessageData[]) {
    return this.utils.orderMessages(messages);
  }

  private userRegistrationOnGsoc(gsocMessage: string) {
    try {
      const user: UserWithIndex = {
        ...(JSON.parse(gsocMessage) as unknown as User),
        index: -1,
      };

      if (!this.utils.validateUserObject(user)) {
        throw new Error("User object validation failed");
      }

      // const now = Date.now();
      // let newUsers = [...this.users];
      //newUsers = newUsers.filter((u) => now - u.timestamp <= 30000);

      if (!this.isUserRegistered(user.address)) {
        const newUsers = [...this.users, user];
        this.setUsers(newUsers);
      }

      console.log("userRegisteredThroughGsoc - setting users", this.users);
    } catch (error) {
      this.handleError({
        error: error as unknown as Error,
        context: `userRegisteredThroughGsoc`,
        throw: false,
      });
    }
  }

  private async readMessagesForAll() {
    const isWaiting = await this.messagesQueue.waitForProcessing();
    console.log("readMessagesForAll - Processing messages", isWaiting);
    if (isWaiting) {
      console.log("readMessagesForAll - Processing messages - BENT");
      return;
    }

    for (const user of this.users) {
      this.messagesQueue.enqueue(() => this.readMessage(user, this.topic));
    }
  }

  private async readMessage(user: UserWithIndex, rawTopic: string) {
    try {
      const chatID = this.utils.generateUserOwnedFeedId(rawTopic, user.address);
      const topic = this.bee.makeFeedTopic(chatID);

      let currIndex = user.index;
      if (user.index === -1) {
        const { latestIndex, nextIndex } = await this.utils.getLatestFeedIndex(
          this.bee,
          topic,
          user.address
        );
        currIndex = latestIndex === -1 ? nextIndex : latestIndex;
      }

      const feedReader = this.bee.makeFeedReader(
        "sequence",
        topic,
        user.address,
        { timeout: 1500 }
      );
      const recordPointer = await feedReader.download({ index: currIndex });

      const data = await this.bee.downloadData(recordPointer.reference, {
        headers: {
          "Swarm-Redundancy-Level": "0",
        },
      });
      const messageData = JSON.parse(
        new TextDecoder().decode(data)
      ) as MessageData;

      this.updateUserIndex(user.address, currIndex + 1);

      this.emitter.emit(EVENTS.RECEIVE_MESSAGE, messageData);
    } catch (error) {
      if (error instanceof Error) {
        this.handleError({
          error: error as unknown as Error,
          context: `readMessage`,
          throw: false,
        });
      }
    } finally {
      if (this.ownAddress === user.address) {
        this.emitter.emit(EVENTS.LOADING_INIT_USERS, false);
      }
    }
  }

  public async sendMessage(message: string): Promise<void> {
    const messageObj: MessageData = {
      message,
      id: uuidv4(),
      username: this.nickname,
      address: this.ownAddress,
      timestamp: Date.now(),
    };

    try {
      console.log("sendMessage - CALL", message);
      this.emitter.emit(EVENTS.MESSAGE_REQUEST_SENT, messageObj);

      const feedID = this.utils.generateUserOwnedFeedId(
        this.topic,
        this.ownAddress
      );
      const feedTopicHex = this.bee.makeFeedTopic(feedID);

      if (this.ownIndex === -1) {
        const { nextIndex } = await this.utils.getLatestFeedIndex(
          this.bee,
          feedTopicHex,
          this.ownAddress
        );
        this.ownIndex = nextIndex;
      } else {
        this.ownIndex += 1;
      }

      const msgData = await this.utils.uploadObjectToBee(
        this.bee,
        messageObj,
        this.stamp
      );
      if (!msgData) throw "Could not upload message data to bee";

      const feedWriter = this.bee.makeFeedWriter(
        "sequence",
        feedTopicHex,
        this.privateKey
      );

      await feedWriter.upload(this.stamp, msgData.reference, {
        index: this.ownIndex,
      });

      console.log("sendMessage - Message sent successfully");
    } catch (error) {
      this.emitter.emit(EVENTS.MESSAGE_REQUEST_ERROR, messageObj);
      this.handleError({
        error: error as unknown as Error,
        context: `sendMessage`,
        throw: false,
      });
    }
  }

  private updateUserIndex(address: EthAddress, index: number) {
    const userIndex = this.users.findIndex((user) => user.address === address);
    if (userIndex === -1) {
      throw new Error("User not found in users list");
    }
    const newUser = { ...this.users[userIndex], index };
    const newUsers = [...this.users];
    newUsers[userIndex] = newUser;
    this.setUsers(newUsers);
  }

  private setUsers(newUsers: UserWithIndex[]) {
    let success = false;
    do {
      if (!this.usersLoading) {
        this.usersLoading = true;
        this.users = newUsers;
        this.usersLoading = false;
        success = true;
      }
    } while (!success);
  }

  private emitStateEvent(event: string, value: any) {
    if (this.eventStates[event] !== value) {
      this.eventStates[event] = value;
      this.emitter.emit(event, value);
    }
  }

  public getUserCount() {
    return this.users.length;
  }

  private handleError(errObject: ErrorObject) {
    console.error(`Error in ${errObject.context}: ${errObject.error.message}`);
    this.emitter.emit(EVENTS.ERROR, errObject);
    if (errObject.throw) {
      throw new Error(`Error in ${errObject.context}`);
    }
  }
}
