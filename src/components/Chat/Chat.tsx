import React from "react";
import { Wallet } from "ethers";
import { BatchId } from "@ethersphere/bee-js";

import { useSwarmChat } from "../../hooks/useSwarmChat";

import { Messages } from "../Messages/Messages";
import { ChatHeader } from "../../components/ChatHeader/ChatHeader";
import { ChatInput } from "../../components/ChatInput/ChatInput";
import { InputLoading } from "../../components/ChatInput/InputLoading/InputLoading";

import "./Chat.scss";

interface ChatProps {
  title?: string;
  topic: string;
  wallet: Wallet;
  stamp: BatchId;
  nickname: string;
  gsocResourceId: string;
}

const Chat: React.FC<ChatProps> = ({
  title,
  topic,
  wallet,
  stamp,
  nickname,
  gsocResourceId,
}) => {
  const { chatLoading, allMessages, sendMessage } = useSwarmChat({
    topic,
    stamp,
    nickname,
    gsocResourceId,
    wallet,
    url: "http://65.108.40.58:1733",
  });

  return (
    <div className="chat-page">
      <div className="chat-page__header">
        <ChatHeader category={title} />
      </div>

      {!chatLoading ? (
        <>
          <Messages messages={allMessages} ownAddress={wallet.address} />
          <ChatInput sendMessageToSwarm={sendMessage} />
        </>
      ) : (
        <div className="chat-page__loading">
          <div className="chat-page__loading__container">
            <InputLoading />
            <p>Loading chat...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;
