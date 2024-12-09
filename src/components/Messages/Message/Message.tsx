import React from "react";
import clsx from "clsx";

import { createMonogram, formatTime } from "../../utils/helpers";

import AvatarMonogram from "../../AvatarMonogram/AvatarMonogram";

import "./Message.scss";

interface MessageProps {
  data: any;
  nickname: string;
}

const Message: React.FC<MessageProps> = ({ data, nickname }) => {
  const actualUser = localStorage.getItem("username");

  return (
    <div
      className={clsx("message", { own: actualUser === nickname })}
      style={{
        opacity: data.sent ? 1 : 0.3,
        color: data.error ? "red" : "black",
      }}
    >
      <div className="message__left-side">
        <AvatarMonogram
          letters={createMonogram(data.username)}
          color={actualUser === nickname ? "#333333" : "#4A2875"}
          backgroundColor={actualUser === nickname ? "#4A287533" : "#F7F8FA"}
        />
      </div>

      <div className="message__right-side">
        <div
          className={clsx("message__right-side__name", {
            own: actualUser === nickname,
          })}
        >
          {data.username} &nbsp;
          <p className="message__right-side__name-and-time__time">
            {formatTime(data.timestamp)}
          </p>
        </div>

        <p
          className={clsx("message__right-side__text", {
            own: actualUser === nickname,
          })}
        >
          {data.message}
        </p>
      </div>
    </div>
  );
};

export default Message;
