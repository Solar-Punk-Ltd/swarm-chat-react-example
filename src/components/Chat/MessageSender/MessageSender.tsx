import { useState } from "react";

import { SendMessageIcon } from "@/components/Icons/SendMessageIcon";
import { InputLoading } from "@/components/InputLoading/InputLoading";

import "./MessageSender.scss";

interface MessageSenderProps {
  onSend?: (text: string) => Promise<void> | void;
}

export function MessageSender({ onSend }: MessageSenderProps) {
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  const sendMessage = async () => {
    if (!input.trim() || sending) return;

    try {
      setSending(true);
      await onSend?.(input.trim());
      setInput("");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };

  return (
    <div className="message-sender-wrapper">
      {sending ? (
        <div className="message-sender-sending">
          <InputLoading />
        </div>
      ) : (
        <div className="message-sender">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Please type here"
            onKeyDown={handleKeyDown}
            className="message-sender-input"
            disabled={sending}
          />
          <button
            className="message-sender-send-button"
            onClick={sendMessage}
            disabled={sending || !input.trim()}
          >
            <SendMessageIcon color={input.trim() ? "" : "#A5ADBA"} />
          </button>
        </div>
      )}
    </div>
  );
}
