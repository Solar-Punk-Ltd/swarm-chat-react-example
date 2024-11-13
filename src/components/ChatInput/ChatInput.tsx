import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import "./ChatInput.scss";
import { EthAddress, MessageData, SwarmChat } from "../../libs";
import { BatchId } from "@ethersphere/bee-js";
import SendIcon from "../icons/SendIcon/SendIcon";
import { MessageWithThread, ThreadId } from "../types/message";
import { randomThreadId, handleKeyDown } from "../utils/helpers";
import InputLoading from "./InputLoading/InputLoading";

interface ChatInputProps {
  chat: SwarmChat | null;
  ownAddress: EthAddress;
  nickname: string;
  topic: string;
  stamp: BatchId;
  privKey: string;
  currentThread: ThreadId | null;
  setBeingSentMessages: Dispatch<SetStateAction<MessageWithThread[]>>;
}

const ChatInput: React.FC<ChatInputProps> = ({
  chat,
  ownAddress,
  nickname,
  topic,
  stamp,
  privKey,
  currentThread,
  setBeingSentMessages,
}) => {
  const [messageToSend, setMessageToSend] = useState<string>("");
  const [reconnecting, setReconnecting] = useState<boolean>(false);
  const [sending, setSending] = useState<boolean>(false);

  const sendMessage = async () => {
    if (!messageToSend) return;
    if (!chat) return;

    const messageId = randomThreadId();
    const threadId = randomThreadId();

    const messageObj: MessageData = {
      message: JSON.stringify({
        text: messageToSend,
        threadId: currentThread ? null : threadId, // Only 1 level of thread is allowed, so if this is already a thread, you can't start a thread from here
        messageId, // Every message has an ID, for liking
        parent: currentThread, // This will be ThreadId (string) or null
      }),
      timestamp: Date.now(),
      username: nickname,
      address: ownAddress,
    };

    setBeingSentMessages((prevMessages) => {
      const newMessages = [
        ...prevMessages,
        {
          username: nickname,
          address: ownAddress,
          timestamp: messageObj.timestamp,
          message: messageToSend,
          threadId: threadId,
          beingSent: true,
          messageId,
          parent: currentThread,
          replyCount: 0,
          likeTable: {},
        },
      ];

      return newMessages;
    });

    if (!chat.isRegistered(ownAddress)) {
      setReconnecting(true);
      let rounds = 0;
      const EVERY_X_ROUND = 5; // Resend registration request every X round
      const MAX_ROUNDS = 60;

      if (rounds === MAX_ROUNDS) {
        console.error("Registration did not go through");
        setSending(false);
        setReconnecting(false);
        setBeingSentMessages([]);
        return;
      }

      setReconnecting(false); // this might not be accurate
    }

    setSending(true);
    await chat.sendMessage(ownAddress, topic, messageObj, stamp, privKey);
    setMessageToSend("");
    setSending(false);
  };

  useEffect(() => {
    if (!chat) return;
    return () => {
      chat.stopMessageFetchProcess();
    };
  }, []);

  if (!chat) return <></>;

  return (
    <div className="chat-input__wrapper">
      {reconnecting || sending ? (
        reconnecting ? (
          <div className="chat-input__connecting">
            {"Connecting to chat..."}
            <InputLoading />
          </div>
        ) : (
          sending && (
            <div className="chat-input__sending">
              <InputLoading />
            </div>
          )
        )
      ) : (
        <>
          <div className="chat-input">
            <input
              value={messageToSend}
              onChange={(e) => setMessageToSend(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, "Enter", sendMessage)}
              className="chat-input__input"
            />
            <button
              onClick={sendMessage}
              className="chat-input__send-button"
              disabled={reconnecting || sending}
            >
              {messageToSend !== "" ? (
                <SendIcon />
              ) : (
                <SendIcon color="#A5ADBA" />
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ChatInput;
