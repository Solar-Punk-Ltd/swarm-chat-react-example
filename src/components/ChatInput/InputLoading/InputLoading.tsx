import React from "react";

import "./InputLoading.scss";

export const InputLoading: React.FC = () => {
  return (
    <span id="chat-input__loading">
      <div className="chat-input__loading-square"></div>
      <div className="chat-input__loading-square"></div>
      <div className="chat-input__loading-square"></div>
    </span>
  );
};
