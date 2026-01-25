// state.js
export let messages = [];

export function setMessages(newMessages) {
  messages = newMessages;
}

export function updateMessage(updatedMessage) {
  const existing = messages.find(
    (m) => m.timestamp === updatedMessage.timestamp,
  );

  if (existing) {
    existing.likes = updatedMessage.likes;
    existing.dislikes = updatedMessage.dislikes;
  } else {
    messages.push(updatedMessage);
  }
}
