
import { USE_WEBSOCKET, WEBSOCKET_URL } from "./config.js";
import { updateMessage } from "./state.js";
import { renderMessages } from "./polling.js";

console.log("🔥 websocket.js loaded");

let ws = null;
if (USE_WEBSOCKET) {
  ws = new WebSocket(WEBSOCKET_URL);

  ws.addEventListener("open", () => {
    console.log("✅ Connected to WebSocket server");
  });

  ws.addEventListener("message", (event) => {
    console.log("🔔 Raw event received:", event);
    const msg = JSON.parse(event.data);
    console.log("📩 WS message:", msg);

    updateMessage(msg);
    renderMessages();
  });

  ws.addEventListener("close", () => {
    console.log("⚠️ Disconnected from WebSocket server");
  });

  ws.addEventListener("error", (err) => {
    console.error("❌ WebSocket error:", err);
  });
}

export function sendWebSocketMessage(type, timestamp) {
    console.log(
      "📤 Sending WS message:",
      type,
      timestamp,
      "readyState:",
      ws?.readyState,
    );

  if (!ws) {
    console.warn("WebSocket not initialized");
    return;
  }
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type, timestamp: Number(timestamp) }));
  } else {
    console.warn("WebSocket is not connected");
  }
}
