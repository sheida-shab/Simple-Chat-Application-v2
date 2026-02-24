import express from "express";
import { server as WebSocketServer } from "websocket";
import http from "http";
import cors from "cors";
import escapeHtml from "escape-html";

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// HTTP + WebSocket server
const server = http.createServer(app);
const webSocketServer = new WebSocketServer({ httpServer: server });

// In-memory message store
const userMessageArr = [];

// Long-polling: store pending GET /messages responses
const pendingLongPollResponses = [];


//////////////////////////////////////////////////
// WebSocket handling (likes / dislikes updates)
//////////////////////////////////////////////////

webSocketServer.on("request", (request) => {
  const connection = request.accept(null, request.origin);
  console.log("WebSocket client connected");

  connection.on("message", (message) => {
    if (message.type !== "utf8") return;

    const data = JSON.parse(message.utf8Data);

    if (data.type === "like" || data.type === "dislike") {
      const msg = userMessageArr.find((m) => m.timestamp === data.timestamp);

      if (!msg) return;

      if (data.type === "like") msg.likes += 1;
      if (data.type === "dislike") msg.dislikes += 1;

      // Broadcast updated message to all connected clients
      webSocketServer.connections.forEach((conn) => {
        try {
          conn.sendUTF(JSON.stringify(msg));
        } catch (err) {
          console.error("WebSocket send error:", err);
        }
      });
    }
  });

  connection.on("close", () => {
    console.log("WebSocket client disconnected");
  });
});

//////////////////////////////////////////////////
// REST API
//////////////////////////////////////////////////

// Create a new message
app.post("/messages", (req, res) => {
 
  let { user, text, likes, dislikes } = req.body;

  // Validate input
  if (!user || !text || typeof user !== "string" || typeof text !== "string") {
    return res.status(400).json({ error: "Invalid user or text" });
  }

  // Prevent HTML injection
  user = escapeHtml(user);
  text = escapeHtml(text);

  likes = typeof likes === "number" && likes >= 0 ? likes : 0;
  dislikes = typeof dislikes === "number" && dislikes >= 0 ? dislikes : 0;

  const newMessage = {
    user,
    text,
    timestamp: Date.now(),
    likes,
    dislikes,
  };

  // Only add the message if it's not a duplicate
  if (!userMessageArr.find((m) => m.timestamp === newMessage.timestamp)) {
    userMessageArr.push(newMessage);
  }

  // Notify WebSocket clients about new message
  webSocketServer.connections.forEach((conn) => {
    try {
      conn.sendUTF(JSON.stringify(newMessage));
    } catch (err) {
      console.error("WebSocket send error:", err);
    }
  });

  // Respond to all pending long-poll GET requests
  while (pendingLongPollResponses.length > 0) {
    const pendingRes = pendingLongPollResponses.pop();
    pendingRes.json([newMessage]);
  }


  res.json(newMessage);
});

// Like a message
app.post("/messages/:timestamp/like", (req, res) => {
  const timestamp = Number(req.params.timestamp);
  const message = userMessageArr.find((m) => m.timestamp === timestamp);

  if (!message) {
    return res.status(404).json({ error: "Message not found" });
  }

  message.likes += 1;

  webSocketServer.connections.forEach((conn) => {
    try {
      conn.sendUTF(JSON.stringify(message));
    } catch (err) {
      console.error("WebSocket send error:", err);
    }
  });

  res.json({ success: true, likes: message.likes });
});

// Dislike a message
app.post("/messages/:timestamp/dislike", (req, res) => {
  const timestamp = Number(req.params.timestamp);
  const message = userMessageArr.find((m) => m.timestamp === timestamp);

  if (!message) {
    return res.status(404).json({ error: "Message not found" });
  }

  message.dislikes += 1;

  webSocketServer.connections.forEach((conn) => {
    try {
      conn.sendUTF(JSON.stringify(message));
    } catch (err) {
      console.error("WebSocket send error:", err);
    }
  });

  res.json({ success: true, dislikes: message.dislikes });
});

// Get messages (supports ?since=<timestamp>)
app.get("/messages", (req, res) => {
  const since = req.query.since ? Number(req.query.since) : undefined;

  if (since !== undefined && isNaN(since)) {
    return res.status(400).json({ error: "Invalid timestamp" });
  }

  const result =
    since !== undefined
      ? userMessageArr.filter((m) => m.timestamp > since)
      : userMessageArr;

  // 👉 Long-polling behaviour
  if (result.length === 0) {
    // No new messages → keep request open
    pendingLongPollResponses.push(res);
    return;
  }    

  res.json(result);
});

//////////////////////////////////////////////////
// Start server
//////////////////////////////////////////////////
// Optional: simple GET / route to avoid 404
app.get("/", (req, res) => {
  res.send("Chat backend is running! Use /messages for API.");
});

server.listen(port, () => {
  console.log(`Chat server running on port ${port}`);
});
