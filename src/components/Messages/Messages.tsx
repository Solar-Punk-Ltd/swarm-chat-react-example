import React, { useEffect, useRef, useState } from "react";

import { VisibleMessage } from "../../libs/types";

import { Message } from "./Message/Message";

import "./Messages.scss";

interface MessagesProps {
  messages: VisibleMessage[];
  ownAddress: string;
}

export const Messages: React.FC<MessagesProps> = ({ messages, ownAddress }) => {
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
      {messages.map((msg) => (
        <Message key={msg.id} data={msg} ownAddress={ownAddress} />
      ))}
    </div>
  );
};
