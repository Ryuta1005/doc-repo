import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.js";
import "./styles.css";

const resolveContainer = (): HTMLElement | null => {
  const root = document.getElementById("root");
  if (root) {
    return root;
  }

  const legacyLayout = document.querySelector(".layout");
  if (!(legacyLayout instanceof HTMLElement) || !legacyLayout.parentElement) {
    return null;
  }

  const container = document.createElement("div");
  container.id = "root";
  legacyLayout.replaceWith(container);
  return container;
};

const container = resolveContainer();

if (container) {
  createRoot(container).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}
