import clsx from "clsx";

import { ProfilePicture } from "./ProfilePicture/ProfilePicture";

import "./ChatMessage.scss";

interface ChatMessageProps {
  message: string;
  name: string;
  profileColor: string;
  ownMessage?: boolean;
  received: boolean;
  error: boolean;
  onRetry?: () => void;
}

export function ChatMessage({
  message,
  name,
  profileColor,
  ownMessage = false,
  received,
  error,
  onRetry,
}: ChatMessageProps) {
  return (
    <div className={clsx("chat-message", { "own-message": ownMessage })}>
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
        <span>{message}</span>

        {error && onRetry && (
          <button className="retry-button" onClick={onRetry}>
            Retry
          </button>
        )}
      </div>
    </div>
  );
}
