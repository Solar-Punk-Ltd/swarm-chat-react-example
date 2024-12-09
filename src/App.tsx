import { Wallet, hexlify } from "ethers";
import { Utils, BatchId } from "@ethersphere/bee-js";

import Chat from "./components/Chat/Chat";

import "./App.css";

function getWallet(input: string): Wallet {
  const privateKey = Utils.keccak256Hash(input);
  return new Wallet(hexlify(privateKey));
}

function App() {
  const wallet = getWallet("doomsday");

  return (
    <div className="App">
      <Chat
        title="DOOMSDAY"
        topic="DOOMSDAYTOPIC"
        wallet={wallet}
        stamp={
          "d9a89178d4aba720c4c38f62f0980cf219efcfe307d565d352668cee1a96350f" as BatchId
        }
        nickname="superman"
        gsocResourceId="0115000000000000000000000000000000000000000000000000000000000000"
      />
    </div>
  );
}

export default App;
