import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { ThemeProvider } from "./theme/ThemeProvider";
import { createLogger } from "./utils/logger";

const logger = createLogger("BOOT");

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>
);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/notification-sw.js").catch((error) => {
      logger.warn("Service worker registration failed:", error);
    });
  });
}
