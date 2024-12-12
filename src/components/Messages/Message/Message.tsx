import React from "react";
import clsx from "clsx";

import { VisibleMessage } from "../../../libs/types";
import { createMonogram } from "../../../utils/common";
import { formatTime } from "../../../utils/date";

import AvatarMonogram from "../../AvatarMonogram/AvatarMonogram";

import "./Message.scss";

interface MessageProps {
  data: VisibleMessage;
  ownAddress: string;
}

export const Message: React.FC<MessageProps> = ({ data, ownAddress }) => {
  const isActualUser = data.address === ownAddress;

  return (
    <div
      className={clsx("message", { own: isActualUser })}
      style={{
        opacity: data.sent ? 1 : 0.3,
        color: data.error ? "red" : "black",
      }}
    >
      <div className="message__left-side">
        <AvatarMonogram
          letters={createMonogram(data.username)}
          color={isActualUser ? "#333333" : "#4A2875"}
          backgroundColor={isActualUser ? "#4A287533" : "#F7F8FA"}
        />
      </div>

      <div className="message__right-side">
        <div
          className={clsx("message__right-side__name", {
            own: isActualUser,
          })}
        >
          {data.username} &nbsp;
          <p className="message__right-side__name-and-time__time">
            {formatTime(data.timestamp)}
          </p>
        </div>

        <p
          className={clsx("message__right-side__text", {
            own: isActualUser,
          })}
        >
          {data.message}
        </p>
      </div>
    </div>
  );
};
