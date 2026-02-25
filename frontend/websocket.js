import { USE_WEBSOCKET, WEBSOCKET_URL } from "./config.js";
import { updateMessage } from "./state.js";
import { renderMessages } from "./polling.js";

console.log("🔥 websocket.js loaded");

let ws = null;

//////////////////////////////////////////////////
// Initialize WebSocket if enabled
//////////////////////////////////////////////////
if (USE_WEBSOCKET) {
  ws = new WebSocket(WEBSOCKET_URL);

  // Connection opened
  ws.addEventListener("open", () => {
    console.log("✅ Connected to WebSocket server");
  });

  // Incoming message from server
  ws.addEventListener("message", (event) => {
     console.log("🔔 Raw WS event:", event);
    
    let msg;
   
    try {
      msg = JSON.parse(event.data);
      console.log("📩 Parsed WS message:", msg);
    } catch (err) {
      console.error("Failed to parse WS message:", err);
      return;
    }
    if (!msg || typeof msg.timestamp === "undefined") {
      console.warn("Received invalid WebSocket message:", msg);
      return;
    }
      // Update local state and re-render
      updateMessage(msg);
      renderMessages();
    
  });

  // Connection closed
  ws.addEventListener("close", () => {
    console.log("⚠️ Disconnected from WebSocket server");
  });

  // Error handler
  ws.addEventListener("error", (err) => {
    console.error("❌ WebSocket error:", err);
  });
}

//////////////////////////////////////////////////
// Send a WebSocket message to the server
//////////////////////////////////////////////////
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
    console.warn("WebSocket is not connected yet");
  }
}
