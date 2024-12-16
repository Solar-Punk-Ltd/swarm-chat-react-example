import { BatchId, Bee } from "@ethersphere/bee-js";
import { ethers, Signature } from "ethers";
import { v4 as uuidv4 } from "uuid";
import { HexString } from "@solarpunkltd/gsoc/dist/types";

import { SwarmChatUtils } from "./utils";
import { EventEmitter } from "./eventEmitter";
import { AsyncQueue } from "./asyncQueue";
import { Queue } from "./queue";

import {
  ChatSettings,
  ErrorObject,
  EthAddress,
  GsocSubscribtion,
  MessageData,
  UserWithIndex,
} from "./types";

import { EVENTS } from "./constants";
export class SwarmChat {
  private readerBee = new Bee("http://65.108.40.58:1633");
  private gsocBee = new Bee("http://65.108.40.58:1733");
  private writerBee = new Bee("http://65.108.40.58:1833");
  private emitter = new EventEmitter();

  private messagesQueue: AsyncQueue;
  private gsocMessagesQueue: AsyncQueue;
  private gsocListenerQueue: Queue;
  private users: Record<string, UserWithIndex> = {};
  private userIndexCache: Record<string, number> = {};
  private gsocResourceId: HexString<number> = "";
  private gsocSubscribtion: GsocSubscribtion | null = null;
  private fetchMessageInterval: NodeJS.Timeout | null = null;
  private keepUserAliveInterval: NodeJS.Timeout | null = null;
  private utils: SwarmChatUtils;
  private topic: string;
  private gsocStamp: BatchId;
  private writerStamp: BatchId;
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
    this.gsocResourceId = settings.gsocResourceId || "";
    this.emitter = new EventEmitter();

    this.utils = new SwarmChatUtils(this.handleError.bind(this));

    this.messagesQueue = new AsyncQueue(
      { waitable: true },
      this.handleError.bind(this)
    );
    this.gsocMessagesQueue = new AsyncQueue(
      { waitable: true },
      this.handleError.bind(this)
    );
    this.gsocListenerQueue = new Queue();

    this.gsocStamp =
      "76a6c300e0af507d6fbf18c027aa3c9a1736d438c52ab7257342d169c4c11d29" as BatchId;
    this.writerStamp =
      "7aaab1489af2b768795247c4ae51243abff454081d6dd9089d23fce6c93939d8" as BatchId;
    this.topic = settings.topic;
    this.nickname = settings.nickname;
    this.ownAddress = settings.ownAddress;
    this.privateKey = settings.privateKey;

    console.info(`SwarmChat created, version: v0.1.8 or above`);
  }

  public stopListenToNewSubscribers() {
    if (this.gsocSubscribtion) {
      this.gsocSubscribtion.close();
      this.gsocSubscribtion = null;
    }
  }

  public startKeepMeAliveProcess() {
    this.keepUserAliveInterval = setInterval(
      () => this.gsocMessagesQueue.enqueue(this.limitedKeepMeAlive.bind(this)),
      2000
    );
  }

  private async limitedKeepMeAlive() {
    const isWaiting = await this.gsocMessagesQueue.waitForProcessing();
    if (isWaiting) {
      return;
    }

    await this.keepUserAlive();
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
      1000
    );
  }

  public stopMessagesFetchProcess() {
    if (this.fetchMessageInterval) {
      clearInterval(this.fetchMessageInterval);
      this.fetchMessageInterval = null;
    }
  }

  public isUserRegistered(userAddress: EthAddress): boolean {
    return !!this.users[userAddress];
  }

  public getEmitter() {
    return this.emitter;
  }

  public async initSelfIndex() {
    try {
      const feedID = this.utils.generateUserOwnedFeedId(
        this.topic,
        this.ownAddress
      );
      const feedTopicHex = this.readerBee.makeFeedTopic(feedID);

      const { latestIndex } = await this.utils.getLatestFeedIndex(
        this.readerBee,
        feedTopicHex,
        this.ownAddress
      );

      this.ownIndex = latestIndex;
    } catch (error) {
      this.handleError({
        error: error as unknown as Error,
        context: `initSelfUserIndex`,
        throw: false,
      });
    }
  }

  public listenToNewSubscribers() {
    try {
      this.emitter.emit(EVENTS.LOADING_INIT_USERS, true);
      this.gsocSubscribtion = this.utils.subscribeToGsoc(
        this.gsocBee.url,
        this.gsocStamp,
        this.topic,
        this.gsocResourceId,
        (gsocMessage: string) =>
          this.gsocListenerQueue.enqueue(() =>
            this.userRegistrationOnGsoc(gsocMessage)
          )
      );
    } catch (error) {
      this.handleError({
        error: error as unknown as Error,
        context: `Could not create Users feed!`,
        throw: true,
      });
    }
  }

  public async sendMessage(message: string): Promise<void> {
    const messageObj: MessageData = {
      id: uuidv4(),
      username: this.nickname,
      address: this.ownAddress,
      timestamp: Date.now(),
      message,
    };

    try {
      console.log("sendMessage - CALL", message);
      this.emitter.emit(EVENTS.MESSAGE_REQUEST_SENT, messageObj);

      const feedID = this.utils.generateUserOwnedFeedId(
        this.topic,
        this.ownAddress
      );
      const feedTopicHex = this.writerBee.makeFeedTopic(feedID);

      const msgData = await this.utils.uploadObjectToBee(
        this.writerBee,
        messageObj,
        this.writerStamp
      );
      if (!msgData) throw "Could not upload message data to bee";

      const feedWriter = this.writerBee.makeFeedWriter(
        "sequence",
        feedTopicHex,
        this.privateKey
      );

      let nextIndex;
      if (this.ownIndex === -1) {
        nextIndex = 0;
      } else {
        nextIndex = this.ownIndex + 1;
      }

      await feedWriter.upload(this.writerStamp, msgData.reference, {
        index: nextIndex,
      });

      this.ownIndex = nextIndex;
      await this.gsocMessagesQueue.clearQueue();
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

      const newUser = {
        address,
        timestamp,
        signature,
        username: this.nickname,
        index: this.getOwnIndex(),
      };

      if (!this.utils.validateUserObject(newUser)) {
        throw new Error("User object validation failed");
      }

      const result = await this.utils.sendMessageToGsoc(
        this.gsocBee.url,
        this.gsocStamp,
        this.topic,
        this.gsocResourceId,
        JSON.stringify(newUser)
      );

      if (!result?.payload.length) throw "Error writing User object to GSOC!";
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

  private isUserIndexRead(user: UserWithIndex) {
    const userIndex = this.userIndexCache[user.address];
    return userIndex === user.index;
  }

  private setUserIndexCache(user: UserWithIndex) {
    this.userIndexCache[user.address] = user.index;
  }

  private getOwnIndex() {
    return this.ownIndex;
  }

  private removeIdleUsers() {
    const now = Date.now();
    for (const user of Object.values(this.users)) {
      if (now - user.timestamp > 10000) {
        delete this.users[user.address];
      }
    }
  }

  private updateUsers(user: UserWithIndex) {
    this.users[user.address] = user;
  }

  private userRegistrationOnGsoc(gsocMessage: string) {
    try {
      const user = JSON.parse(gsocMessage) as unknown as UserWithIndex;
      console.log("userRegistrationOnGsoc - User object", user);

      if (!this.utils.validateUserObject(user)) {
        throw new Error("User object validation failed");
      }

      this.updateUsers(user);
      //this.removeIdleUsers();
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
    if (isWaiting) {
      return;
    }

    for (const user of Object.values(this.users)) {
      this.messagesQueue.enqueue(() => this.readMessage(user, this.topic));
    }
  }

  private async readMessage(user: UserWithIndex, rawTopic: string) {
    try {
      if (user.index === -1) {
        return;
      }
      const isIndexRead = this.isUserIndexRead(user);
      if (isIndexRead) {
        return;
      }

      console.log("ACTUAL READ");

      const chatID = this.utils.generateUserOwnedFeedId(rawTopic, user.address);
      const topic = this.readerBee.makeFeedTopic(chatID);

      const feedReader = this.readerBee.makeFeedReader(
        "sequence",
        topic,
        user.address,
        { timeout: 1500 }
      );
      const recordPointer = await feedReader.download({ index: user.index });

      const data = await this.readerBee.downloadData(recordPointer.reference, {
        headers: {
          "Swarm-Redundancy-Level": "0",
        },
      });
      const messageData = JSON.parse(new TextDecoder().decode(data));

      this.emitter.emit(EVENTS.RECEIVE_MESSAGE, messageData);
      this.setUserIndexCache(user);
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

  private emitStateEvent(event: string, value: any) {
    if (this.eventStates[event] !== value) {
      this.eventStates[event] = value;
      this.emitter.emit(event, value);
    }
  }

  private handleError(errObject: ErrorObject) {
    console.error(`Error in ${errObject.context}: ${errObject.error.message}`);
    this.emitter.emit(EVENTS.ERROR, errObject);
    if (errObject.throw) {
      throw new Error(`Error in ${errObject.context}`);
    }
  }
}
