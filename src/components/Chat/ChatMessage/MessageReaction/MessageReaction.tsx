import clsx from "clsx";
import "./MessageReaction.scss";

interface MessageReactionProps {
  emoji: string;
  count: number;
  isUserReaction?: boolean;
  onClick?: () => void;
}

export function MessageReaction({
  emoji,
  count,
  isUserReaction = false,
  onClick,
}: MessageReactionProps) {
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onClick?.();
  };

  return (
    <button
      className={clsx("message-reaction", {
        "user-reaction": isUserReaction,
      })}
      onClick={handleClick}
      title={`${count} reaction${count > 1 ? "s" : ""}`}
    >
      <span className="reaction-emoji">{emoji}</span>
      <span className="reaction-count">{count}</span>
    </button>
  );
}
