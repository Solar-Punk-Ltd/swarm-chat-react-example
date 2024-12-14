import { useEffect, useRef, useState } from "react";
import { Wallet } from "ethers";
import { BatchId } from "@ethersphere/bee-js";

import { EVENTS, SwarmChat } from "../libs";
import { EthAddress, VisibleMessage } from "../libs/types";

interface UseSwarmChatParams {
  topic: string;
  stamp: string;
  nickname: string;
  gsocResourceId: string;
  wallet: Wallet;
  url: string;
}

export const useSwarmChat = ({
  topic,
  stamp,
  nickname,
  gsocResourceId,
  wallet,
  url,
}: UseSwarmChatParams) => {
  const chat = useRef<SwarmChat | null>(null);
  const messageCache = useRef<VisibleMessage[]>([]);
  const [allMessages, setAllMessages] = useState<VisibleMessage[]>([]);
  const [chatLoading, setChatLoading] = useState<boolean>(true);

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

  useEffect(() => {
    if (!chat.current) {
      const newChat = new SwarmChat({
        gsocResourceId,
        topic,
        nickname,
        url,
        stamp: stamp as BatchId,
        ownAddress: wallet.address as EthAddress,
        privateKey: wallet.privateKey,
      });

      chat.current = newChat;

      newChat.listenToNewSubscribers();
      newChat.startKeepMeAliveProcess();
      newChat.startMessagesFetchProcess();

      const { on } = newChat.getEmitter();

      on(EVENTS.MESSAGE_REQUEST_SENT, (data: VisibleMessage) => {
        messageCache.current.push({ ...data, error: false, sent: false });
        setAllMessages([...messageCache.current]);
      });

      on(EVENTS.MESSAGE_REQUEST_ERROR, (data: { id: string }) => {
        messageCache.current = updateMessage(data.id, messageCache.current, {
          error: true,
        });
        setAllMessages([...messageCache.current]);
      });

      on(EVENTS.RECEIVE_MESSAGE, (data: VisibleMessage) => {
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
        setAllMessages([...messageCache.current]);
      });

      on(EVENTS.LOADING_INIT_USERS, (data: boolean) => {
        setChatLoading(data);
      });
    }

    return () => {
      console.log("Cleaning up chat outter call");
      if (chat.current) {
        console.log("Cleaning up chat when exits");
        chat.current.getEmitter().cleanAll();
        chat.current.stopKeepMeAliveProcess();
        chat.current.stopMessagesFetchProcess();
        chat.current.stopListenToNewSubscribers();
        chat.current = null;
      }
    };
  }, []);

  const sendMessage = (message: string) => chat.current?.sendMessage(message);

  return { chatLoading, allMessages, sendMessage };
};
