import "./MessageThreadWrapper.scss";

interface MessageThreadWrapperProps {
  threadCount: number;
  onThreadClick?: () => void;
}

export function MessageThreadWrapper({
  threadCount,
  onThreadClick,
}: MessageThreadWrapperProps) {
  if (threadCount === 0) {
    return null;
  }

  return (
    <div className="message-thread-wrapper">
      <button
        className="thread-reply-button"
        onClick={onThreadClick || (() => {})}
      >
        <span className="thread-icon">💬</span>
        <span className="thread-text">
          {threadCount} {threadCount === 1 ? "Reply" : "Replies"}
        </span>
      </button>
    </div>
  );
}
