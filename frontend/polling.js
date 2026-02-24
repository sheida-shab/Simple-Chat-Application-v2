import { messages, setMessages } from "./state.js";
import { USE_WEBSOCKET, SERVER_URL, USE_LONG_POLLING } from "./config.js";
import { sendWebSocketMessage } from "./websocket.js";

//////////////////////////////////////////////////
// Initial load
//////////////////////////////////////////////////

fetchInitialMessages();

if (!USE_WEBSOCKET) {
  fetchNewMessages();
}

//////////////////////////////////////////////////
// DOM references
//////////////////////////////////////////////////

const messageContainer = document.getElementById("messageContainer");
const messageForm = document.getElementById("sendMessageForm");
const userInput = document.getElementById("user");
const messageInput = document.getElementById("text");
const errorMessageContainer = document.getElementById("errorMessage");

messageContainer.classList.add("general");

//////////////////////////////////////////////////
// Handle sending a new message
//////////////////////////////////////////////////

messageForm.addEventListener("submit", async (e) => {
 
  e.preventDefault();

  const userName = userInput.value.trim();
  const messageText = messageInput.value.trim();

  if (!userName || !messageText) {
    errorMessageContainer.textContent =
      "Both userName and messageText must be filled.";
    errorMessageContainer.style.color = "red";
    return;
  }

  errorMessageContainer.textContent = "";

  const response = await fetch(`${SERVER_URL}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user: userName, text: messageText }),
  });
  
  if (!response.ok) {
    throw new Error(`Server error: ${response.status}`);
  }

  const result = await response.json();
 
  if (!result.timestamp) return;

  // Show success feedback
  errorMessageContainer.textContent = "Message sent successfully!";
  errorMessageContainer.style.color = "green";
  setTimeout(() => (errorMessageContainer.textContent = ""), 3000);

  // Only update local state when NOT using WebSocket
  if (!USE_WEBSOCKET) {
   if (!messages.find((m) => m.timestamp === result.timestamp)) {
     messages.push(result);
     renderMessages();
   }
  }
  
  userInput.value = "";
  messageInput.value = "";
});

//////////////////////////////////////////////////
// Render messages
//////////////////////////////////////////////////

export function renderMessages() {
  messageContainer.innerHTML = "";

  messages.forEach((msg) => {
    const messageDiv = document.createElement("div");
    messageDiv.classList.add("message");

    const userDiv = document.createElement("div");
    userDiv.classList.add("user");
    userDiv.textContent = `${msg.user}:`;

    const textDiv = document.createElement("div");
    textDiv.classList.add("text");
    textDiv.textContent = msg.text;

    const feedbackDiv = document.createElement("div");
    feedbackDiv.classList.add("feedback");

    const likeBtn = createFeedbackButton("👍", msg.likes, msg.timestamp);
    const dislikeBtn = createFeedbackButton("👎", msg.dislikes, msg.timestamp);

    feedbackDiv.append(likeBtn, dislikeBtn);
    messageDiv.append(userDiv, textDiv, feedbackDiv);
    messageContainer.appendChild(messageDiv);
  });

  messageContainer.scrollTop = messageContainer.scrollHeight;
}

//////////////////////////////////////////////////
// Feedback buttons (like / dislike)
//////////////////////////////////////////////////

function createFeedbackButton(icon, count = 0, timestamp) {
  const btn = document.createElement("button");
  btn.classList.add("feedbackButtons");
  btn.dataset.timestamp = timestamp;
  btn.textContent = `${icon}${count}`;

  btn.addEventListener("click", async () => {
    if (USE_WEBSOCKET) {
      sendWebSocketMessage(icon === "👍" ? "like" : "dislike", timestamp);
      return;
    }

    const action = icon === "👍" ? "like" : "dislike";
    const response = await fetch(
      `${SERVER_URL}/messages/${timestamp}/${action}`,
      { method: "POST" },
    );

    const data = await response.json();
    btn.textContent = `${icon}${data[action + "s"]}`;

    const msg = messages.find((m) => m.timestamp === timestamp);
    if (msg) msg[action + "s"] = data[action + "s"];
  });

  return btn;
}

//////////////////////////////////////////////////
// Polling: fetch new messages
//////////////////////////////////////////////////

async function fetchNewMessages() {
  const lastTimestamp =
    messages.length > 0 ? messages[messages.length - 1].timestamp : 0;

  try {
    const response = await fetch(
      `${SERVER_URL}/messages?since=${lastTimestamp}`,
    );
    const newMessages = await response.json();

    if (newMessages.length > 0) {
      newMessages.forEach((msg) => {
        if (!messages.find((m) => m.timestamp === msg.timestamp)) {
          messages.push(msg);
        }
      });
      renderMessages();
    }
  } catch (err) {
    console.error("Error fetching new messages:", err);
  }

  if (!USE_LONG_POLLING) {
     setTimeout(fetchNewMessages, 2000);
  }
}

//////////////////////////////////////////////////
// WebSocket updates
//////////////////////////////////////////////////

export function updateMessageFromWebSocket(updatedMessage) {
  const existing = messages.find(
    (m) => m.timestamp === updatedMessage.timestamp,
  );

  if (existing) {
    existing.likes = updatedMessage.likes;
    existing.dislikes = updatedMessage.dislikes;
  } else {
    messages.push(updatedMessage);
  }

  renderMessages();
}

//////////////////////////////////////////////////
// Initial load
//////////////////////////////////////////////////

async function fetchInitialMessages() {
  try {
    const response = await fetch(`${SERVER_URL}/messages`);
    const data = await response.json();
    setMessages(data);
    renderMessages();
  } catch (err) {
    console.error("Failed to load initial messages", err);
  }
}
