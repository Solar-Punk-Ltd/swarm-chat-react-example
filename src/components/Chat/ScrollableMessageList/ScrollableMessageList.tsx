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
  const previousItemsStringRef = useRef<string>("");
  const previousItemsRef = useRef<VisibleMessage[]>([]);

  const scrollToBottom = () => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    requestAnimationFrame(() => {
      scrollToBottom();
    });
  }, []);

  useEffect(() => {
    const currentItemsString = JSON.stringify(items);
    const hasItemsChanged =
      currentItemsString !== previousItemsStringRef.current;

    if (hasItemsChanged) {
      // Find new items by comparing with previous items
      const previousItems = previousItemsRef.current;
      const newItems = items.filter(
        (item) => !previousItems.some((prevItem) => prevItem.id === item.id)
      );

      // Update refs
      previousItemsStringRef.current = currentItemsString;
      previousItemsRef.current = items;

      // Only scroll if user is near bottom AND there are new text messages
      const hasNewTextMessages = newItems.some(
        (item) => item.type !== MessageType.REACTION
      );

      if (hasNewTextMessages) {
        requestAnimationFrame(() => {
          scrollToBottom();
        });
      }
    }
  }, [items]);

  return (
    <div className="chat-messages-container" ref={containerRef}>
      {items.map(renderItem)}
    </div>
  );
}
