import { Button } from "@/components/Button/Button";
import { ChatMessage } from "@/components/Chat/ChatMessage/ChatMessage";
import { MessageSender } from "@/components/Chat/MessageSender/MessageSender";
import { ScrollableMessageList } from "@/components/Chat/ScrollableMessageList/ScrollableMessageList";
import { VisibleMessage, ReactionData } from "@/hooks/useSwarmChat";

import "./ThreadView.scss";

interface ThreadViewProps {
  originalMessage: VisibleMessage;
  originalMessageReactions: ReactionData[];
  threadMessages: VisibleMessage[];
  groupedReactions: Record<string, ReactionData[]>;
  onBack: () => void;
  onSendMessage: (message: string) => void;
  onEmojiReaction: (messageId: string, emoji: string) => void;
  onRetry: (message: VisibleMessage) => void;
  getColorForName: (name: string) => string;
  currentUserAddress: string;
}

export function ThreadView({
  originalMessage,
  originalMessageReactions,
  threadMessages,
  groupedReactions,
  onBack,
  onSendMessage,
  onEmojiReaction,
  onRetry,
  getColorForName,
  currentUserAddress,
}: ThreadViewProps) {
  return (
    <div className="thread-view">
      <div className="thread-header">
        <Button onClick={onBack} className="back-button">
          ←
        </Button>
        <h3 className="thread-title">Thread</h3>
      </div>

      <div className="original-message-container">
        <ChatMessage
          key={originalMessage.id}
          message={originalMessage.message}
          received={Boolean(originalMessage.received)}
          error={Boolean(originalMessage.error)}
          name={originalMessage.username}
          profileColor={getColorForName(originalMessage.username)}
          ownMessage={originalMessage.address === currentUserAddress}
          reactions={originalMessageReactions}
          onEmojiReaction={(emoji) =>
            onEmojiReaction(originalMessage.id, emoji)
          }
          onRetry={() => onRetry(originalMessage)}
        />
      </div>

      <div className="thread-messages-container">
        {threadMessages.length > 0 ? (
          <ScrollableMessageList
            items={threadMessages}
            renderItem={(item) => (
              <ChatMessage
                key={item.id}
                message={item.message}
                received={Boolean(item.received)}
                error={Boolean(item.error)}
                name={item.username}
                profileColor={getColorForName(item.username)}
                ownMessage={item.address === currentUserAddress}
                reactions={groupedReactions[item.id] || []}
                onEmojiReaction={(emoji) => onEmojiReaction(item.id, emoji)}
                onRetry={() => onRetry(item)}
              />
            )}
          />
        ) : (
          <div className="no-thread-messages">No replies yet.</div>
        )}
      </div>

      <MessageSender onSend={onSendMessage} />
    </div>
  );
}
