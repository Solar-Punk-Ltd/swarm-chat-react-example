import EmojiPicker, {
  EmojiClickData,
  Theme,
  EmojiStyle,
} from "emoji-picker-react";

import "./ReactionToolbar.scss";

interface ReactionToolbarProps {
  onEmojiSelect?: (emoji: string) => void;
}

export function ReactionToolbar({ onEmojiSelect }: ReactionToolbarProps) {
  const handleReactionClick = (emojiData: EmojiClickData) => {
    onEmojiSelect?.(emojiData.emoji);
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    onEmojiSelect?.(emojiData.emoji);
  };

  return (
    <div className="reaction-toolbar">
      <EmojiPicker
        reactionsDefaultOpen={true}
        onReactionClick={handleReactionClick}
        onEmojiClick={handleEmojiClick}
        width={200}
        height={20}
        theme={Theme.DARK}
        previewConfig={{
          showPreview: false,
        }}
        emojiStyle={EmojiStyle.NATIVE}
      />
    </div>
  );
}
