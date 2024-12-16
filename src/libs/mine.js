"use strict";

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
 * @param overlay Overlay address of the node
 * @param topic Topic for the chat
 */
function mineResourceId(url, stamp, overlay, topic) {
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
    var mineResult = informationSignal.mineResourceId(hexToBytes(overlay), 32);
    return bytesToHex(mineResult.resourceId);
  } catch (error) {
    console.log("mine error: ", error);
    return null;
  }
}

const result = mineResourceId(
  "http://65.108.40.58:1733",
  "df7e881a1e7c45abdaf31465b040c871596fd52a42e40f4b5860cfee873c5dd2",
  "044607732392bd78beead28ba5f1bce71356a376ffe2c50ad51a844a179028f1",
  "DOOMSDAYTOPIC"
);

console.log(result);
