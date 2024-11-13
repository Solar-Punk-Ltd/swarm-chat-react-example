// import { ethers, BytesLike, Wallet, hexlify } from "ethers";
import { InformationSignal } from "@anythread/gsoc";
import { BatchId } from "@ethersphere/bee-js";
import { Bytes, PrefixedHexString } from "./types";
import { HexString } from "@anythread/gsoc/dist/types";

function bytesToHex<Length extends number = number>(
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

function isHexString<Length extends number = number>(
  s: unknown,
  len?: number
): s is HexString<Length> {
  return (
    typeof s === "string" &&
    /^[0-9a-f]+$/i.test(s) &&
    (!len || s.length === len)
  );
}
function isPrefixedHexString(s: unknown): s is PrefixedHexString {
  return typeof s === "string" && /^0x[0-9a-f]+$/i.test(s);
}

function assertHexString<Length extends number = number>(
  s: unknown,
  len?: number,
  name = "value"
): asserts s is HexString<Length> {
  if (!isHexString(s, len)) {
    if (isPrefixedHexString(s)) {
      throw new TypeError(
        `${name} not valid non prefixed hex string (has 0x prefix): ${s}`
      );
    }

    // Don't display length error if no length specified in order not to confuse user
    const lengthMsg = len ? ` of length ${len}` : "";
    throw new TypeError(`${name} not valid hex string${lengthMsg}: ${s}`);
  }
}

function hexToBytes<Length extends number, LengthHex extends number = number>(
  hex: HexString<LengthHex>
): Bytes<Length> {
  assertHexString(hex);

  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    const hexByte = hex.substr(i * 2, 2);
    bytes[i] = parseInt(hexByte, 16);
  }

  return bytes as Bytes<Length>;
}

/**
 * @param url Bee url
 * @param stamp Valid stamp
 * @param gateway Overlay address of the gateway
 * @param topic Topic for the chat
 */
export function mineResourceId(
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
      hexToBytes(gateway),
      12
    );

    return bytesToHex(mineResult.resourceId);
  } catch (error) {
    console.log("mine error: ", error);
    return null;
  }
}

mineResourceId(
  "http://65.108.40.58:1633",
  "08b35489c8971aba284b8872153cd365e3fb2222aed9c546a3c8395c09e127cd" as BatchId,
  "62c698c418fc012be22b4fa739362882ae21e21b2bdb7edbb16728685809a272",
  "DOOMSDAYTOPIC"
);
