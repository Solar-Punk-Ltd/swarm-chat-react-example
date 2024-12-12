import { Wallet, hexlify } from "ethers";
import { Utils } from "@ethersphere/bee-js";

export function getWallet(input: string): Wallet {
  const privateKey = Utils.keccak256Hash(input);
  return new Wallet(hexlify(privateKey));
}
