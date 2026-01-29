// config.js
// Configuration for the chat application

/**
 * Determines whether to use WebSocket or fallback to polling
 * - true: use WebSocket for real-time updates
 * - false: use polling to fetch messages periodically
 */
export const USE_WEBSOCKET = false;

/**
 * URL of the backend server for HTTP requests (POST/GET)
 */
//export const SERVER_URL = "http://localhost:3000";
export const SERVER_URL =
  "https://sheida-shab-chatapp-backend.hosting.codeyourfuture.io/";

/**
 * WebSocket server URL
 * Only used if USE_WEBSOCKET is true
 */
// export const WEBSOCKET_URL = "ws://localhost:3000";
export const WEBSOCKET_URL =
  "ws://sheida-shab-chatapp-backend.hosting.codeyourfuture.io/";