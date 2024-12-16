import { useState } from "react";
import { BatchId } from "@ethersphere/bee-js";

import { getWallet } from "./utils/wallet";

import Chat from "./components/Chat/Chat";

import "./App.css";

function App() {
  const [showUserModal, setShowUserModal] = useState<boolean>(true);
  const [chatData, setChatData] = useState<Record<string, any>>({});

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const topic = formData.get("topic") as string;
    const name = formData.get("name") as string;
    const wallet = getWallet(name);

    setChatData({ topic, name, wallet });
    setShowUserModal(false);
  };

  return (
    <div className="App">
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
          title="DOOMSDAY"
          topic={chatData.topic}
          wallet={chatData.wallet}
          nickname={chatData.name}
          stamp={
            "76a6c300e0af507d6fbf18c027aa3c9a1736d438c52ab7257342d169c4c11d29" as BatchId
          }
          gsocResourceId="e09b760000000000000000000000000000000000000000000000000000000000"
        />
      )}
    </div>
  );
}

export default App;
