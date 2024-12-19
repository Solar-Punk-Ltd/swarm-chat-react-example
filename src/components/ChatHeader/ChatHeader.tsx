import React from "react";

import "./ChatHeader.scss";
interface ChatHeaderProps {
  category?: string;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ category }) => {
  return (
    <div className="chat-header">
      <div className="chat-header__category-name">{category}</div>
    </div>
  );
};
