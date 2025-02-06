import { useEffect, useRef, useState } from "react";
import { Wallet } from "ethers";

import {
  EVENTS,
  SwarmChat,
  Bees,
  EthAddress,
  VisibleMessage,
} from "@solarpunkltd/swarm-chat-js";

interface UseSwarmChatParams {
  topic: string;
  nickname: string;
  gsocResourceId: string;
  wallet: Wallet;
  bees: Bees;
}

export const useSwarmChat = ({
  topic,
  nickname,
  gsocResourceId,
  wallet,
  bees,
}: UseSwarmChatParams) => {
  const chat = useRef<SwarmChat | null>(null);
  const messageCache = useRef<VisibleMessage[]>([]);
  const [allMessages, setAllMessages] = useState<VisibleMessage[]>([]);
  const [chatLoading, setChatLoading] = useState<boolean>(true);
  const [messagesLoading, setMessagesLoading] = useState<boolean>(false);
  const [error, setError] = useState<any | null>(null);

  useEffect(() => {
    if (!chat.current) {
      const newChat = new SwarmChat({
        gsocResourceId,
        topic,
        nickname,
        bees,
        ownAddress: wallet.address as EthAddress,
        privateKey: wallet.privateKey,
      });
      chat.current = newChat;

      const { on } = newChat.getEmitter();

      const updateMessage = (
        id: string,
        messages: VisibleMessage[],
        updates: Partial<VisibleMessage>
      ): VisibleMessage[] => {
        const messageIndex = messages.findIndex((msg) => msg.id === id);
        if (messageIndex !== -1) {
          messages[messageIndex] = { ...messages[messageIndex], ...updates };
        }
        return [...messages];
      };

      on(EVENTS.MESSAGE_REQUEST_SENT, (data: VisibleMessage) => {
        messageCache.current.push({ ...data, error: false, sent: false });
        setAllMessages(newChat.orderMessages([...messageCache.current]));
      });

      on(EVENTS.MESSAGE_REQUEST_ERROR, (data: { id: string }) => {
        messageCache.current = updateMessage(data.id, messageCache.current, {
          error: true,
        });
        setAllMessages(newChat.orderMessages([...messageCache.current]));
      });

      on(EVENTS.MESSAGE_RECEIVED, (data: VisibleMessage) => {
        const existingMessage = messageCache.current.find(
          (msg) => msg.id === data.id
        );
        if (existingMessage) {
          messageCache.current = updateMessage(data.id, messageCache.current, {
            error: false,
            sent: true,
          });
        } else {
          messageCache.current.push({ ...data, error: false, sent: true });
        }
        setAllMessages(newChat.orderMessages([...messageCache.current]));
      });

      on(EVENTS.LOADING_INIT, (data: boolean) => {
        setChatLoading(data);
      });

      on(EVENTS.LOADING_PREVIOUS_MESSAGES, (data: boolean) => {
        setMessagesLoading(data);
      });

      on(EVENTS.CRITICAL_ERROR, (data: any) => {
        setError(data);
      });

      newChat.start();
    }

    return () => {
      if (chat.current) {
        chat.current.stop();
        chat.current = null;
      }
    };
  }, []);

  const sendMessage = (message: string) => chat.current?.sendMessage(message);
  const fetchPreviousMessages = () => chat.current?.fetchPreviousMessages();

  return {
    chatLoading,
    messagesLoading,
    allMessages,
    sendMessage,
    fetchPreviousMessages,
    error,
  };
};
