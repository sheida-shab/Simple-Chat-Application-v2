import express from "express";
import { server as WebSocketServer } from "websocket";
import http from "http";
import cors from "cors";
//import escapeHtml library to prevent HTML injection
import escapeHtml from "escape-html";

const app = express();
// Enable CORS for all routes
app.use(cors());
// Enable parsing of JSON bodies in requests
app.use(express.json());

const server = http.createServer(app);
const webSocketServer = new WebSocketServer({ httpServer: server });

webSocketServer.on("request", (request) => {
  const connection = request.accept(null, request.origin);
  console.log("WebSocket client connected");

  connection.on("message", (message) => {
    console.log("🔥 RAW WS message received");
    if (message.type === "utf8") {
      console.log("🔥 WS utf8:", message.utf8Data);
      const data = JSON.parse(message.utf8Data);
      console.log("🔥 Parsed WS data:", data);

      if (data.type === "like" || data.type === "dislike") {
        console.log("🔥 Incoming like/dislike timestamp:", data.timestamp);
        console.log(
          "🔥 Messages on server:",
          userMessageArr.map((m) => m.timestamp),
        );

        const msg = userMessageArr.find((m) => m.timestamp === data.timestamp);
        
        if (msg) {
          if (data.type === "like") msg.likes += 1;
          if (data.type === "dislike") msg.dislikes += 1;

          // Broadcast updated message to all clients
          
          webSocketServer.connections.forEach((conn) => {
            console.log("💥 Broadcasting message to clients:", msg);
            conn.sendUTF(JSON.stringify(msg));
          });
        }
      } else {
        console.log("Received via WebSocket:", data);
      }
    }
  });

  connection.on("close", () => {
    console.log("WebSocket client disconnected");
  });
});


// Define the port where the backend server will run
const port = 3000;

// Array to store all messages in memory
const userMessageArr = [];

// POST endpoint to receive a new message
app.post("/messages", (req, res) => {
  // Extract user and text from the request body
  let { user, text, likes, dislikes } = req.body;

  // Validate input: user and text must exist and be strings
  if (!user || !text || typeof user !== "string" || typeof text !== "string") {
    return res.status(400).json({ error: "Invalid user or text" });
  }

  // Escape any HTML or script tags to prevent XSS/injection
  user = escapeHtml(user);
  text = escapeHtml(text);
  
  // Ensure likes and dislikes are numbers; default to 0 if missing/invalid
  likes = typeof likes === "number" && likes >= 0 ? likes : 0;
  dislikes = typeof dislikes === "number" && dislikes >= 0 ? dislikes : 0;

  // Create a new message object with a timestamp
  const newMessage = {
    user,
    text,
    timestamp: Date.now(),
    likes,
    dislikes,
  };

  // Log the received message
  console.log(`POST /messages: ${JSON.stringify(newMessage)}`);

  // Store the new message in the array
  userMessageArr.push(newMessage);
  webSocketServer.connections.forEach((conn) => {
    try{
    conn.sendUTF(JSON.stringify(newMessage));
    }catch(error){
      console.error("WebSocket send error:", error);
    }
  });

  // Respond to the client confirming the message was received
  res.json(newMessage);
});

// POST endpoint to like a message
app.post("/messages/:timestamp/like", (req, res) => {
  const timestamp = Number(req.params.timestamp); // Get the timestamp of the message from URL params
  // Find the message in the array by timestamp
  const message = userMessageArr.find((m) => m.timestamp === timestamp);
  if (message) {
    // Increment likes (initialize to 0 if undefined)
    message.likes = (message.likes || 0) + 1;

    // Broadcast updated message to all WebSocket clients
    webSocketServer.connections.forEach((conn) => {
      try {
        conn.sendUTF(JSON.stringify(message));
      } catch (err) {
        console.error("WebSocket send error:", err);
      }
    });

    // Respond with the updated likes count
    res.json({ success: true, likes: message.likes });
  } else {
    // If message not found, return 404
    res.status(404).json({ error: "Message not found" });
  }
});

// POST endpoint to dislike a message
app.post("/messages/:timestamp/dislike", (req, res) => {
  const timestamp = Number(req.params.timestamp); // Get the timestamp of the message from URL params

  // Find the message in the array by timestamp
  const message = userMessageArr.find((msg) => msg.timestamp === timestamp);

  if (message) {
    // Increment dislikes (initialize to 0 if undefined)
    message.dislikes = (message.dislikes || 0) + 1;

    // Broadcast updated message to all WebSocket clients
    webSocketServer.connections.forEach((conn) => {
      try {
        conn.sendUTF(JSON.stringify(message));
      } catch (err) {
        console.error("WebSocket send error:", err);
      }
    });

    // Respond with the updated dislikes count
    res.json({ success: true, dislikes: message.dislikes });
  } else {
    // If message not found, return 404
    res.status(404).json({ error: "Message not found" });
  }
});

// GET endpoint to return messages
app.get("/messages", (req, res) => {
  // Check if a "since" query parameter is provided (timestamp)
  const since = req.query.since ? Number(req.query.since) : undefined;

  // Log the GET request with the "since" timestamp
  console.log(`GET /messages?since=${since}`);

  // Logging and checking for NaN in timestamp
  if (since !== undefined && isNaN(since)) {
    return res.status(400).json({ error: "Invalid timestamp" });
  }

  // If since is provided, filter messages sent after that timestamp
  if (since !== undefined) {
    const newMessages = userMessageArr.filter((msg) => msg.timestamp > since);
    res.json(newMessages);
  } else {
    // If no since parameter, return all messages
    res.json(userMessageArr);
  }
});

// Start the server and listen for incoming requests
server.listen(port, () => {
  console.error(`Chat Server listening on port ${port}`);
});
