# Real-Time Chat Application

This is a simple real-time chat application built with **Node.js**, **Express**, and **WebSocket**, with a fallback to HTTP polling if WebSocket is disabled. Users can send messages, and like or dislike messages in real-time.

## Features

- Send and receive messages in real-time using WebSocket.
- Fallback to polling for environments where WebSocket is unavailable.
- Like and dislike messages.
- Prevents HTML/script injection using `escape-html`.
- Simple frontend with live updates.

## Technologies

- Backend: Node.js, Express, WebSocket
- Frontend: Vanilla JavaScript, HTML, CSS
- State management: Local array in memory
- Security: Escape HTML to prevent XSS

## Configuration

- `config.js` controls:
  - `USE_WEBSOCKET`: Enable/disable WebSocket
  - `SERVER_URL`: Backend HTTP server URL
  - `WEBSOCKET_URL`: WebSocket server URL

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/sheida-shab/Module-Decomposition.git

Install dependencies:
  npm install
Start the backend server:
  node server.js

## Open the frontend (polling.html) in your browser.

## Usage

Enter your name and message in the input fields.

Send the message; it will appear in the message list.

Click 👍 or 👎 to like or dislike messages.

Messages update in real-time if WebSocket is enabled, or every 2 seconds if polling is used.
