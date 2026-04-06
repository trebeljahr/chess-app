import React from "react";
import ReactDOM from "react-dom/client";
import { AppProviders } from "./lib/trpc";
import { App } from "./App";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </React.StrictMode>
);
