import { useState, useEffect, useRef } from "react";
import clsx from "clsx";
import EmojiPicker, {
  EmojiClickData,
  Theme,
  EmojiStyle,
} from "emoji-picker-react";

import "./MessageActions.scss";

interface MessageActionsProps {
  onEmojiClick?: (emoji: string) => void;
  onThreadClick?: () => void;
  visible: boolean;
  ownMessage?: boolean;
}

export function MessageActions({
  onEmojiClick,
  onThreadClick,
  visible,
  ownMessage = false,
}: MessageActionsProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [pickerPosition, setPickerPosition] = useState({ top: 0, left: 0 });
  const emojiButtonRef = useRef<HTMLButtonElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!visible) {
      setShowEmojiPicker(false);
    }
  }, [visible]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showEmojiPicker &&
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node) &&
        emojiButtonRef.current &&
        !emojiButtonRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showEmojiPicker]);

  const handleEmojiButtonClick = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.stopPropagation();

    if (!showEmojiPicker && emojiButtonRef.current) {
      const buttonRect = emojiButtonRef.current.getBoundingClientRect();
      const pickerWidth = 300;
      const pickerHeight = 350;

      let top = buttonRect.bottom + 4; // Start below the button
      let left = buttonRect.left;

      // Check if picker would go off-screen vertically
      if (top + pickerHeight > window.innerHeight) {
        top = buttonRect.top - pickerHeight - 4; // Place above the button
      }

      // Check if picker would go off-screen horizontally
      if (left + pickerWidth > window.innerWidth) {
        left = window.innerWidth - pickerWidth - 16; // Adjust to fit on screen
      }

      // Ensure minimum distance from edges
      top = Math.max(16, top);
      left = Math.max(16, left);

      setPickerPosition({ top, left });
    }

    setShowEmojiPicker(!showEmojiPicker);
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    onEmojiClick?.(emojiData.emoji);
    setShowEmojiPicker(false);
  };

  return (
    <div
      className={clsx("message-actions", {
        visible,
        "own-message": ownMessage,
      })}
    >
      <div className="action-buttons">
        <button
          ref={emojiButtonRef}
          className="action-button emoji-button"
          onClick={handleEmojiButtonClick}
          title="Add reaction"
        >
          😊
        </button>

        {!!onThreadClick && (
          <button
            className="action-button thread-button"
            onClick={(event) => {
              event.stopPropagation();
              onThreadClick?.();
            }}
            title="Reply in thread"
          >
            💬
          </button>
        )}
      </div>

      {showEmojiPicker && (
        <div
          ref={pickerRef}
          className="emoji-picker-fixed"
          style={{
            position: "fixed",
            top: pickerPosition.top,
            left: pickerPosition.left,
            zIndex: 9999,
          }}
          onClick={(event) => {
            event.stopPropagation();
          }}
        >
          <EmojiPicker
            onEmojiClick={handleEmojiClick}
            width={300}
            height={350}
            theme={Theme.DARK}
            previewConfig={{
              showPreview: false,
            }}
            lazyLoadEmojis={true}
            searchDisabled={false}
            skinTonesDisabled={true}
            emojiStyle={EmojiStyle.NATIVE}
          />
        </div>
      )}
    </div>
  );
}
