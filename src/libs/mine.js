"use strict";
exports.__esModule = true;
exports.mineResourceId = void 0;
// import { ethers, BytesLike, Wallet, hexlify } from "ethers";
var gsoc_1 = require("@anythread/gsoc");
function bytesToHex(bytes, len) {
  var hexByte = function (n) {
    return n.toString(16).padStart(2, "0");
  };
  var hex = Array.from(bytes, hexByte).join("");
  if (len && hex.length !== len) {
    throw new TypeError(
      "Resulting HexString does not have expected length "
        .concat(len, ": ")
        .concat(hex)
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
  if (name === void 0) {
    name = "value";
  }
  if (!isHexString(s, len)) {
    if (isPrefixedHexString(s)) {
      throw new TypeError(
        ""
          .concat(name, " not valid non prefixed hex string (has 0x prefix): ")
          .concat(s)
      );
    }
    // Don't display length error if no length specified in order not to confuse user
    var lengthMsg = len ? " of length ".concat(len) : "";
    throw new TypeError(
      "".concat(name, " not valid hex string").concat(lengthMsg, ": ").concat(s)
    );
  }
}
function hexToBytes(hex) {
  assertHexString(hex);
  var bytes = new Uint8Array(hex.length / 2);
  for (var i = 0; i < bytes.length; i++) {
    var hexByte = hex.substr(i * 2, 2);
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
    var informationSignal = new gsoc_1.InformationSignal(url, {
      consensus: {
        id: "SwarmDecentralizedChat::".concat(topic),
        assertRecord: function (input) {
          return true;
        },
      },
      postage: stamp,
    });
    var mineResult = informationSignal.mineResourceId(hexToBytes(gateway), 12);
    return bytesToHex(mineResult.resourceId);
  } catch (error) {
    console.log("mine error: ", error);
    return null;
  }
}
exports.mineResourceId = mineResourceId;
const result = mineResourceId(
  "http://65.108.40.58:1733",
  "2d89dfa779b83ea3d9270186f5110e4410cfeb1ccfe8894ec6f372bb67a18ad1",
  "044607732392bd78beead28ba5f1bce71356a376ffe2c50ad51a844a179028f1",
  "DOOMSDAYTOPIC"
);

console.log("result: ", result);
