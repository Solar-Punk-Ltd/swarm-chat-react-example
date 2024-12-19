import { Signature } from "ethers";
import { BatchId, Bee } from "@ethersphere/bee-js";

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

export interface MessageData {
  id: string;
  message: string;
  username: string;
  address: EthAddress;
  timestamp: number;
}

export interface VisibleMessage extends MessageData {
  error: boolean;
  sent: boolean;
}

export interface User {
  username: string;
  address: EthAddress;
  timestamp: number;
  signature: Signature;
}

export interface UserWithIndex extends User {
  index: number;
}

export type Sha3Message = string | number[] | ArrayBuffer | Uint8Array;

export enum BeeType {
  READER = "reader",
  WRITER = "writer",
  GSOC = "gsoc",
}
export interface BeeSettings {
  url: string;
  stamp?: BatchId;
  main?: boolean;
}

export interface BeeSelectionSettings {
  singleBee?: BeeSettings;
  multiBees?: BeeSettings[];
}

export interface MultiBees {
  gsoc: BeeSelectionSettings;
  reader?: BeeSelectionSettings;
  writer?: BeeSelectionSettings;
}

export interface Bees {
  singleBee?: BeeSettings;
  multiBees?: MultiBees;
}
export interface InitializedBee {
  bee: Bee;
  stamp?: BatchId;
  main?: boolean;
}

export interface InitializedBees {
  single?: InitializedBee;
  gsoc?: InitializedBee | InitializedBee[];
  reader?: InitializedBee | InitializedBee[];
  writer?: InitializedBee | InitializedBee[];
}

export interface ChatSettings {
  ownAddress: EthAddress;
  privateKey: string;
  nickname: string;
  topic: string;
  gsocResourceId: string;
  bees: Bees;
}
export interface ErrorObject {
  error: Error;
  context: string;
  throw: boolean;
}
