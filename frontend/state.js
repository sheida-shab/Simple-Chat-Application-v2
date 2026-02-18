// state.js
// This module manages the client-side state of messages

// Array to store all messages locally
export let messages = [];

/**
 * Replace the current messages array with a new array
 * @param {Array} newMessages - Array of message objects
 */
export function setMessages(newMessages) {
  messages = newMessages;
}

/**
 * Update a message in the local array if it exists,
 * or add it if it doesn't exist yet.
 * @param {Object} updatedMessage - Message object with updated likes/dislikes
 */
export function updateMessage(updatedMessage) {
  // Find existing message by timestamp
  const existing = messages.find(
    (m) => m.timestamp === updatedMessage.timestamp,
  );

  if (existing) {
    // Update likes and dislikes
    existing.likes = updatedMessage.likes;
    existing.dislikes = updatedMessage.dislikes;
  } else {
    // Add new message to the array
    messages.push(updatedMessage);
  }
}
