import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Overlay } from "./overlay/Overlay";

function mountExtension() {
  if (document.getElementById("visual-memory-root")) return;

  const host = document.createElement("div");
  host.id = "visual-memory-root";
  host.style.cssText = "position: fixed; inset: 0; pointer-events: none; z-index: 2147483640;";

  const shadowRoot = host.attachShadow({ mode: "open" });

  const style = document.createElement("style");
  style.textContent = `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :host { all: initial; font-family: system-ui, sans-serif; font-size: 14px; color: white; }
    @keyframes vm-spin { to { transform: rotate(360deg); } }
  `;
  shadowRoot.appendChild(style);

  const container = document.createElement("div");
  container.style.cssText = "pointer-events: none; position: fixed; inset: 0;";
  shadowRoot.appendChild(container);

  document.body.appendChild(host);

  createRoot(container).render(
    <StrictMode>
      <Overlay />
    </StrictMode>
  );
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mountExtension);
} else {
  mountExtension();
}