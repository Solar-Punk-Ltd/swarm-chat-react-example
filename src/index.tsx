import React from "react";
import ReactDOM from "react-dom/client";

import { MainLayout } from "@/layouts/MainLayout";
import App from "./App";

import "@/styles/globals.scss";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

root.render(
  <React.StrictMode>
    <MainLayout>
      <App />
    </MainLayout>
  </React.StrictMode>
);
