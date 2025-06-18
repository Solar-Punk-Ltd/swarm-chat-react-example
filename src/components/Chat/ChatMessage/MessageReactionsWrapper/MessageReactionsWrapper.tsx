import { MessageReaction } from "../MessageReaction/MessageReaction";
import "./MessageReactionsWrapper.scss";

export interface ReactionData {
  emoji: string;
  count: number;
  users: string[];
  hasUserReacted: boolean;
}

interface MessageReactionsWrapperProps {
  reactions: ReactionData[];
  onEmojiClick: (emoji: string) => void;
  ownMessage?: boolean;
}

export function MessageReactionsWrapper({
  reactions,
  onEmojiClick,
  ownMessage = false,
}: MessageReactionsWrapperProps) {
  if (reactions.length === 0) {
    return null;
  }

  return (
    <div
      className={`message-reactions-wrapper ${ownMessage ? "own-message" : ""}`}
    >
      {reactions.map((reaction) => (
        <MessageReaction
          key={reaction.emoji}
          emoji={reaction.emoji}
          count={reaction.count}
          isUserReaction={reaction.hasUserReacted}
          onClick={() => onEmojiClick(reaction.emoji)}
        />
      ))}
    </div>
  );
}
