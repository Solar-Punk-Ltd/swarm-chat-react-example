import React from "react";

import { LOBBY_TITLE } from "../utils/constants";

import "./ChatHeader.scss";
interface ChatHeaderProps {
  category?: string;
  activeVisitors?: number;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ category }) => {
  return (
    <div className="chat-header">
      {category !== LOBBY_TITLE && (
        <div className="chat-header__img">
          <img src={undefined} alt="" className="chat-header__img" />
        </div>
      )}
      <div className="chat-header__category-name">{category}</div>
    </div>
  );
};
