import React, { useEffect, useRef } from "react";

import "./ScrollableMessageList.scss";

interface ScrollableMessageListProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
}

export function ScrollableMessageList<T>({
  items,
  renderItem,
}: ScrollableMessageListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    requestAnimationFrame(() => {
      scrollToBottom();
    });
  }, [items]);

  return (
    <div className="chat-messages-container" ref={containerRef}>
      {items.map(renderItem)}
    </div>
  );
}
