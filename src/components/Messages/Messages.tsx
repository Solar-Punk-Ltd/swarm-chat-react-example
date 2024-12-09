import React, { useEffect, useRef, useState } from "react";

import Message from "./Message/Message";

import "./Messages.scss";

interface MessagesProps {
  messages: any[];
  nickname: string;
}

export const Messages: React.FC<MessagesProps> = ({ messages, nickname }) => {
  const chatBodyRef = useRef<HTMLDivElement>(null);
  const [autoscroll, setAutoscroll] = useState(true);

  const handleScroll = () => {
    if (chatBodyRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatBodyRef.current;
      if (scrollTop + clientHeight < scrollHeight) {
        setAutoscroll(false);
      } else {
        setAutoscroll(true);
      }
    }
  };

  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.addEventListener("scroll", handleScroll);
    }

    return () => {
      if (chatBodyRef.current) {
        chatBodyRef.current.removeEventListener("scroll", handleScroll);
      }
    };
  }, []);

  useEffect(() => {
    if (chatBodyRef.current && autoscroll) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="messages messages__no-messages">
        <p>{"Start the conversation!"}</p>
      </div>
    );
  }

  return (
    <div className="messages" ref={chatBodyRef}>
      {messages.map((msg, i) => (
        <Message key={i} data={msg} nickname={nickname} />
      ))}
    </div>
  );
};
