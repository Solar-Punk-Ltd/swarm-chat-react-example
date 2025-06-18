import { useState } from "react";
import clsx from "clsx";

import "./MessageActions.scss";

interface MessageActionsProps {
  onEmojiClick?: (emoji: string) => void;
  onThreadClick?: () => void;
  visible: boolean;
}

const COMMON_EMOJIS = ["👍", "❤️", "😀", "😂", "😮", "😢", "😡"];

export function MessageActions({
  onEmojiClick,
  onThreadClick,
  visible,
}: MessageActionsProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const handleEmojiClick = (emoji: string) => {
    onEmojiClick?.(emoji);
    setShowEmojiPicker(false);
  };

  return (
    <div className={clsx("message-actions", { visible })}>
      <div className="action-buttons">
        <button
          className="action-button emoji-button"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          title="Add reaction"
        >
          😊
        </button>

        <button
          className="action-button thread-button"
          onClick={onThreadClick}
          title="Reply in thread"
        >
          💬
        </button>
      </div>

      {showEmojiPicker && (
        <div className="emoji-picker">
          {COMMON_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              className="emoji-option"
              onClick={() => handleEmojiClick(emoji)}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
