import { useState } from "react";
import clsx from "clsx";

import { ProfilePicture } from "./ProfilePicture/ProfilePicture";
import { MessageActions } from "./MessageActions/MessageActions";
import { MessageReactionsWrapper } from "./MessageReactionsWrapper/MessageReactionsWrapper";
import { MessageThreadWrapper } from "./MessageThreadWrapper/MessageThreadWrapper";
import { ReactionData } from "@/hooks/useSwarmChat";

import "./ChatMessage.scss";

interface ChatMessageProps {
  message: string;
  name: string;
  profileColor: string;
  ownMessage?: boolean;
  received: boolean;
  error: boolean;
  reactions?: ReactionData[];
  threadCount?: number;
  onEmojiReaction: (emoji: string) => void;
  onRetry?: () => void;
  onThreadReply?: () => void;
  isReactionLoading?: boolean;
  loadingReactionEmoji?: string;
  disabled?: boolean;
}

export function ChatMessage({
  message,
  name,
  profileColor,
  ownMessage = false,
  received,
  error,
  reactions = [],
  threadCount = 0,
  onRetry,
  onEmojiReaction,
  onThreadReply,
  isReactionLoading = false,
  loadingReactionEmoji = "",
  disabled = false,
}: ChatMessageProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={clsx("chat-message", { "own-message": ownMessage })}
      onClick={() => setIsHovered((prev) => !prev)}
    >
      <ProfilePicture
        name={name}
        color={profileColor}
        ownMessage={ownMessage}
      />

      <div
        className={clsx("chat-message-text", {
          "chat-message-error": error,
          "not-received": !received,
        })}
      >
        <span className="message">{message}</span>

        {error && onRetry && (
          <button className="retry-button" onClick={onRetry}>
            Retry
          </button>
        )}

        <MessageReactionsWrapper
          reactions={reactions}
          onEmojiClick={onEmojiReaction}
          ownMessage={ownMessage}
          isLoading={isReactionLoading}
          loadingEmoji={loadingReactionEmoji}
          disabled={disabled}
        />

        <MessageThreadWrapper
          threadCount={threadCount}
          onThreadClick={onThreadReply}
          disabled={disabled}
        />
      </div>

      <MessageActions
        visible={isHovered && received && !error}
        onEmojiClick={onEmojiReaction}
        onThreadClick={onThreadReply}
        ownMessage={ownMessage}
        isReactionLoading={isReactionLoading}
        disabled={disabled}
      />
    </div>
  );
}
