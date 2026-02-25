// config.js
// Configuration for the chat application

/**
 * Determines whether to use WebSocket or fallback to polling
 * - true: use WebSocket for real-time updates
 * - false: use polling to fetch messages periodically
 */
export const USE_WEBSOCKET = true;

/**
 * Determines whether to use long-polling or short-polling when WebSocket is disabled
 * - true: use long-polling (server holds requests until new message)
 * - false: use classic short-polling (every 2 seconds)
 */
export const USE_LONG_POLLING = false;


/**
 * URL of the backend server for HTTP requests (POST/GET)
 */
//export const SERVER_URL = "http://localhost:3000";
export const SERVER_URL =
  "https://sheida-shab-chatapp-backend.hosting.codeyourfuture.io";

/**
 * WebSocket server URL
 * Only used if USE_WEBSOCKET is true
 */
// export const WEBSOCKET_URL = "ws://localhost:3000";
export const WEBSOCKET_URL =
  "wss://sheida-shab-chatapp-backend.hosting.codeyourfuture.io";