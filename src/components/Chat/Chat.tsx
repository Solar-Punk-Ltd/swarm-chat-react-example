import React, { useEffect, useRef, useState } from "react";
import { Wallet } from "ethers";
import { BatchId } from "@ethersphere/bee-js";

import { EthAddress, EVENTS, MessageData, SwarmChat } from "../../libs";

import { ChatInput } from "../../components/ChatInput/ChatInput";
import { InputLoading } from "../../components/ChatInput/InputLoading/InputLoading";
import { ChatHeader } from "../../components/ChatHeader/ChatHeader";
import { NavigationHeader } from "../../components/NavigationHeader/NavigationHeader";
import { Messages } from "../Messages/Messages";

import "./Chat.scss";

interface ChatProps {
  title: string | undefined;
  topic: string;
  wallet: Wallet;
  stamp: BatchId;
  nickname: string;
  gsocResourceId: string;
  gateway?: string;
  topMenuColor?: string;
  activeNumber?: number;
  backAction: () => void | undefined | null;
}

const Chat: React.FC<ChatProps> = ({
  title,
  topic,
  wallet,
  stamp,
  nickname,
  gsocResourceId,
  activeNumber,
  backAction,
}) => {
  const chat = useRef<SwarmChat | null>(null);
  const allMessagesRef = useRef<any[]>([]);

  const [allMessages, setAllMessages] = useState<MessageData[]>([]);
  const [chatLoaded, setChatLoaded] = useState<boolean>(false);

  useEffect(() => {
    if (!chat.current) {
      const newChat = new SwarmChat({
        gsocResourceId,
        topic,
        stamp,
        nickname,
        url: "http://65.108.40.58:1733",
        ownAddress: wallet.address as EthAddress,
        privateKey: wallet.privateKey,
      });

      chat.current = newChat;

      newChat.listenToNewSubscribers();
      newChat.keepUserAlive();
      newChat.startMessagesFetchProcess();

      const { on } = newChat.getChatActions();
      on(EVENTS.RECEIVE_MESSAGE, (data) => {
        allMessagesRef.current = [...allMessagesRef.current, data];
        setAllMessages([...allMessagesRef.current]);
      });

      setChatLoaded(true);
    }

    return () => {
      if (chat.current) {
        chat.current.stopKeepMeAliveProcess();
        chat.current.stopMessagesFetchProcess();
        chat.current = null;
      }
    };
  }, []);

  const sendMessageToSwarm = async (message: string) => {
    chat.current?.sendMessage(message);
  };

  return (
    <div className="chat-page">
      <div className="chat-page__header">
        <NavigationHeader
          backgroundColor="#F1F2F4"
          to="/"
          saveQuestionBeforeLeave={true}
          handlerInCaseOfSave={backAction}
        />
        <ChatHeader category={title} activeVisitors={activeNumber} />
      </div>

      {chatLoaded && chat.current ? (
        <>
          <Messages messages={allMessages} nickname={nickname} />
          <ChatInput sendMessageToSwarm={sendMessageToSwarm} />
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
