import React from "react";
import "./ChatHeader.scss";
// import ActiveVisitors from "../ActiveVisitors/ActiveVisitors";
import { LOBBY_TITLE } from "../utils/constants";

interface ChatHeaderProps {
  category?: string;
  activeVisitors?: number;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  category,
  activeVisitors,
}) => {
  // const imageUrl = CATEGORY_IMAGES_MAP.get(category ? category : "");
  return (
    <div className="chat-header">
      {category !== LOBBY_TITLE && (
        <div className="chat-header__img">
          <img src={undefined} alt="" className="chat-header__img" />
        </div>
      )}
      <div className="chat-header__category-name">{category}</div>
      {/* <div>
        <ActiveVisitors
          number={activeVisitors ? activeVisitors : 0}
          withIcon={true}
        />
      </div> */}
    </div>
  );
};

export default ChatHeader;
