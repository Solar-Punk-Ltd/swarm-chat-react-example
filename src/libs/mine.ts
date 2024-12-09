import { InformationSignal } from "@solarpunkltd/gsoc";
import { BatchId } from "@ethersphere/bee-js";
import { Bytes, PrefixedHexString } from "./types";
import { HexString } from "@solarpunkltd/gsoc/dist/types";

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
 * @param overlay Overlay address of the node
 * @param topic Topic for the chat
 */
export function mineResourceId(
  url: string,
  stamp: BatchId,
  overlay: string,
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
      hexToBytes(overlay),
      12
    );

    return bytesToHex(mineResult.resourceId);
  } catch (error) {
    console.log("mine error: ", error);
    return null;
  }
}

mineResourceId(
  "http://65.108.40.58:1733",
  "d9a89178d4aba720c4c38f62f0980cf219efcfe307d565d352668cee1a96350f" as BatchId,
  "044607732392bd78beead28ba5f1bce71356a376ffe2c50ad51a844a179028f1",
  "DOOMSDAYTOPIC"
);
