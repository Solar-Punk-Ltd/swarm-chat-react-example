import React, { useEffect, useRef, useState } from "react";
import { Wallet } from "ethers";
import { BatchId } from "@ethersphere/bee-js";

import { EthAddress, EVENTS, SwarmChat } from "../../libs";
import { VisibleMessage } from "../../libs/types";

import { ChatInput } from "../../components/ChatInput/ChatInput";
import { InputLoading } from "../../components/ChatInput/InputLoading/InputLoading";
import { ChatHeader } from "../../components/ChatHeader/ChatHeader";
import { Messages } from "../Messages/Messages";

import "./Chat.scss";

interface ChatProps {
  title: string | undefined;
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
  const chat = useRef<SwarmChat | null>(null);
  const allMessagesRef = useRef<any[]>([]);

  const [allMessages, setAllMessages] = useState<VisibleMessage[]>([]);
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
      on(EVENTS.MESSAGE_REQUEST_SENT, (data) => {
        allMessagesRef.current = [
          ...allMessagesRef.current,
          {
            ...data,
            error: false,
            sent: false,
          },
        ];
        setAllMessages([...allMessagesRef.current]);
      });
      on(EVENTS.MESSAGE_REQUEST_ERROR, (data) => {
        const msgIndex = allMessagesRef.current.findIndex(
          (msg) => msg.id === data.id
        );
        allMessagesRef.current[msgIndex] = {
          ...allMessagesRef.current[msgIndex],
          error: true,
        };
        setAllMessages([...allMessagesRef.current]);
      });
      on(EVENTS.RECEIVE_MESSAGE, (data) => {
        const msgIndex = allMessagesRef.current.findIndex(
          (msg) => msg.id === data.id
        );
        if (msgIndex !== -1) {
          allMessagesRef.current[msgIndex] = {
            ...allMessagesRef.current[msgIndex],
            error: false,
            sent: true,
          };
        } else {
          allMessagesRef.current = [
            ...allMessagesRef.current,
            {
              ...data,
              error: false,
              sent: true,
            },
          ];
        }

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
        <ChatHeader category={title} />
      </div>

      {chatLoaded && chat.current ? (
        <>
          <Messages messages={allMessages} ownAddress={wallet.address} />
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
