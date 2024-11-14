import React from "react";
import logo from "./logo.svg";
import { Wallet, hexlify } from "ethers";
import { Utils, BatchId } from "@ethersphere/bee-js";
import "./App.css";
import Chat from "./components/Chat/Chat";

function getWallet(input: string): Wallet {
  const privateKey = Utils.keccak256Hash(input);
  return new Wallet(hexlify(privateKey));
}

function App() {
  const wallet = getWallet("doomsday");

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
      <Chat
        title={"DOOMSDAY"}
        topic={"DOOMSDAYTOPIC"}
        wallet={wallet}
        stamp={
          "14454d7e3732ce2c7531d11f0d4b01d4986c94f41cc6ce2b42cfac4abecd7ef6" as BatchId
        }
        nickname={"superman"}
        gsocResourceId={
          "0115000000000000000000000000000000000000000000000000000000000000"
        }
        gateway={
          "044607732392bd78beead28ba5f1bce71356a376ffe2c50ad51a844a179028f1"
        }
        topMenuColor={undefined}
        backAction={() => {}}
        activeNumber={0}
      />
    </div>
  );
}

export default App;
