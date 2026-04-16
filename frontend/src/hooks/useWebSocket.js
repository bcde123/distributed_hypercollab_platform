import { useEffect, useRef, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  receiveMessage,
  setOnlineUsers,
  addTypingUser,
  removeTypingUser,
} from "@/features/chat/chatSlice";

const WS_URL = "ws://localhost:5001/ws";
const RECONNECT_DELAYS = [1000, 2000, 4000, 8000, 16000]; // Exponential backoff

/**
 * Central WebSocket hook — connects once, dispatches to Redux.
 * Should be mounted at the App level (or workspace layout level).
 *
 * Returns:
 *   { sendWsMessage, joinRoom, leaveRoom, sendTyping, stopTyping, isConnected }
 */
export function useWebSocket() {
  const dispatch = useDispatch();
  const accessToken = useSelector((state) => state.auth.accessToken);
  const wsRef = useRef(null);
  const reconnectAttempt = useRef(0);
  const reconnectTimer = useRef(null);
  const isConnectedRef = useRef(false);
  const joinedRooms = useRef(new Set());

  // ── Connect ────────────────────────────────────────────────────────────
  const connect = useCallback(() => {
    if (!accessToken) return;

    // Clean up existing socket
    if (wsRef.current) {
      wsRef.current.onclose = null; // prevent reconnect loop
      wsRef.current.close();
    }

    const ws = new WebSocket(`${WS_URL}?token=${accessToken}`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("✅ WebSocket connected");
      isConnectedRef.current = true;
      reconnectAttempt.current = 0;

      // Re-join rooms that were previously joined
      for (const chatId of joinedRooms.current) {
        ws.send(JSON.stringify({ type: "join_room", payload: { chatId } }));
      }
    };

    ws.onmessage = (event) => {
      let msg;
      try {
        msg = JSON.parse(event.data);
      } catch {
        return;
      }

      switch (msg.type) {
        case "new_message":
          dispatch(receiveMessage(msg.payload));
          break;

        case "presence":
          dispatch(setOnlineUsers(msg.payload.users));
          break;

        case "user_typing":
          dispatch(addTypingUser(msg.payload));
          // Auto-remove after 3 seconds if no stop_typing arrives
          setTimeout(() => {
            dispatch(removeTypingUser(msg.payload));
          }, 3000);
          break;

        case "user_stop_typing":
          dispatch(removeTypingUser(msg.payload));
          break;

        case "auth_ok":
          console.log("🔑 WS authenticated as", msg.payload.username);
          break;

        case "auth_error":
          console.error("🔑 WS auth failed:", msg.payload.message);
          break;

        case "error":
          console.error("⚠️ WS error:", msg.payload.message);
          break;

        default:
          // joined_room, left_room, pong — no-op
          break;
      }
    };

    ws.onclose = () => {
      console.log("❌ WebSocket disconnected");
      isConnectedRef.current = false;

      // Auto-reconnect with exponential backoff
      const delay =
        RECONNECT_DELAYS[
          Math.min(reconnectAttempt.current, RECONNECT_DELAYS.length - 1)
        ];
      reconnectAttempt.current += 1;

      reconnectTimer.current = setTimeout(() => {
        console.log(`🔄 WS reconnecting (attempt ${reconnectAttempt.current})…`);
        connect();
      }, delay);
    };

    ws.onerror = (err) => {
      console.error("⚠️ WS error event:", err);
    };
  }, [accessToken, dispatch]);

  // ── Lifecycle ──────────────────────────────────────────────────────────
  useEffect(() => {
    connect();

    return () => {
      clearTimeout(reconnectTimer.current);
      if (wsRef.current) {
        wsRef.current.onclose = null; // prevent reconnect on intentional close
        wsRef.current.close();
      }
    };
  }, [connect]);

  // ── Public API ─────────────────────────────────────────────────────────

  const sendWsMessage = useCallback((type, payload) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, payload }));
    }
  }, []);

  const joinRoom = useCallback(
    (chatId) => {
      joinedRooms.current.add(chatId);
      sendWsMessage("join_room", { chatId });
    },
    [sendWsMessage]
  );

  const leaveRoom = useCallback(
    (chatId) => {
      joinedRooms.current.delete(chatId);
      sendWsMessage("leave_room", { chatId });
    },
    [sendWsMessage]
  );

  const sendChatMessage = useCallback(
    (chatId, content) => {
      sendWsMessage("send_message", { chatId, content });
    },
    [sendWsMessage]
  );

  const sendTyping = useCallback(
    (chatId) => {
      sendWsMessage("typing", { chatId });
    },
    [sendWsMessage]
  );

  const stopTyping = useCallback(
    (chatId) => {
      sendWsMessage("stop_typing", { chatId });
    },
    [sendWsMessage]
  );

  return {
    sendWsMessage,
    joinRoom,
    leaveRoom,
    sendChatMessage,
    sendTyping,
    stopTyping,
    isConnected: isConnectedRef,
  };
}
