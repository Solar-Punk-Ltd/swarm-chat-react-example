import { MessageReaction } from "../MessageReaction/MessageReaction";
import { ReactionData } from "@/hooks/useSwarmChat";
import "./MessageReactionsWrapper.scss";

interface MessageReactionsWrapperProps {
  reactions: ReactionData[];
  onEmojiClick: (emoji: string) => void;
  ownMessage?: boolean;
  isLoading?: boolean;
  loadingEmoji?: string;
}

export function MessageReactionsWrapper({
  reactions,
  onEmojiClick,
  ownMessage = false,
  isLoading = false,
  loadingEmoji = "",
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
          isLoading={isLoading && loadingEmoji === reaction.emoji}
        />
      ))}
    </div>
  );
}
