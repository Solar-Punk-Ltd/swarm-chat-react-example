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
                defaultValue="DOOMSDAYTOPIC"
              />
            </label>
          </div>
          <div>
            <label>
              Name:
              <input name="name" type="text" required />
            </label>
          </div>
          <button type="submit">Submit</button>
        </form>
      ) : (
        <Chat
          topic={chatData?.topic!}
          signer={chatData?.signer!}
          nickname={chatData?.nickname!}
        />
      )}
    </>
  );
}

export default App;
