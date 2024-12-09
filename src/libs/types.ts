import { Signature } from "ethers";
import { BatchId } from "@ethersphere/bee-js";

import { ETH_ADDRESS_LENGTH } from "./constants";

type FlavoredType<Type, Name> = Type & {
  __tag__?: Name;
};
type HexString<Length extends number = number> = FlavoredType<
  string & {
    readonly length: Length;
  },
  "HexString"
>;

export interface Bytes<Length extends number> extends Uint8Array {
  readonly length: Length;
}

export type PrefixedHexString = FlavoredType<string, "PrefixedHexString">;

export interface GsocSubscribtion {
  close: () => void;
  gsocAddress: Bytes<32>;
}

export type EthAddress = HexString<typeof ETH_ADDRESS_LENGTH>;

export interface UserDetails {
  nick: string;
  address: EthAddress;
  key: string;
}

export interface MessageData {
  message: string;
  username: string;
  address: EthAddress;
  timestamp: number;
}

export interface VisibleMessage extends MessageData {
  sent: boolean;
}

export interface User {
  username: string;
  address: EthAddress;
  timestamp: number;
  signature: Signature;
}

export interface UsersFeedCommit {
  users: User[];
  overwrite: boolean;
}

export interface UsersFeedResponse {
  feedCommit: UsersFeedCommit;
  nextIndex: number;
}

export interface UserWithIndex extends User {
  index: number;
}

export type Sha3Message = string | number[] | ArrayBuffer | Uint8Array;

export interface ChatSettings {
  url: string;
  gsocResourceId: string;
  topic: string;
  stamp: BatchId;
  nickname: string;
  ownAddress: EthAddress;
  privateKey: string;
}
export interface ErrorObject {
  error: Error;
  context: string;
  throw: boolean;
}
