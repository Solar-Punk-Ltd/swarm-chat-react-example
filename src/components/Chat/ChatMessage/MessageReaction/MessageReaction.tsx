import clsx from "clsx";
import "./MessageReaction.scss";

interface MessageReactionProps {
  emoji: string;
  count: number;
  isUserReaction?: boolean;
  onClick?: () => void;
  isLoading?: boolean;
}

export function MessageReaction({
  emoji,
  count,
  isUserReaction = false,
  onClick,
  isLoading = false,
}: MessageReactionProps) {
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (!isLoading) {
      onClick?.();
    }
  };

  return (
    <button
      className={clsx("message-reaction", {
        "user-reaction": isUserReaction,
        loading: isLoading,
      })}
      onClick={handleClick}
      disabled={isLoading}
      title={
        isLoading
          ? "Sending reaction..."
          : `${count} reaction${count > 1 ? "s" : ""}`
      }
    >
      <span className="reaction-emoji">{isLoading ? "⏳" : emoji}</span>
      <span className="reaction-count">{count}</span>
    </button>
  );
}
