import { useState } from "react";
import { Wallet, hexlify } from "ethers";
import { Utils, BatchId } from "@ethersphere/bee-js";

import Chat from "./components/Chat/Chat";

import "./App.css";

function getWallet(input: string): Wallet {
  const privateKey = Utils.keccak256Hash(input);
  return new Wallet(hexlify(privateKey));
}

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
            "d9a89178d4aba720c4c38f62f0980cf219efcfe307d565d352668cee1a96350f" as BatchId
          }
          gsocResourceId="0115000000000000000000000000000000000000000000000000000000000000"
        />
      )}
    </div>
  );
}

export default App;
