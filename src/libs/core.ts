import { ethers, Signature } from "ethers";
import { v4 as uuidv4 } from "uuid";
import { HexString } from "@solarpunkltd/gsoc/dist/types";

import { SwarmChatUtils } from "./utils";
import { EventEmitter } from "./eventEmitter";
import { Queue } from "./queue";

import {
  BeeType,
  ChatSettings,
  ErrorObject,
  EthAddress,
  GsocSubscribtion,
  UserWithIndex,
} from "./types";

import { EVENTS } from "./constants";
import { sleep } from "./common";
export class SwarmChat {
  private emitter = new EventEmitter();
  private utils = new SwarmChatUtils(this.handleError.bind(this));

  private bees;

  private messagesQueue = new Queue(
    { clearWaitTime: 200 },
    this.handleError.bind(this)
  );
  private gsocListenerQueue = new Queue(
    { clearWaitTime: 200 },
    this.handleError.bind(this)
  );

  private fetchMessageTimer: NodeJS.Timeout | null = null;
  private keepUserAliveTimer: NodeJS.Timeout | null = null;

  private KEEP_ALIVE_INTERVAL_TIME = 2000;
  private FETCH_MESSAGE_INTERVAL_TIME = 1000;
  private READ_MESSAGE_TIMEOUT = 1500;

  private users: Record<string, UserWithIndex> = {};
  private userIndexCache: Record<string, number> = {};
  private userPunishmentCache: Record<string, number> = {};
  private tempUser: UserWithIndex | null = null;

  private gsocResourceId: HexString<number> | null = null;
  private gsocSubscribtion: GsocSubscribtion | null = null;

  private privateKey: string;
  private ownAddress: EthAddress;
  private topic: string;
  private nickname: string;
  private ownIndex: number | null = null;

  constructor(settings: ChatSettings) {
    this.ownAddress = settings.ownAddress;
    this.privateKey = settings.privateKey;
    this.topic = settings.topic;
    this.nickname = settings.nickname;
    this.gsocResourceId = settings.gsocResourceId;
    this.bees = this.utils.initBees(settings.bees);
  }

  public stopListenToNewSubscribers() {
    if (this.gsocSubscribtion) {
      this.gsocSubscribtion.close();
      this.gsocSubscribtion = null;
    }
  }

  public startKeepMeAliveProcess() {
    this.keepUserAliveTimer = setInterval(
      this.keepUserAlive.bind(this),
      this.KEEP_ALIVE_INTERVAL_TIME
    );
  }

  public stopKeepMeAliveProcess() {
    if (this.keepUserAliveTimer) {
      clearInterval(this.keepUserAliveTimer);
      this.keepUserAliveTimer = null;
    }
  }

  public startMessagesFetchProcess() {
    this.fetchMessageTimer = setInterval(
      () => this.readMessagesForAll(),
      this.FETCH_MESSAGE_INTERVAL_TIME
    );
  }

  public stopMessagesFetchProcess() {
    if (this.fetchMessageTimer) {
      clearInterval(this.fetchMessageTimer);
      this.fetchMessageTimer = null;
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

      const bee = this.getReaderBee();
      const feedTopicHex = bee.makeFeedTopic(feedID);

      const { latestIndex } = await this.utils.getLatestFeedIndex(
        bee,
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
      if (!this.gsocResourceId) {
        throw new Error("GSOC Resource ID is not defined");
      }

      this.emitter.emit(EVENTS.LOADING_INIT_USERS, true);

      const bee = this.getMainGsocBee();
      this.gsocSubscribtion = this.utils.subscribeToGsoc(
        bee.url,
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
    const messageObj = {
      id: uuidv4(),
      username: this.nickname,
      address: this.ownAddress,
      timestamp: Date.now(),
      message,
    };

    try {
      if (this.ownIndex === null) {
        throw new Error("Cannot send message with null index");
      }

      console.log("sendMessage - CALL", message);
      this.emitter.emit(EVENTS.MESSAGE_REQUEST_SENT, messageObj);

      const feedID = this.utils.generateUserOwnedFeedId(
        this.topic,
        this.ownAddress
      );

      const { bee, stamp } = this.getWriterBee();

      const msgData = await this.utils.uploadObjectToBee(
        bee,
        messageObj,
        stamp
      );
      if (!msgData) throw "Could not upload message data to bee";

      const feedTopicHex = bee.makeFeedTopic(feedID);
      const feedWriter = bee.makeFeedWriter(
        "sequence",
        feedTopicHex,
        this.privateKey
      );

      const nextIndex = this.ownIndex === -1 ? 0 : this.ownIndex + 1;
      await feedWriter.upload(stamp, msgData.reference, {
        index: nextIndex,
      });

      this.ownIndex = nextIndex;
      // do not allow a new message till the latest is read
      while (!this.isUserIndexRead(this.ownAddress, this.ownIndex)) {
        await sleep(200);
      }
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
      if (!this.gsocResourceId) {
        throw new Error("GSOC Resource ID is not defined");
      }

      const index = this.getOwnIndex();
      if (index === null) {
        return;
      }

      const wallet = new ethers.Wallet(this.privateKey);
      const address = wallet.address as EthAddress;

      if (address.toLowerCase() !== this.ownAddress.toLowerCase()) {
        throw new Error(
          "The provided address does not match the address derived from the private key"
        );
      }

      if (this.checkUserPunishment(address)) {
        return;
      }

      const timestamp = Date.now();
      const signature = (await wallet.signMessage(
        JSON.stringify({ username: this.nickname, address, timestamp })
      )) as unknown as Signature;

      const newUser = {
        address,
        timestamp,
        signature,
        index,
        username: this.nickname,
      };

      if (!this.utils.validateUserObject(newUser)) {
        throw new Error("User object validation failed");
      }

      const { bee, stamp } = this.getGsocBee();

      const result = await this.utils.sendMessageToGsoc(
        bee.url,
        stamp,
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
    }
  }

  public orderMessages(messages: any[]) {
    return this.utils.orderMessages(messages);
  }

  private isUserIndexRead(userAddress: string, checkIndex: number) {
    const targetIndex = this.userIndexCache[userAddress];
    return targetIndex === checkIndex;
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
      if (now - user.timestamp > 30000) {
        delete this.users[user.address];
      }
    }
  }

  private setUser(user: UserWithIndex) {
    this.users[user.address] = user;
  }

  private checkUserPunishment(userAddress: string) {
    const count = this.userPunishmentCache[userAddress];
    if (count > 0) {
      this.userPunishmentCache[userAddress]--;
      return true;
    }
    return false;
  }

  private userRegistrationOnGsoc(gsocMessage: string) {
    try {
      this.removeIdleUsers();

      let user: UserWithIndex;
      try {
        user = JSON.parse(gsocMessage) as UserWithIndex;
      } catch (parseError) {
        console.error("Invalid GSOC message format:", gsocMessage);
        return;
      }

      if (
        this.tempUser?.address === user.address &&
        Object.keys(this.users).length > 1
      ) {
        // Only apply punishment if more than one user exists
        this.userPunishmentCache[user.address] =
          (this.userPunishmentCache[user.address] || 0) + 1;
        return;
      }

      if (!this.utils.validateUserObject(user)) {
        console.warn("Invalid user object:", user);
        return;
      }

      console.log("userRegistrationOnGsoc - User object", user);

      this.setUser(user);
      this.tempUser = user;
    } catch (error) {
      this.handleError({
        error: error as Error,
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
      const isIndexRead = this.isUserIndexRead(user.address, user.index);
      if (isIndexRead) {
        return;
      }

      console.log("ACTUAL READ");

      const bee = this.getReaderBee();

      const chatID = this.utils.generateUserOwnedFeedId(rawTopic, user.address);
      const topic = bee.makeFeedTopic(chatID);
      const feedReader = bee.makeFeedReader("sequence", topic, user.address, {
        timeout: this.READ_MESSAGE_TIMEOUT,
      });

      const recordPointer = await feedReader.download({ index: user.index });
      const data = await bee.downloadData(recordPointer.reference, {
        headers: {
          "Swarm-Redundancy-Level": "0",
        },
      });
      const messageData = JSON.parse(new TextDecoder().decode(data));

      this.emitter.emit(EVENTS.MESSAGE_RECEIVED, messageData);
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

  private getMainGsocBee() {
    const { bee } = this.utils.selectBee(this.bees, BeeType.GSOC, true);
    if (!bee) {
      throw new Error("Could not get main GSOC bee");
    }
    return bee;
  }

  private getGsocBee() {
    const { bee, stamp } = this.utils.selectBee(this.bees, BeeType.GSOC);
    if (!bee) {
      throw new Error("Could not get GSOC bee");
    }
    if (!stamp) {
      throw new Error("Could not get valid gsoc stamp");
    }
    return { bee, stamp };
  }

  private getReaderBee() {
    const { bee } = this.utils.selectBee(this.bees, BeeType.READER);
    if (!bee) {
      throw new Error("Could not get reader bee");
    }
    return bee;
  }

  private getWriterBee() {
    const { bee, stamp } = this.utils.selectBee(this.bees, BeeType.WRITER);
    if (!bee) {
      throw new Error("Could not get writer bee");
    }
    if (!stamp) {
      throw new Error("Could not get valid writer stamp");
    }
    return { bee, stamp };
  }

  private handleError(errObject: ErrorObject) {
    console.error(`Error in ${errObject.context}: ${errObject.error.message}`);
    this.emitter.emit(EVENTS.ERROR, errObject);
    if (errObject.throw) {
      throw new Error(`Error in ${errObject.context}`);
    }
  }
}
