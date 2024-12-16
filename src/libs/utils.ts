import { ethers, BytesLike, Wallet, hexlify } from "ethers";
import {
  BatchId,
  Bee,
  BeeRequestOptions,
  FeedReader,
  Signer,
  UploadResult,
  Utils,
} from "@ethersphere/bee-js";
import { InformationSignal } from "@solarpunkltd/gsoc";
import { HexString } from "@solarpunkltd/gsoc/dist/types";
import { SingleOwnerChunk } from "@solarpunkltd/gsoc/dist/soc";
import { FetchFeedUpdateResponse } from "@ethersphere/bee-js/dist/types/modules/feed";

import {
  Bytes,
  ErrorObject,
  EthAddress,
  MessageData,
  PrefixedHexString,
  Sha3Message,
} from "./types";
import { CONSENSUS_ID, HEX_RADIX } from "./constants";

export class SwarmChatUtils {
  private handleError: (errObject: ErrorObject) => void;

  constructor(handleError: (errObject: ErrorObject) => void) {
    this.handleError = handleError;
  }

  generateUsersFeedId(topic: string) {
    return `${topic}_EthercastChat_Users`;
  }

  generateUserOwnedFeedId(topic: string, userAddress: EthAddress) {
    return `${topic}_EthercastChat_${userAddress}`;
  }

  validateUserObject(user: any): boolean {
    try {
      if (typeof user.username !== "string")
        throw "username should be a string";
      if (typeof user.address !== "string") throw "address should be a string";
      if (typeof user.timestamp !== "number")
        throw "timestamp should be number";
      if (typeof user.signature !== "string")
        throw "signature should be a string";

      // Check for absence of extra properties
      const allowedProperties = [
        "username",
        "address",
        "timestamp",
        "signature",
        "index",
      ];
      const extraProperties = Object.keys(user).filter(
        (key) => !allowedProperties.includes(key)
      );
      if (extraProperties.length > 0) {
        throw `Unexpected properties found: ${extraProperties.join(", ")}`;
      }

      // Create the message that is signed, and validate the signature
      const message = {
        username: user.username,
        address: user.address,
        timestamp: user.timestamp,
      };

      const returnedAddress = ethers.verifyMessage(
        JSON.stringify(message),
        user.signature
      );
      if (returnedAddress !== user.address)
        throw "Signature verification failed!";

      return true;
    } catch (error) {
      this.handleError({
        error: error as unknown as Error,
        context: "This User object is not correct",
        throw: false,
      });

      return false;
    }
  }

  // Returns timesstamp ordered messages
  orderMessages(messages: MessageData[]) {
    return messages.sort((a, b) => a.timestamp - b.timestamp);
  }

  // getConsensualPrivateKey will generate a private key, that is used for the Graffiti-feed (which is a public feed, for user registration)
  getConsensualPrivateKey(resource: Sha3Message) {
    if (Utils.isHexString(resource) && resource.length === 64) {
      return Utils.hexToBytes(resource);
    }

    return Utils.keccak256Hash(resource);
  }

  getGraffitiWallet(consensualPrivateKey: BytesLike) {
    const privateKeyBuffer = hexlify(consensualPrivateKey);
    return new Wallet(privateKeyBuffer);
  }

  serializeGraffitiRecord(record: Record<any, any>) {
    return new TextEncoder().encode(JSON.stringify(record));
  }

  numberToFeedIndex(index: number) {
    const bytes = new Uint8Array(8);
    const dv = new DataView(bytes.buffer);
    dv.setUint32(4, index);

    return Utils.bytesToHex(bytes);
  }

  sleep(delay: number) {
    return new Promise((resolve) => {
      setTimeout(resolve, delay);
    });
  }

  incrementHexString(hexString: string, i = 1n) {
    const num = BigInt("0x" + hexString);
    return (num + i).toString(HEX_RADIX).padStart(HEX_RADIX, "0");
  }

  hexStringToNumber(hexString: string) {
    return Number("0x" + hexString);
  }

  async fetchFeedData(
    bee: Bee,
    feedReader: FeedReader,
    i?: number
  ): Promise<{ nextIndex: number; feedData: any } | null> {
    try {
      let feedEntry: FetchFeedUpdateResponse;
      let nextIndex: number;

      if (i === undefined) {
        feedEntry = await feedReader.download();
        nextIndex = parseInt(feedEntry.feedIndexNext, HEX_RADIX);
      } else {
        if (i < 0) throw "Index out of range!";
        feedEntry = await feedReader.download({ index: i });
        nextIndex = i + 1;
      }

      const data = await bee.downloadData(feedEntry.reference);
      const jsonFeedData = data.json();

      return {
        feedData: jsonFeedData,
        nextIndex,
      };
    } catch (error) {
      this.handleError({
        error: error as unknown as Error,
        context: `fetchFeedAtIndex`,
        throw: false,
      });

      return null;
    }
  }

  // retryAwaitableAsync will retry a promise if fails, default retry number is 3, default delay between attempts is 250 ms
  async retryAwaitableAsync<T>(
    fn: () => Promise<T>,
    retries: number = 3,
    delay: number = 250
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      fn()
        .then(resolve)
        .catch((error) => {
          if (retries > 0) {
            console.info(
              `Retrying... Attempts left: ${retries}. Error: ${error.message}`
            );
            setTimeout(() => {
              this.retryAwaitableAsync(fn, retries - 1, delay)
                .then(resolve)
                .catch(reject);
            }, delay);
          } else {
            this.handleError({
              error: error as unknown as Error,
              context: `Failed after ${retries} initial attempts. Last error: ${error.message}`,
              throw: false,
            });
            reject(error);
          }
        });
    });
  }

  // Uploads a js object to Swarm, a valid stamp needs to be provided
  async uploadObjectToBee(
    bee: Bee,
    jsObject: object,
    stamp: BatchId
  ): Promise<UploadResult | null> {
    try {
      const result = await bee.uploadData(
        stamp as any,
        this.serializeGraffitiRecord(jsObject),
        { redundancyLevel: 4 }
      );
      return result;
    } catch (error) {
      this.handleError({
        error: error as unknown as Error,
        context: `uploadObjectToBee`,
        throw: false,
      });
      return null;
    }
  }

  // Creates a Graffiti feed writer from provided topic, Bee request options can be provided, e.g. timeout
  graffitiFeedWriterFromTopic(
    bee: Bee,
    topic: string,
    options?: BeeRequestOptions
  ) {
    const { consensusHash, graffitiSigner } =
      this.generateGraffitiFeedMetadata(topic);
    return bee.makeFeedWriter(
      "sequence",
      consensusHash,
      graffitiSigner,
      options
    );
  }

  // Creates a Graffiti feed reader from provided topic, Bee request options can be provided, e.g. timeout
  graffitiFeedReaderFromTopic(
    bee: Bee,
    topic: string,
    options?: BeeRequestOptions
  ) {
    const { consensusHash, graffitiSigner } =
      this.generateGraffitiFeedMetadata(topic);
    return bee.makeFeedReader(
      "sequence",
      consensusHash,
      graffitiSigner.address,
      options
    );
  }

  // generateGraffitiFeedMetadata will give back a consensus hash, and a Signer, from provided topic
  generateGraffitiFeedMetadata(topic: string) {
    const roomId = this.generateUsersFeedId(topic);
    const privateKey = this.getConsensualPrivateKey(roomId);
    const wallet = this.getGraffitiWallet(privateKey);

    const graffitiSigner: Signer = {
      address: Utils.hexToBytes(wallet.address.slice(2)),
      sign: async (data: any) => {
        return await wallet.signMessage(data);
      },
    };

    const consensusHash = Utils.keccak256Hash(CONSENSUS_ID);

    return {
      consensusHash,
      graffitiSigner,
    };
  }

  // getLatestFeedIndex will give back latestIndex and nextIndex, if download succeeds, if not, latestIndex will be -1, and nextIndex is 0
  async getLatestFeedIndex(bee: Bee, topic: string, address: EthAddress) {
    try {
      const feedReader = bee.makeFeedReader("sequence", topic, address);
      const feedEntry = await feedReader.download();
      const latestIndex = parseInt(feedEntry.feedIndex.toString(), HEX_RADIX);
      const nextIndex = parseInt(feedEntry.feedIndexNext, HEX_RADIX);

      return { latestIndex, nextIndex };
    } catch (error) {
      if (this.isNotFoundError(error)) {
        return { latestIndex: -1, nextIndex: 0 };
      }
      throw error;
    }
  }

  // TODO: why bee-js do this?
  // status is undefined in the error object
  // Determines if the error is about 'Not Found'
  isNotFoundError(error: any) {
    return (
      error.stack.includes("404") ||
      error.message.includes("Not Found") ||
      error.message.includes("404")
    );
  }

  /** GSOC UTILS */
  private isHexString<Length extends number = number>(
    s: unknown,
    len?: number
  ): s is HexString<Length> {
    return (
      typeof s === "string" &&
      /^[0-9a-f]+$/i.test(s) &&
      (!len || s.length === len)
    );
  }

  private isPrefixedHexString(s: unknown): s is PrefixedHexString {
    return typeof s === "string" && /^0x[0-9a-f]+$/i.test(s);
  }

  private assertHexString<Length extends number = number>(
    s: unknown,
    len?: number,
    name = "value"
  ): asserts s is HexString<Length> {
    if (!this.isHexString(s, len)) {
      if (this.isPrefixedHexString(s)) {
        throw new TypeError(
          `${name} not valid non prefixed hex string (has 0x prefix): ${s}`
        );
      }

      // Don't display length error if no length specified in order not to confuse user
      const lengthMsg = len ? ` of length ${len}` : "";
      throw new TypeError(`${name} not valid hex string${lengthMsg}: ${s}`);
    }
  }

  private hexToBytes<Length extends number, LengthHex extends number = number>(
    hex: HexString<LengthHex>
  ): Bytes<Length> {
    this.assertHexString(hex);

    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
      const hexByte = hex.substr(i * 2, 2);
      bytes[i] = parseInt(hexByte, 16);
    }

    return bytes as Bytes<Length>;
  }

  private bytesToHex<Length extends number = number>(
    bytes: Uint8Array,
    len?: Length
  ): HexString<Length> {
    const hexByte = (n: number) => n.toString(16).padStart(2, "0");
    const hex = Array.from(bytes, hexByte).join("") as HexString<Length>;

    if (len && hex.length !== len) {
      throw new TypeError(
        `Resulting HexString does not have expected length ${len}: ${hex}`
      );
    }

    return hex;
  }

  /**
   * @param url Bee url
   * @param stamp Valid stamp
   * @param gateway Overlay address of the gateway
   * @param topic Topic for the chat
   */
  mineResourceId(
    url: string,
    stamp: BatchId,
    gateway: string,
    topic: string
  ): HexString<number> | null {
    try {
      const informationSignal = new InformationSignal(url, {
        consensus: {
          id: `SwarmDecentralizedChat::${topic}`,
          assertRecord: (input) => {
            return true;
          },
        },
        postage: stamp,
      });

      const mineResult = informationSignal.mineResourceId(
        this.hexToBytes(gateway),
        24
      );

      return this.bytesToHex(mineResult.resourceId);
    } catch (error) {
      this.handleError({
        error: error as unknown as Error,
        context: `mineResourceId`,
        throw: true,
      });
      return null;
    }
  }

  subscribeToGsoc(
    url: string,
    stamp: BatchId,
    topic: string,
    resourceId: HexString<number>,
    callback: (gsocMessage: string) => void
  ) {
    try {
      if (!resourceId) throw "ResourceID was not provided!";

      const informationSignal = new InformationSignal(url, {
        consensus: {
          id: `SwarmDecentralizedChat::${topic}`,
          assertRecord: (rawText) => {
            const receivedObject = JSON.parse(rawText as unknown as string);
            const isValid = this.validateUserObject(receivedObject);
            return isValid;
          },
        },
        postage: stamp,
      });

      const gsocSub = informationSignal.subscribe(
        {
          onMessage: callback,
          onError: console.log,
        },
        resourceId
      );

      return gsocSub;
    } catch (error) {
      this.handleError({
        error: error as unknown as Error,
        context: `subscribeToGSOC`,
        throw: true,
      });
      return null;
    }
  }

  async sendMessageToGsoc(
    url: string,
    stamp: BatchId,
    topic: string,
    resourceId: HexString<number>,
    message: string
  ): Promise<SingleOwnerChunk | undefined> {
    try {
      if (!resourceId) throw "ResourceID was not provided!";

      const informationSignal = new InformationSignal(url, {
        consensus: {
          id: `SwarmDecentralizedChat::${topic}`,
          assertRecord: (input) => {
            return true;
          },
        },
        postage: stamp,
      });

      const uploadedSoc = await informationSignal.write(message, resourceId, {
        timeout: 800,
      });

      return uploadedSoc;
    } catch (error) {
      this.handleError({
        error: error as unknown as Error,
        context: `sendMessageToGSOC`,
        throw: false,
      });
    }
  }
}
