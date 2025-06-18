import { useState } from "react";
import clsx from "clsx";

import { ProfilePicture } from "./ProfilePicture/ProfilePicture";
import { MessageActions } from "./MessageActions/MessageActions";
import {
  MessageReactionsWrapper,
  ReactionData,
} from "./MessageReactionsWrapper/MessageReactionsWrapper";

import "./ChatMessage.scss";

interface ChatMessageProps {
  message: string;
  name: string;
  profileColor: string;
  ownMessage?: boolean;
  received: boolean;
  error: boolean;
  reactions?: ReactionData[];
  onRetry?: () => void;
  onEmojiReaction: (emoji: string) => void;
  onThreadReply: () => void;
}

export function ChatMessage({
  message,
  name,
  profileColor,
  ownMessage = false,
  received,
  error,
  reactions = [],
  onRetry,
  onEmojiReaction,
  onThreadReply,
}: ChatMessageProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={clsx("chat-message", { "own-message": ownMessage })}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
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
        />
      </div>

      <MessageActions
        visible={isHovered && received && !error}
        onEmojiClick={onEmojiReaction}
        onThreadClick={onThreadReply}
        ownMessage={ownMessage}
      />
    </div>
  );
}
