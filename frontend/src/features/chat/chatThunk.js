import { createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/lib/axios";
import { encapsulateSecret, decapsulateSecret, encryptMessage, decryptMessage } from "@/crypto/crypto";
import { storeSharedSecret, getSharedSecret, getSecretKey, hasSharedSecret } from "@/crypto/keyStore";

// ── Fetch all chats for a workspace ──────────────────────────────────────
export const fetchWorkspaceChats = createAsyncThunk(
  "chat/fetchWorkspaceChats",
  async (workspaceId, { rejectWithValue }) => {
    try {
      const res = await api.get(`/chat/workspace/${workspaceId}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch chats");
    }
  }
);

// ── Derive shared secret for a DM (if not already cached) ───────────────
// Called when opening a DM for the first time as the receiver.
export const deriveSharedSecret = async (chat, currentUserId) => {
  if (!chat || chat.type !== "dm" || !chat.isEncrypted) return null;
  if (hasSharedSecret(chat._id)) return getSharedSecret(chat._id);

  // The initiator already stored their secret during createChat.
  // The receiver needs to decapsulate using their secret key.
  const isInitiator = chat.initiator?.toString() === currentUserId ||
                      chat.initiator === currentUserId;

  if (isInitiator) {
    // Initiator should already have the secret cached — if lost, need re-exchange
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

// ── Fetch messages for a specific chat (with decryption) ─────────────────
export const fetchMessages = createAsyncThunk(
  "chat/fetchMessages",
  async ({ chatId, isEncrypted }, { rejectWithValue }) => {
    try {
      const res = await api.get(`/chat/${chatId}`);
      let messages = res.data;

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
              return msg; // unencrypted message (shouldn't happen in encrypted chat)
            })
          );
          messages = decrypted;
        } else {
          // No shared secret — mark all as encrypted
          messages = messages.map((msg) => ({
            ...msg,
            content: msg.nonce ? "🔒 Encrypted (key not available)" : msg.content,
            _encrypted: !!msg.nonce,
          }));
        }
      }

      return { chatId, messages };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch messages");
    }
  }
);

// ── Send a message (with encryption for E2E chats) ───────────────────────
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
        } else {
          console.warn("🔒 No shared secret — sending plaintext");
        }
      }

      const res = await api.post("/chat/send", payload);

      // Return with plaintext content for local display
      // (the server stores ciphertext, but we show the original)
      return {
        ...res.data,
        content: content, // original plaintext for local Redux state
        _encrypted: false,
      };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to send message");
    }
  }
);

// ── Create a new chat (with KEM key exchange for DMs) ────────────────────
export const createChat = createAsyncThunk(
  "chat/createChat",
  async ({ type, workspaceId, members, name }, { rejectWithValue }) => {
    try {
      let kemCipherText = null;

      // For DMs: perform Kyber KEM key exchange
      if (type === "dm" && members.length === 1) {
        const otherUserId = members[0];

        // Fetch the other user's public key
        const pkRes = await api.get(`/chat/publickey/${otherUserId}`);
        const otherPublicKey = pkRes.data.publicKey;

        if (otherPublicKey) {
          // Encapsulate a shared secret using their public key
          const result = await encapsulateSecret(otherPublicKey);
          kemCipherText = result.kemCipherText;

          // We'll store the shared secret after we get the chatId back
          // For now, keep it in a temp variable
          var sharedSecret = result.sharedSecret;
          console.log("🔑 KEM encapsulation complete");
        } else {
          console.warn("🔑 Other user has no public key — creating unencrypted DM");
        }
      }

      const res = await api.post("/chat/create", {
        type,
        workspaceId,
        members,
        name,
        kemCipherText,
      });

      const chat = res.data;

      // Store the shared secret keyed by the new chat ID
      if (sharedSecret && chat._id) {
        storeSharedSecret(chat._id, sharedSecret);
        console.log("🔑 Shared secret stored for chat:", chat._id);
      }

      return chat;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to create chat");
    }
  }
);