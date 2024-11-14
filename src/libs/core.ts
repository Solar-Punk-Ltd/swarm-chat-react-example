import { BatchId, Bee, Reference } from "@ethersphere/bee-js";
import { ethers, Signature } from "ethers";

import { RunningAverage, SwarmChatUtils } from "./utils";
import { EventEmitter } from "./eventEmitter";
import { AsyncQueue } from "./asyncQueue";

import {
  ChatSettings,
  ErrorObject,
  EthAddress,
  GsocSubscribtion,
  MessageData,
  User,
  UserActivity,
  UserDetails,
  UsersFeedCommit,
  UserWithIndex,
} from "./types";

import { EVENTS, MINUTE, SECOND } from "./constants";
import { HexString } from "@solarpunkltd/gsoc/dist/types";

/**
 * Swarm Decentralized Chat
 */
export class SwarmChat {
  /** Variables that will be constant for this SwarmChat instance */
  private USERS_FEED_TIMEOUT: number; // Timeout when writing UsersFeedCommit
  private IDLE_TIME = 1 * MINUTE; // User will be removed from readMessage loop after this time, until rejoin
  private USER_LIMIT = 20; // Maximum active users

  private USER_UPDATE_INTERVAL = 8 * SECOND; // User-side user update interval

  private MAX_TIMEOUT = 1200; // Max timeout in ms
  private INCREASE_LIMIT = 400; // When to increase max parallel request count (avg request time in ms)
  private DECREASE_LIMIT = 800; // When to decrease max parallel request count (avg request time in ms)

  private FETCH_INTERVAL_INCREASE_LIMIT = 1000; // Lower the frequency of message fetch
  private FETCH_INTERVAL_DECREASE_LIMIT = 800; // Higher frequency for message fetch
  private MESSAGE_FETCH_MIN = 300; // Lowest message fetch frequency (ms)
  private MESSAGE_FETCH_MAX = 8 * SECOND; // Highest message fetch frequency (ms)
  private F_STEP = 100; // Message fetch step (ms)

  /** Actual variables, like Bee instance, messages, analytics, user list, etc */
  private bee = new Bee("http://65.108.40.58:1733");
  private emitter = new EventEmitter();
  private messages: MessageData[] = [];
  private reqTimeAvg;
  private usersQueue: AsyncQueue;
  private messagesQueue: AsyncQueue;
  private users: UserWithIndex[] = [];
  private usersLoading = false;
  private usersFeedIndex: number = 0; // Will be overwritten on user-side, by initUsers
  private ownIndex: number = -2;
  private gateway: string = ""; // If this is true (exists), we are in gateway mode. This is the overlay address of the gateway
  private gsocResourceId: HexString<number> = ""; // ResourceID for the GSOC feed. This was mined. (only in gateway mode)
  private gsocSubscribtion: GsocSubscribtion | null = null; // The GSOC subscribtion, only gateway has this. If this is not null, you are the Gateway (only in gateway mode)
  private removeIdleUsersInterval: NodeJS.Timeout | null = null; // Streamer-side interval, for idle user removing
  private fetchUsersFeedInterval: NodeJS.Timeout | null = null; // User-side interval, for user fetching (object created by setInterval)
  private messageFetchClock: NodeJS.Timeout | null = null; // User-side interval, for message fetching (object created by setInterval)
  private mInterval: number = this.MESSAGE_FETCH_MIN * 3; // We initialize message fetch interval to higher than min, we don't know network conditions yet
  private messagesIndex = 0;
  private removeIdleIsRunning = false; // Avoid race conditions
  private userFetchIsRunning = false; // Wait for the previous getNewUsers to finish
  private userActivityTable: UserActivity = {}; // Used to remove inactive users
  private newlyRegisteredUsers: UserWithIndex[] = []; // keep track of fresh users
  private reqCount = 0; // Diagnostics only
  private utils: SwarmChatUtils;

  private eventStates: Record<string, boolean> = {
    // Which operation is in progress, if any
    loadingInitUsers: false,
    loadingUsers: false,
    loadingRegistration: false,
  };

  // Constructor, static variables will get value here
  constructor(
    settings: ChatSettings = {},
    beeInstance?: Bee,
    eventEmitter?: EventEmitter
  ) {
    this.bee = this.bee =
      beeInstance || new Bee(settings.url || "http://localhost:1633");
    this.gateway = settings.gateway || ""; // If exists, SwarmChat will run in gateway mode
    this.gsocResourceId = settings.gsocResourceId || ""; // When in gateway mode, normal nodes need to provide this
    this.emitter = eventEmitter || new EventEmitter();

    this.USERS_FEED_TIMEOUT = settings.usersFeedTimeout || 8 * SECOND; // Can adjust UsersFeedCommit write timeout, but higher values might cause SocketHangUp in Bee
    this.IDLE_TIME = settings.idleTime || 1 * MINUTE; // Can adjust idle time, after that, usser is inactive (messages not polled)
    this.USER_LIMIT = settings.userLimit || 20; // Overwrites IDLE_TIME, maximum active users

    this.USER_UPDATE_INTERVAL = settings.userUpdateInterval || 8 * SECOND; // Burnt-in value of user update interval (will not change)

    this.MAX_TIMEOUT = settings.maxTimeout || 1200; // Max timeout for read message, if too low, won't be able to read messages. Higher values will slow down the chat
    this.INCREASE_LIMIT = settings.maxParallelIncreaseLimit || 400; // Below this, max parallel request count of the messageQueue is increased
    this.DECREASE_LIMIT = settings.maxParallelDecreaseLimit || 800; // Above this, max parallel request count of the messageQueue is decreased

    this.FETCH_INTERVAL_INCREASE_LIMIT =
      settings.fetchIntervalIncreaseLimit || 1000; // Above this, message fetch interval is increased (lower frequency)
    this.FETCH_INTERVAL_DECREASE_LIMIT =
      settings.fetchIntervalDecreaseLimit || 800; // Below this, message fetch interval is decreased (higher frequency)
    this.MESSAGE_FETCH_MIN = settings.messageFetchMin || 300; // Lowest possible value for message fetch interval
    this.MESSAGE_FETCH_MAX = settings.messageFetchMax || 8 * SECOND; // Highest possible value for message fetch interval
    this.F_STEP = settings.fStep || 100; // When interval is changed, it is changed by this value

    this.utils = new SwarmChatUtils(this.handleError.bind(this)); // Initialize chat utils
    this.usersQueue = new AsyncQueue(
      { waitable: true, max: 1 },
      this.handleError.bind(this)
    );
    this.messagesQueue = new AsyncQueue(
      { waitable: true, max: 4 },
      this.handleError.bind(this)
    );
    this.reqTimeAvg = new RunningAverage(1000);

    console.info(`SwarmChat created, version: v0.1.8 or above`);
  }

  /** With getChatActions, it's possible to listen to events on front end or anywhere outside the library.
   *  The list of events are in the constants file, under EVENTS.
   *  Example setup:
   *  ```typescript
   *  const { on } = chat.getChatActions();
   *  on(EVENTS.RECEIVE_MESSAGE, async (newMessages: MessageData[]) => {
   *    // do something with the message
   *  });
   *  ``` */
  public getChatActions() {
    return {
      //startFetchingForNewUsers: this.tryUserFetch,      // i think these are obsolate
      //startLoadingNewMessages: this.readMessagesForAll,     // this as well
      on: this.emitter.on,
      off: this.emitter.off,
    };
  }

  public fetchCurrentIndexOfUserFeed() {}

  /** Creates the Users feed, which is necesarry for user registration, and to handle idle users. This will create a new chat room. */
  public async listenToNewSubscribers(
    topic: string,
    stamp: BatchId,
    resourceId: HexString
  ) {
    try {
      this.gsocResourceId = resourceId;
      this.gsocSubscribtion = await this.utils.subscribeToGsoc(
        this.bee.url,
        stamp,
        topic,
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

  /** The SwarmChat instance will start polling for messages for the active users. It will poll users' feeds in a loop. */
  public startMessageFetchProcess(topic: string) {
    if (this.messageFetchClock) {
      clearInterval(this.messageFetchClock);
    }
    this.messageFetchClock = setInterval(
      this.readMessagesForAll(topic),
      this.mInterval
    );
  }

  /** The SwarmChat instance will stop polling for new messages on users' own feeds. */
  public stopMessageFetchProcess() {
    if (this.messageFetchClock) {
      clearInterval(this.messageFetchClock);
      this.messageFetchClock = null;
    }
  }

  /** Checks if a given Ethereum address is registered or not (registered means active, others will read it's messages) */
  public isRegistered(userAddress: EthAddress): boolean {
    const findResult = this.users.find((user) => user.address === userAddress);
    return !!findResult;
  }

  /** Registers the user for chat, will create a UsersFeedCommit object, and will write it to the Users feed. Also used for reconnect. */
  public async keepMeRegistered(
    topic: string,
    { address: myAddress, key, stamp, nick: username }: UserDetails
  ) {
    try {
      this.emitStateEvent(EVENTS.LOADING_REGISTRATION, true);

      const wallet = new ethers.Wallet(key);
      const address = wallet.address as EthAddress;

      if (address.toLowerCase() !== myAddress.toLowerCase()) {
        throw new Error(
          "The provided address does not match the address derived from the private key"
        );
      }

      const alreadyRegistered = this.users.find(
        (user) => user.address === myAddress
      );

      if (alreadyRegistered) {
        console.info("User already registered");
        return;
      }

      const timestamp = Date.now();
      const signature = (await wallet.signMessage(
        JSON.stringify({ username, address, timestamp })
      )) as unknown as Signature;

      const newUser: User = {
        address,
        username,
        timestamp,
        signature,
      };

      if (!this.utils.validateUserObject(newUser)) {
        throw new Error("User object validation failed");
      }

      const result = await this.utils.sendMessageToGsoc(
        this.bee.url,
        stamp as BatchId,
        topic,
        this.gsocResourceId,
        JSON.stringify(newUser)
      );

      console.info("User registration result: ", result);
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

  /** Will give back timestamp-ordered messages */
  public orderMessages(messages: MessageData[]) {
    return this.utils.orderMessages(messages);
  }

  // Write a UsersFeedCommit to the Users feed, which might remove some inactive users from the readMessagesForAll loop
  private async writeUsersFeedCommit(
    topic: string,
    stamp: BatchId,
    activeUsers: UserWithIndex[]
  ) {
    try {
      console.info(
        "The user was selected for submitting the UsersFeedCommit! (removeIdleUsers)"
      );
      const usersToWrite = this.utils.removeDuplicateUsers(activeUsers);
      const uploadObject: UsersFeedCommit = {
        users: usersToWrite as UserWithIndex[],
        overwrite: true,
      };

      const userRef = await this.utils.uploadObjectToBee(
        this.bee,
        uploadObject,
        stamp as any
      );
      if (!userRef) throw new Error("Could not upload user list to bee");

      const feedWriter = this.utils.graffitiFeedWriterFromTopic(
        this.bee,
        topic,
        { timeout: this.USERS_FEED_TIMEOUT }
      );

      // new code
      if (!this.usersFeedIndex) {
        console.info("Fetching current index...");
        try {
          const currentIndex = await feedWriter.download();
          this.usersFeedIndex = this.utils.hexStringToNumber(
            currentIndex.feedIndexNext
          );
        } catch (error) {
          this.usersFeedIndex = 0;
          console.warn(`Couldn't fetch current index, we will use 0 as index.`);
        }
      }

      console.info("Writing UsersFeedCommit to index ", this.usersFeedIndex);
      let usersForLog = ""; //TODO remove after debugging
      usersToWrite.map((uObj) => {
        //TODO remove after debugging
        usersForLog = usersForLog.concat(` ${uObj.username}(${uObj.address})`);
      });
      console.info(
        `These users were written (${usersToWrite.length}):  ${usersForLog}\n`
      );
      await feedWriter.upload(stamp, userRef.reference, {
        index: this.usersFeedIndex,
      });
      this.usersFeedIndex++;
      console.debug("Upload was successful!");

      if (this.gateway) this.users = usersToWrite;
    } catch (error) {
      this.handleError({
        error: error as unknown as Error,
        context: `writeUsersFeedCommit`,
        throw: false,
      });
    }
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

      console.info(
        "\n------Length of users list at userRegisteredThroughGsoc: ",
        this.users
      );

      if (!this.isRegistered(user.address)) {
        const newList = [...this.users, user];
        this.setUsers(newList);
      }
    } catch (error) {
      this.handleError({
        error: error as unknown as Error,
        context: `userRegisteredThroughGsoc`,
        throw: false,
      });
    }
  }

  // Goes through the users object, and enqueues a readMessage for each assumably active user
  private readMessagesForAll(topic: string) {
    return async () => {
      const isWaiting = await this.messagesQueue.waitForProcessing();
      if (isWaiting) {
        return;
      }

      for (const user of this.users) {
        this.reqCount++;
        console.trace(
          `Request enqueued. Total request count: ${this.reqCount}`
        );
        this.messagesQueue.enqueue(() => this.readMessage(user, topic));
      }
    };
  }

  // Reads one message, from a user's own feed
  private async readMessage(user: UserWithIndex, rawTopic: string) {
    try {
      const chatID = this.utils.generateUserOwnedFeedId(rawTopic, user.address);
      const topic = this.bee.makeFeedTopic(chatID);

      let currIndex = user.index;
      if (user.index === -1) {
        console.info("No index found! (user.index in readMessage)");
        const { latestIndex, nextIndex } = await this.utils.getLatestFeedIndex(
          this.bee,
          topic,
          user.address
        );
        currIndex = latestIndex === -1 ? nextIndex : latestIndex;
      }

      this.adjustParamerets(rawTopic);

      // We measure the request time with the first Bee API request, with the second request, we do not do this, because it is very similar
      const feedReader = this.bee.makeFeedReader(
        "sequence",
        topic,
        user.address,
        { timeout: this.MAX_TIMEOUT }
      );
      const start = Date.now();
      const recordPointer = await feedReader.download({ index: currIndex });
      const end = Date.now();
      this.reqTimeAvg.addValue(end - start);

      // We download the actual message data
      const data = await this.bee.downloadData(recordPointer.reference, {
        headers: {
          "Swarm-Redundancy-Level": "0",
        },
      });
      const messageData = JSON.parse(
        new TextDecoder().decode(data)
      ) as MessageData;

      const uIndex = this.users.findIndex((u) => u.address === user.address);
      const newUsers = this.users;
      if (newUsers[uIndex]) newUsers[uIndex].index = currIndex + 1; // If this User was dropped, we won't increment it's index, but Streamer will
      this.setUsers(newUsers);

      // If the message is relatively new, we insert it to messages array, otherwise, we drop it
      if (messageData.timestamp + this.IDLE_TIME * 2 > Date.now()) {
        this.messages.push(messageData);

        this.messagesIndex++;
      }

      // TODO - discuss with the team
      /*if (messages.length > 300) {
        messages.shift();
      }*/

      this.emitter.emit(EVENTS.RECEIVE_MESSAGE, this.messages);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("timeout")) {
          console.info(
            `Timeout of ${this.MAX_TIMEOUT} exceeded for readMessage.`
          );
        } else {
          if (!this.utils.isNotFoundError(error)) {
            if (this.userActivityTable[user.address])
              this.userActivityTable[user.address].readFails++; // We increment read fail count
            this.handleError({
              error: error as unknown as Error,
              context: `readMessage`,
              throw: false,
            });
          }
        }
      }
    }
  }

  // Adjusts maxParallel and message fetch interval
  //TODO this might be an utils function, but we need to pass a lot of paramerers, and in the other direction as well (return)
  private adjustParamerets(topic: string) {
    // Adjust max parallel request count, based on avg request time, which indicates, how much the node is overloaded
    if (this.reqTimeAvg.getAverage() > this.DECREASE_LIMIT)
      this.messagesQueue.decreaseMax();
    if (this.reqTimeAvg.getAverage() < this.INCREASE_LIMIT)
      this.messagesQueue.increaseMax(this.users.length * 1);

    // Adjust message fetch interval
    if (this.reqTimeAvg.getAverage() > this.FETCH_INTERVAL_INCREASE_LIMIT) {
      if (this.mInterval + this.F_STEP <= this.MESSAGE_FETCH_MAX) {
        this.mInterval = this.mInterval + this.F_STEP;
        if (this.messageFetchClock) clearInterval(this.messageFetchClock);
        this.messageFetchClock = setInterval(
          this.readMessagesForAll(topic),
          this.mInterval
        );
        console.info(
          `Increased message fetch interval to ${this.mInterval} ms`
        );
      }
    }
    if (this.reqTimeAvg.getAverage() < this.FETCH_INTERVAL_DECREASE_LIMIT) {
      if (this.mInterval - this.F_STEP > this.MESSAGE_FETCH_MIN) {
        this.mInterval = this.mInterval - this.F_STEP;
        if (this.messageFetchClock) clearInterval(this.messageFetchClock);
        this.messageFetchClock = setInterval(
          this.readMessagesForAll(topic),
          this.mInterval
        );
        console.info(
          `Decreased message fetch interval to ${
            this.mInterval - this.F_STEP
          } ms`
        );
      }
    }
  }

  /** Sends a message to the user's own feed. Topic is room topic. */
  public async sendMessage(
    address: EthAddress,
    topic: string,
    messageObj: MessageData,
    stamp: BatchId,
    privateKey: string
  ): Promise<Reference | undefined> {
    try {
      if (!privateKey) throw "Private key is missing";

      const feedID = this.utils.generateUserOwnedFeedId(topic, address);
      const feedTopicHex = this.bee.makeFeedTopic(feedID);

      if (this.ownIndex === -2) {
        const { nextIndex } = await this.utils.getLatestFeedIndex(
          this.bee,
          feedTopicHex,
          address
        );
        this.ownIndex = nextIndex;
      }

      const msgData = await this.utils.uploadObjectToBee(
        this.bee,
        messageObj,
        stamp
      );
      if (!msgData) throw "Could not upload message data to bee";

      const feedWriter = this.bee.makeFeedWriter(
        "sequence",
        feedTopicHex,
        privateKey
      );
      const ref = await feedWriter.upload(stamp, msgData.reference, {
        index: this.ownIndex,
      });
      this.ownIndex++;

      return ref;
    } catch (error) {
      this.handleError({
        error: error as unknown as Error,
        context: `sendMessage, index: ${this.ownIndex}, message: ${messageObj.message}`,
        throw: false,
      });
    }
  }

  // Writes the users object, will avoid collision with other write operation
  // Would cause a hot loop if usersLoading would be true, but we don't expect that to happen
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

  // Emit event about state change
  private emitStateEvent(event: string, value: any) {
    if (this.eventStates[event] !== value) {
      this.eventStates[event] = value;
      this.emitter.emit(event, value);
    }
  }

  /** Returns the user count, these users are being polled */
  public getUserCount() {
    return this.users.length;
  }

  private handleError(errObject: ErrorObject) {
    console.error(`Error in ${errObject.context}: ${errObject.error.message}`);
    this.emitter.emit(EVENTS.ERROR, errObject);
    if (errObject.throw) {
      throw new Error(` Error in ${errObject.context}`);
    }
  }

  /**
   * Change the log level for this SwarmChat instance
   * @param newLogLevel Possible values: "fatal" | "error" | "warn" | "info" | "debug" | "trace" | "silent"
   */
  public changeLogLevel(newLogLevel: string) {
    const possibleLevels = [
      "fatal",
      "error",
      "warn",
      "info",
      "debug",
      "trace",
      "silent",
    ];

    if (!possibleLevels.includes(newLogLevel)) {
      this.handleError({
        error: new Error("The provided log level does not exist"),
        context: "changeLogLevel",
        throw: false,
      });
      return;
    }
  }

  /**
   * Change bee url
   */
  public changeBeeUrl(newUrl: string) {
    this.bee = new Bee(newUrl);
  }

  /** Gives back diagnostic data about the SwarmChat instance */
  public getDiagnostics() {
    return {
      requestTimeAvg: this.reqTimeAvg,
      users: this.users,
      currentMessageFetchInterval: this.mInterval,
      maxParallel: this.messagesQueue.getMaxParallel(),
      userActivityTable: this.userActivityTable,
      newlyResigeredUsers: this.newlyRegisteredUsers,
      requestCount: this.reqCount,
    };
  }
}
