console.log("script.js is connected");

let messages = []; // store all seen messages

// Start fetching new messages repeatedly
fetchNewMessages();
//////////////////////////////////////////////////
// DOM references
//////////////////////////////////////////////////

const messageContainer = document.getElementById("messageContainer");
messageContainer.classList.add("general");

const messageForm = document.getElementById("sendMessageForm");
const userInput = document.getElementById("user");
const messageInput = document.getElementById("text");
const errorMessageContainer = document.getElementById("errorMessage");

//////////////////////////////////////////////////
// Handle form submission (sending a new message)
//////////////////////////////////////////////////

messageForm.addEventListener("submit", async (e) => {
  e.preventDefault(); // prevent default form submission

  const userName = userInput.value.trim();
  const message = messageInput.value.trim();

  // Validate inputs-both user and message must be filled
  if (!userName || !message) {
    errorMessageContainer.textContent =
      "Both userName and messageText must be filled.";
    errorMessageContainer.style.color = "red";
    return;
  } else {
    errorMessageContainer.textContent = ""; // clear any previous errors
    const data = { user: userName, text: message };

    // POST the new message to the server
    const response = await fetch(
      "https://sheida-shab-chatapp-backend.hosting.codeyourfuture.io/messages",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }
    );

    // Check if the server responded with an error
    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    // If everything is ok, get the response text
    const result = await response.text();
    console.log(result);

    if (result === "received") {
      // Show success message to the user
      errorMessageContainer.textContent = "message sent successfully!";
      errorMessageContainer.style.color = "green";
      setTimeout(() => {
        errorMessageContainer.textContent = "";
      }, 3000);

      // Add the new message to local state with timestamp and initial likes/dislikes
      messages.push({
        user: userName,
        text: message,
        timestamp: Date.now(),
        likes: 0,
        dislikes: 0,
      });

      // Re-render all messages to include the new one
      renderMessages();

      // Clear input fields after sending
      userInput.value = "";
      messageInput.value = "";
    }
  }
});

//////////////////////////////////////////////////
// Render messages to the DOM
//////////////////////////////////////////////////

async function renderMessages() {
  messageContainer.innerHTML = ""; // clear container

  // Loop through each message and create its DOM elements
  messages.forEach((obj) => {
    const newMessage = document.createElement("div");
    newMessage.classList.add("message");

    // Create span for the user name
    const userDiv = document.createElement("div");
    userDiv.classList.add("user");
    userDiv.textContent = obj.user + ": ";
    newMessage.appendChild(userDiv);

    // Create span for the message text
    const textDiv = document.createElement("div");
    textDiv.classList.add("text");
    textDiv.textContent = obj.text;
    newMessage.appendChild(textDiv);

    // Create like button
    const likeBtn = document.createElement("button");
    likeBtn.classList.add("feedbackButtons");
    likeBtn.setAttribute("data-timestamp", obj.timestamp); // store timestamp in dataset
    likeBtn.textContent = "👍" + (obj.likes || 0);

    // Create dislike button
    const dislikeBtn = document.createElement("button");
    dislikeBtn.classList.add("feedbackButtons");
    dislikeBtn.setAttribute("data-timestamp", obj.timestamp); // store timestamp in dataset
    dislikeBtn.textContent = "👎" + (obj.dislikes || 0);

    const feedbackDiv = document.createElement("div");
    feedbackDiv.classList.add("feedback");
    feedbackDiv.appendChild(likeBtn);
    feedbackDiv.appendChild(dislikeBtn);
    newMessage.appendChild(feedbackDiv);

    //////////////////////////////////////////////////
    //Add click event listener for liking a message
    //////////////////////////////////////////////////
    likeBtn.addEventListener("click", async (e) => {
      const thisMessageTimestamp = likeBtn.dataset.timestamp;
      const url = `https://sheida-shab-chatapp-backend.hosting.codeyourfuture.io/messages/${thisMessageTimestamp}/like`;
      try {
        const response = await fetch(url, { method: "post" });
        const data = await response.json();

        // Update button text immediately
        likeBtn.textContent = "👍" + data.likes;

        // Update the local messages array so front-end stays consistent
        const currentMessage = messages.find(
          (msg) => msg.timestamp === Number(thisMessageTimestamp)
        );
        if (currentMessage) {
          currentMessage.likes = data.likes;
        } else {
          console.warn(
            "Message not found in local array:",
            thisMessageTimestamp
          );
        }
      } catch (error) {
        console.error("Error liking message:", error);
      }
    });

    //////////////////////////////////////////////////
    //Add click event listener for disliking a message
    //////////////////////////////////////////////////
    dislikeBtn.addEventListener("click", async (e) => {
      const thisMessageTimestamp = dislikeBtn.dataset.timestamp;
      const url = `https://sheida-shab-chatapp-backend.hosting.codeyourfuture.io/messages/${thisMessageTimestamp}/dislike`;
      try {
        const response = await fetch(url, { method: "post" });
        const data = await response.json();

        // Update button text immediately
        dislikeBtn.textContent = "👎" + data.dislikes;

        // Update the local messages array
        const currentMessage = messages.find(
          (msg) => msg.timestamp === Number(thisMessageTimestamp)
        );
        if (currentMessage) {
          currentMessage.dislikes = data.dislikes;
        } else {
          console.warn(
            "Message not found in local array:",
            thisMessageTimestamp
          );
        }
      } catch (error) {
        console.error("Error disliking message:", error);
      }
    });

    // Append the whole message div to the container
    messageContainer.appendChild(newMessage);
  });
  // Scroll container to the bottom so the newest messages are visible
  messageContainer.scrollTop = messageContainer.scrollHeight;
}

//////////////////////////////////////////////////
// Fetch new messages from the server using "fast polling"
//////////////////////////////////////////////////

async function fetchNewMessages() {
  // Find the timestamp of the last message we have
  const lastTimestamp =
    messages.length > 0 ? messages[messages.length - 1].timestamp : 0;

  //Construct the GET URL with query parameter ?since=<timestamp>
  const url = `https://sheida-shab-chatapp-backend.hosting.codeyourfuture.io/messages?since=${lastTimestamp}`;

  //GET new messages from the server
  try {
    const response = await fetch(url);
    const newMessages = await response.json();
    if (newMessages.length > 0) {
      // Use the spread operator to add each new message individually to the messages array
      messages.push(...newMessages);

      // Render updated messages
      renderMessages();
    }
  } catch (error) {
    console.error("Error fetching new messages:", error);
  }
  // Call this function again after 2 seconds
  setTimeout(fetchNewMessages, 2000);
}
