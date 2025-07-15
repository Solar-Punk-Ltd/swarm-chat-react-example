import React, { useEffect, useRef, useState } from "react";

import "./ScrollableMessageList.scss";

interface ScrollableMessageListProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
}

export function ScrollableMessageList<T>({
  items,
  renderItem,
}: ScrollableMessageListProps<T>) {
  const [autoscroll, setAutoscroll] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastScrollHeight = useRef<number>(0);
  const itemsRef = useRef<T[]>(items);

  const scrollToBottom = () => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  };

  const handleScroll = () => {
    if (!containerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    // More generous threshold for autoscroll detection
    const isNearBottom = scrollTop + clientHeight >= scrollHeight - 50;
    setAutoscroll(isNearBottom);
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    el.addEventListener("scroll", handleScroll);

    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  // Effect for when items change (new messages added or item properties updated)
  useEffect(() => {
    const shouldScroll =
      autoscroll ||
      // Also scroll if we just added new items (even if not at bottom)
      items.length > itemsRef.current.length;

    if (shouldScroll) {
      // Use requestAnimationFrame to ensure DOM has updated
      requestAnimationFrame(() => {
        scrollToBottom();
      });
    }

    itemsRef.current = items;
  }, [items, autoscroll]);

  // Effect for when content height changes (message status updates, images load, etc.)
  useEffect(() => {
    if (!containerRef.current) return;

    const el = containerRef.current;
    const resizeObserver = new ResizeObserver(() => {
      const currentScrollHeight = el.scrollHeight;

      // If scroll height changed and we should autoscroll, scroll to bottom
      if (autoscroll && currentScrollHeight !== lastScrollHeight.current) {
        requestAnimationFrame(() => {
          scrollToBottom();
        });
      }

      lastScrollHeight.current = currentScrollHeight;
    });

    resizeObserver.observe(el);

    return () => {
      resizeObserver.disconnect();
    };
  }, [autoscroll]);

  return (
    <div className="chat-messages-container" ref={containerRef}>
      {items.map(renderItem)}
    </div>
  );
}
