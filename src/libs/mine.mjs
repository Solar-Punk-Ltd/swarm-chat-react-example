// const { InformationSignal } = require("@solarpunkltd/gsoc");
import { InformationSignal } from "@anythread/gsoc";

function bytesToHex(bytes, len) {
  const hexByte = (n) => n.toString(16).padStart(2, "0");
  const hex = Array.from(bytes, hexByte).join("");

  if (len && hex.length !== len) {
    throw new TypeError(
      `Resulting HexString does not have expected length ${len}: ${hex}`
    );
  }

  return hex;
}

function isHexString(s, len) {
  return (
    typeof s === "string" &&
    /^[0-9a-f]+$/i.test(s) &&
    (!len || s.length === len)
  );
}
function isPrefixedHexString(s) {
  return typeof s === "string" && /^0x[0-9a-f]+$/i.test(s);
}

function assertHexString(s, len, name) {
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

function hexToBytes(hex) {
  assertHexString(hex);

  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    const hexByte = hex.substr(i * 2, 2);
    bytes[i] = parseInt(hexByte, 16);
  }

  return bytes;
}

/**
 * @param url Bee url
 * @param stamp Valid stamp
 * @param gateway Overlay address of the gateway
 * @param topic Topic for the chat
 */
function mineResourceId(url, stamp, gateway, topic) {
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

const result = mineResourceId(
  "http://65.108.40.58:1733",
  "d9a89178d4aba720c4c38f62f0980cf219efcfe307d565d352668cee1a96350f",
  "044607732392bd78beead28ba5f1bce71356a376ffe2c50ad51a844a179028f1",
  "DOOMSDAYTOPIC"
);

console.log("result: ", result);
