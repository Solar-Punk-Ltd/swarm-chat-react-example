"use strict";
exports.__esModule = true;
exports.ETH_ADDRESS_LENGTH = exports.HEX_RADIX = exports.HOUR = exports.MINUTE = exports.SECOND = exports.EVENTS = exports.CONSENSUS_ID = exports.FIRST_SEGMENT_INDEX = void 0;
exports.FIRST_SEGMENT_INDEX = "0000000000000000";
// Consensus ID is used for the Graffiti feed, that is handling user registration
exports.CONSENSUS_ID = "SwarmStream";
// Chat events, used together with getChatActions
exports.EVENTS = {
    LOADING_INIT_USERS: "loadingInitUsers",
    LOADING_USERS: "loadingUsers",
    LOADING_REGISTRATION: "loadingRegistration",
    RECEIVE_MESSAGE: "receiveMessage",
    USER_REGISTERED: "userRegistered",
    FEED_COMMIT_HASH: "feedCommitHash",
    ERROR: "errorEvent"
};
exports.SECOND = 1000;
exports.MINUTE = exports.SECOND * 60;
exports.HOUR = exports.MINUTE * 60;
exports.HEX_RADIX = 16;
exports.ETH_ADDRESS_LENGTH = 42;
