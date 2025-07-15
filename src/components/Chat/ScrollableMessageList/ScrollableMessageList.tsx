import React, { useEffect, useRef, useState } from "react";
import { VisibleMessage } from "@/hooks/useSwarmChat";
import { MessageType } from "@solarpunkltd/swarm-chat-js";

import "./ScrollableMessageList.scss";

interface ScrollableMessageListProps {
  items: VisibleMessage[];
  renderItem: (item: VisibleMessage) => React.ReactNode;
}

export function ScrollableMessageList({
  items,
  renderItem,
}: ScrollableMessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousItemsLengthRef = useRef<number>(0);

  const scrollToBottom = () => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  };

  const isNearBottom = () => {
    if (!containerRef.current) return true;

    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const threshold = 100; // pixels from bottom
    return scrollTop + clientHeight >= scrollHeight - threshold;
  };

  useEffect(() => {
    const count = items.length;

    if (count > previousItemsLengthRef.current || isNearBottom()) {
      previousItemsLengthRef.current = count;

      requestAnimationFrame(() => {
        scrollToBottom();
      });
    }
  }, [items]);

  return (
    <div className="chat-messages-container" ref={containerRef}>
      {items.map(renderItem)}
    </div>
  );
}
