import { useEffect, useRef, useState } from "react";
import {
  EVENTS,
  MessageData,
  SwarmChat,
  ChatSettings,
} from "@solarpunkltd/swarm-chat-js";

export interface VisibleMessage extends MessageData {
  requested?: boolean;
  uploaded?: boolean;
  received?: boolean;
  error?: boolean;
}

export const useSwarmChat = ({ user, infra }: ChatSettings) => {
  const chat = useRef<SwarmChat | null>(null);
  const messageCache = useRef<VisibleMessage[]>([]);
  const [allMessages, setAllMessages] = useState<VisibleMessage[]>([]);
  const [chatLoading, setChatLoading] = useState<boolean>(true);
  const [messagesLoading, setMessagesLoading] = useState<boolean>(false);
  const [error, setError] = useState<any | null>(null);

  useEffect(() => {
    if (!chat.current) {
      const newChat = new SwarmChat({
        user,
        infra,
      });

      chat.current = newChat;

      const { on } = newChat.getEmitter();

      const updateMessage = (id: string, updates: Partial<VisibleMessage>) => {
        messageCache.current = messageCache.current.map((msg) =>
          msg.id === id ? { ...msg, ...updates } : msg
        );
        setAllMessages(
          chat.current?.orderMessages([...messageCache.current]) || []
        );
      };

      const handleMessageEvent = (
        event: string,
        updates: Partial<VisibleMessage>
      ) => {
        on(event, (d: MessageData | string) => {
          const data = typeof d === "string" ? JSON.parse(d) : d;

          const existingMessage = messageCache.current.find(
            (msg) => msg.id === data.id
          );
          if (existingMessage) {
            updateMessage(data.id, updates);
          } else {
            messageCache.current.push({ ...data, ...updates });
            setAllMessages(
              chat.current?.orderMessages([...messageCache.current]) || []
            );
          }
        });
      };

      handleMessageEvent(EVENTS.MESSAGE_REQUEST_INITIATED, {
        error: false,
        requested: true,
      });
      handleMessageEvent(EVENTS.MESSAGE_REQUEST_UPLOADED, {
        error: false,
        uploaded: true,
      });
      handleMessageEvent(EVENTS.MESSAGE_RECEIVED, {
        error: false,
        received: true,
      });
      handleMessageEvent(EVENTS.MESSAGE_REQUEST_ERROR, { error: true });

      on(EVENTS.LOADING_INIT, setChatLoading);
      on(EVENTS.LOADING_PREVIOUS_MESSAGES, setMessagesLoading);
      on(EVENTS.CRITICAL_ERROR, setError);

      newChat.start();
    }

    return () => {
      if (chat.current) {
        chat.current.stop();
        chat.current = null;
      }
    };
  }, [user.privateKey]);

  const sendMessage = (message: string) => chat.current?.sendMessage(message);

  const fetchPreviousMessages = () => chat.current?.fetchPreviousMessages();

  const retrySendMessage = (message: VisibleMessage) => {
    if (message.requested && message.error) {
      chat.current?.retrySendMessage(message);
    }
    if (message.uploaded && message.error) {
      chat.current?.retryBroadcastUserMessage(message);
    }
  };

  return {
    chatLoading,
    messagesLoading,
    allMessages,
    sendMessage,
    fetchPreviousMessages,
    retrySendMessage,
    error,
  };
};
