import { createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/lib/axios";
import {
  encapsulateSecret,
  decapsulateSecret,
  encryptMessage,
  decryptMessage,
} from "@/crypto/crypto";
import {
  storeSharedSecret,
  getSharedSecret,
  getSecretKey,
  hasSharedSecret,
} from "@/crypto/keyStore";

/**
 * ── Fetch my chats ──────────────────────────────────────────────────────────
 * Gets all chats for the current user (optionally filtered by workspace)
 */
export const fetchMyChats = createAsyncThunk(
  "chat/fetchMyChats",
  async ({ workspaceId } = {}, { rejectWithValue }) => {
    try {
      const res = await api.get("/chat/my-chats", {
        params: { workspaceId },
      });
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch chats"
      );
    }
  }
);

/**
 * ── Fetch workspace chats ───────────────────────────────────────────────────
 * Alternative endpoint to fetch chats explicitly by workspace ID
 */
export const fetchWorkspaceChats = createAsyncThunk(
  "chat/fetchWorkspaceChats",
  async (workspaceId, { rejectWithValue }) => {
    try {
      const res = await api.get(`/chat/workspace/${workspaceId}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch workspace chats"
      );
    }
  }
);

/**
 * ── Derive shared secret for a DM ──────────────────────────────────────────
 * (Logic from remote chatThunk.js)
 */
export const deriveSharedSecret = async (chat, currentUserId) => {
  if (!chat || chat.type !== "dm" || !chat.isEncrypted) return null;
  if (hasSharedSecret(chat._id)) return getSharedSecret(chat._id);

  const initiatorId = typeof chat.initiator === "object" ? chat.initiator._id : chat.initiator;
  const isInitiator = initiatorId?.toString() === currentUserId?.toString();

  if (isInitiator) {
    // Initiator should already have the secret cached
    console.warn("🔑 Initiator lost shared secret — cannot re-derive without re-exchange");
    return null;
  }

  // Receiver: decapsulate the KEM ciphertext with our secret key
  const mySK = getSecretKey();
  if (!mySK || !chat.kemCipherText) {
    console.warn("🔑 Cannot derive shared secret: missing SK or kemCipherText");
    return null;
  }

  try {
    const sharedSecret = await decapsulateSecret(chat.kemCipherText, mySK);
    storeSharedSecret(chat._id, sharedSecret);
    console.log("🔑 Shared secret derived for chat:", chat._id);
    return sharedSecret;
  } catch (err) {
    console.error("🔑 Decapsulation failed:", err);
    return null;
  }
};

/**
 * ── Fetch messages ──────────────────────────────────────────────────────────
 */
export const fetchMessages = createAsyncThunk(
  "chat/fetchMessages",
  async ({ chatId, isEncrypted }, { rejectWithValue }) => {
    try {
      const res = await api.get(`/chat/${chatId}/messages`);
      let { messages } = res.data;

      // Decrypt messages if chat is E2E encrypted
      if (isEncrypted) {
        const secret = getSharedSecret(chatId);
        if (secret) {
          const decrypted = await Promise.all(
            messages.map(async (msg) => {
              if (msg.nonce) {
                try {
                  const plaintext = await decryptMessage(msg.content, msg.nonce, secret);
                  return { ...msg, content: plaintext, _encrypted: false };
                } catch (err) {
                  console.error("🔓 Decrypt failed for msg:", msg._id, err);
                  return { ...msg, content: "🔒 Unable to decrypt", _encrypted: true };
                }
              }
              return msg;
            })
          );
          messages = decrypted;
        } else {
          messages = messages.map((msg) => ({
            ...msg,
            content: msg.nonce ? "🔒 Encrypted (key not available)" : msg.content,
            _encrypted: !!msg.nonce,
          }));
        }
      }

      return { chatId, messages };
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch messages"
      );
    }
  }
);

/**
 * ── Send message (REST) ─────────────────────────────────────────────────────
 */
export const sendMessage = createAsyncThunk(
  "chat/sendMessage",
  async ({ chatId, content, isEncrypted }, { rejectWithValue }) => {
    try {
      let payload = { chatId, content };

      // Encrypt if this is an E2E encrypted chat
      if (isEncrypted) {
        const secret = getSharedSecret(chatId);
        if (secret) {
          const encrypted = await encryptMessage(content, secret);
          payload = {
            chatId,
            content: encrypted.cipherText,
            nonce: encrypted.nonce,
          };
        }
      }

      const res = await api.post("/chat/send", payload);

      // Return with plaintext content for local display
      return {
        ...res.data,
        content: content,
        _encrypted: false,
      };
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to send message"
      );
    }
  }
);

/**
 * ── Create chat (with KEM exchange for DMs) ──────────────────────────────────
 */
export const createChat = createAsyncThunk(
  "chat/createChat",
  async ({ type, name, members, workspaceId }, { rejectWithValue }) => {
    try {
      let kemCipherText = null;
      let sharedSecret = null;

      // For DMs: perform Kyber KEM key exchange
      if (type === "dm" && members.length === 1) {
        const otherUserId = members[0];
        const pkRes = await api.get(`/chat/publickey/${otherUserId}`);
        const otherPublicKey = pkRes.data.publicKey;

        if (otherPublicKey) {
          const result = await encapsulateSecret(otherPublicKey);
          kemCipherText = result.kemCipherText;
          sharedSecret = result.sharedSecret;
          console.log("🔑 KEM encapsulation complete");
        }
      }

      const res = await api.post("/chat/create", {
        type,
        name,
        members,
        workspaceId,
        kemCipherText,
      });

      const chat = res.data;

      // Store the shared secret
      if (sharedSecret && chat._id) {
        storeSharedSecret(chat._id, sharedSecret);
        console.log("🔑 Shared secret stored for chat:", chat._id);
      }

      return chat;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to create chat"
      );
    }
  }
);

/**
 * ── Fetch Online Users ──────────────────────────────────────────────────────
 */
export const fetchOnlineUsers = createAsyncThunk(
  "chat/fetchOnlineUsers",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/chat/online");
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch online users"
      );
    }
  }
);
