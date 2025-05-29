import React, { useEffect, useRef, useState } from 'react';

import './ScrollableMessageList.scss';

interface ScrollableMessageListProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
}

export function ScrollableMessageList<T>({ items, renderItem }: ScrollableMessageListProps<T>) {
  const [autoscroll, setAutoscroll] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (!containerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    setAutoscroll(scrollTop + clientHeight >= scrollHeight - 10);
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    el.addEventListener('scroll', handleScroll);

    return () => el.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (autoscroll && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [items]);

  return (
    <div className="chat-messages-container" ref={containerRef}>
      {items.map(renderItem)}
    </div>
  );
}
