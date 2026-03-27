import { useDispatch, useSelector } from "react-redux";
import AppRouter from "./router/AppRouter";
import { Toaster } from "sonner";
import { checkAuth } from "./features/auth/authThunks";
import { useEffect } from "react";
import { addIncomingMessage } from "./features/chat/chatSlice";
import { decryptMessage } from "./crypto/crypto";
import { getSharedSecret } from "./crypto/keyStore";


export default function App() {
  const dispatch = useDispatch();
  const currentUserId = useSelector((state) => state.auth.user?._id);

  // ✅ Auth check on mount (also triggers Kyber keypair generation)
  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);

  // 🔥 WebSocket connection → Redux bridge (with E2E decryption)
  useEffect(() => {
    const socket = new WebSocket("ws://localhost:8080");

    socket.onopen = () => {
      console.log("✅ Connected to WS");
    };

    socket.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "NEW_MESSAGE" && data.message) {
          const msg = data.message;

          // Don't dispatch our own messages (they're already in Redux from sendMessage thunk)
          const senderId = typeof msg.sender === "object" ? msg.sender._id : msg.sender;
          if (senderId === currentUserId) return;

          // Decrypt if message has a nonce (E2E encrypted)
          if (msg.nonce && msg.chatId) {
            const secret = getSharedSecret(msg.chatId);
            if (secret) {
              try {
                const plaintext = await decryptMessage(msg.content, msg.nonce, secret);
                dispatch(addIncomingMessage({ ...msg, content: plaintext, _encrypted: false }));
              } catch (err) {
                console.error("🔓 WS decrypt failed:", err);
                dispatch(addIncomingMessage({ ...msg, content: "🔒 Unable to decrypt", _encrypted: true }));
              }
            } else {
              dispatch(addIncomingMessage({ ...msg, content: "🔒 Encrypted (key not available)", _encrypted: true }));
            }
          } else {
            // Plaintext message (channels or unencrypted DMs)
            dispatch(addIncomingMessage(msg));
          }
        }
      } catch (err) {
        console.error("WS parse error:", err);
      }
    };

    socket.onclose = () => {
      console.log("❌ WS disconnected");
    };

    return () => {
      socket.close();
    };
  }, [dispatch, currentUserId]);

  return (
    <>
      <AppRouter />
      <Toaster richColors position="top-right" />
    </>
  );
}