import { useState } from "react";
import { PrivateKey } from "@ethersphere/bee-js";

import { getSigner } from "@/utils/wallet";

import { Chat } from "@/components/Chat/Chat";

import "./App.scss";

interface ChatData {
  topic: string;
  nickname: string;
  signer: PrivateKey;
}

function App() {
  const [showUserModal, setShowUserModal] = useState<boolean>(true);
  const [chatData, setChatData] = useState<ChatData>();
  const [isComment, setIsComment] = useState<boolean>(false);

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const topic = formData.get("topic") as string;
    const nickname = formData.get("name") as string;
    const signer = getSigner(nickname);

    setChatData({ topic, nickname, signer });
    setShowUserModal(false);
  };

  return (
    <>
      {showUserModal ? (
        <form onSubmit={handleFormSubmit}>
          <div>
            <label>
              Topic:
              <input
                name="topic"
                type="text"
                required
                defaultValue="DOOMSDAYTOPIC3"
              />
            </label>
          </div>
          <div>
            <label>
              Name:
              <input name="name" type="text" required />
            </label>
          </div>
          <div>
            <button
              type="button"
              onClick={() => setIsComment(!isComment)}
              style={{
                backgroundColor: isComment ? "#4CAF50" : "#f44336",
                color: "white",
                padding: "8px 16px",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              {isComment ? "Comment mode" : "Chat mode"}
            </button>
          </div>
          <button type="submit">Submit</button>
        </form>
      ) : (
        <Chat
          topic={chatData?.topic!}
          signer={chatData?.signer!}
          nickname={chatData?.nickname!}
          isComment={isComment}
        />
      )}
    </>
  );
}

export default App;
