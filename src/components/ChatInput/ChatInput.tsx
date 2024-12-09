import React, { useState } from "react";

import { handleKeyDown } from "../utils/helpers";

import SendIcon from "../icons/SendIcon/SendIcon";
import { InputLoading } from "./InputLoading/InputLoading";

import "./ChatInput.scss";

interface ChatInputProps {
  sendMessageToSwarm: (message: string) => Promise<void>;
}

export const ChatInput: React.FC<ChatInputProps> = ({ sendMessageToSwarm }) => {
  const [message, setMessage] = useState<string>("");
  const [sendMessageLoading, setSendMessageLoading] = useState<boolean>(false);

  const sendMessage = async () => {
    if (!message) return;
    try {
      setSendMessageLoading(true);
      await sendMessageToSwarm(message);
    } finally {
      setMessage("");
      setSendMessageLoading(false);
    }
  };

  return (
    <div className="chat-input__wrapper">
      {sendMessageLoading ? (
        <div className="chat-input__sending">
          <InputLoading />
        </div>
      ) : (
        <>
          <div className="chat-input">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, "Enter", sendMessage)}
              className="chat-input__input"
            />
            <button
              className="chat-input__send-button"
              onClick={sendMessage}
              disabled={sendMessageLoading}
            >
              <SendIcon color={message !== "" ? "" : "#A5ADBA"} />
            </button>
          </div>
        </>
      )}
    </div>
  );
};
