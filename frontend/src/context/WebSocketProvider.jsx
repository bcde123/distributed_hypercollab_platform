import { createContext, useContext } from "react";
import { useWebSocket } from "@/hooks/useWebSocket";

const WebSocketContext = createContext(null);

/**
 * Mount once at the App/workspace level.
 * Children access WS methods via useWs().
 */
export function WebSocketProvider({ children }) {
  const ws = useWebSocket();

  return (
    <WebSocketContext.Provider value={ws}>
      {children}
    </WebSocketContext.Provider>
  );
}

/**
 * Convenience hook — components call useWs() to get
 * { sendChatMessage, joinRoom, leaveRoom, sendTyping, stopTyping, isConnected }
 */
export function useWs() {
  const ctx = useContext(WebSocketContext);
  if (!ctx) {
    throw new Error("useWs() must be used inside <WebSocketProvider>");
  }
  return ctx;
}
