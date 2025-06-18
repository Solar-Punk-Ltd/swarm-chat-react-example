import { PrivateKey } from "@ethersphere/bee-js";
import { useState } from "react";

import { Button } from "@/components/Button/Button";
import { ChatMessage } from "@/components/Chat/ChatMessage/ChatMessage";
import { MessageSender } from "@/components/Chat/MessageSender/MessageSender";
import { ScrollableMessageList } from "@/components/Chat/ScrollableMessageList/ScrollableMessageList";
import { useSwarmChat } from "@/hooks/useSwarmChat";
import { config } from "@/utils/config";
import { ReactionData } from "@/components/Chat/ChatMessage/MessageReactionsWrapper/MessageReactionsWrapper";

import "./Chat.scss";

interface ChatProps {
  topic: string;
  nickname: string;
  signer: PrivateKey;
}

const profileColors = [
  "#FF6B6B", // Coral Red
  "#FFD93D", // Golden Yellow
  "#6BCB77", // Soft Green
  "#4D96FF", // Bright Blue
  "#FFAD69", // Soft Orange
  "#C084FC", // Pastel Purple
  "#F87171", // Warm Salmon
  "#34D399", // Emerald
  "#FBBF24", // Amber
  "#60A5FA", // Sky Blue
];

function getColorForName(name: string): string {
  const hash = [...name].reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return profileColors[hash % profileColors.length];
}

const privKeyPlaceholder =
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

export const Chat: React.FC<ChatProps> = ({ topic, signer, nickname }) => {
  // State to manage reactions for each message
  const [messageReactions, setMessageReactions] = useState<
    Record<string, ReactionData[]>
  >({});

  const {
    chatLoading,
    messagesLoading,
    allMessages,
    sendMessage,
    fetchPreviousMessages,
    retrySendMessage,
    error,
  } = useSwarmChat({
    user: {
      nickname: nickname || "",
      privateKey: signer.toHex() || privKeyPlaceholder,
    },
    infra: {
      beeUrl: config.beeUrl,
      stamp: config.chatStamp,
      gsocResourceId: config.chatGsocResourceId,
      gsocTopic: config.chatGsocTopic,
      chatAddress: config.chatOwner,
      chatTopic: `chat-${topic}`,
      enveloped: false,
    },
  });

  const handleMessageSending = async (text: string) => sendMessage(text);

  const handleEmojiReaction = (messageId: string, emoji: string) => {
    setMessageReactions((prev) => {
      const currentReactions = prev[messageId] || [];
      const existingReaction = currentReactions.find((r) => r.emoji === emoji);

      if (existingReaction) {
        // If user already reacted with this emoji, remove their reaction
        if (existingReaction.hasUserReacted) {
          const updatedReaction = {
            ...existingReaction,
            count: existingReaction.count - 1,
            hasUserReacted: false,
            users: existingReaction.users.filter((user) => user !== nickname),
          };

          if (updatedReaction.count === 0) {
            // Remove the reaction entirely if count reaches 0
            return {
              ...prev,
              [messageId]: currentReactions.filter((r) => r.emoji !== emoji),
            };
          } else {
            return {
              ...prev,
              [messageId]: currentReactions.map((r) =>
                r.emoji === emoji ? updatedReaction : r
              ),
            };
          }
        } else {
          // User hasn't reacted with this emoji, add their reaction
          return {
            ...prev,
            [messageId]: currentReactions.map((r) =>
              r.emoji === emoji
                ? {
                    ...r,
                    count: r.count + 1,
                    hasUserReacted: true,
                    users: [...r.users, nickname],
                  }
                : r
            ),
          };
        }
      } else {
        // New reaction
        const newReaction: ReactionData = {
          emoji,
          count: 1,
          users: [nickname],
          hasUserReacted: true,
        };

        return {
          ...prev,
          [messageId]: [...currentReactions, newReaction],
        };
      }
    });
  };

  const handleThreadReply = () => {
    // For now, just log the thread reply action
    // In a real implementation, you might want to open a thread view
    console.log("Thread reply clicked");
  };

  if (error) {
    return (
      <div className="chat-container">
        <div className="chat-error">
          Critical error: {error.message}. Please check node availability
          status.
        </div>
      </div>
    );
  }

  return (
    <div className="chat-container">
      {chatLoading && (
        <div className="chat-loading-overlay">
          <div className="chat-loading">Loading chat...</div>
        </div>
      )}
      {!chatLoading && allMessages.length > 0 && (
        <Button
          onClick={() => fetchPreviousMessages()}
          className="chat-load-more"
        >
          Load more messages
        </Button>
      )}

      {messagesLoading && (
        <div className="chat-loading">Loading messages...</div>
      )}
      {!messagesLoading && allMessages.length > 0 && (
        <ScrollableMessageList
          items={allMessages}
          renderItem={(item) => (
            <ChatMessage
              key={item.id}
              message={item.message}
              received={Boolean(item.received)}
              error={Boolean(item.error)}
              name={item.username}
              profileColor={getColorForName(item.username)}
              ownMessage={
                item.address === signer.publicKey().address().toString()
              }
              reactions={messageReactions[item.id] || []}
              onRetry={() => retrySendMessage(item)}
              onEmojiReaction={(emoji) => handleEmojiReaction(item.id, emoji)}
              onThreadReply={handleThreadReply}
            />
          )}
        />
      )}

      {!chatLoading && <MessageSender onSend={handleMessageSending} />}
    </div>
  );
};
