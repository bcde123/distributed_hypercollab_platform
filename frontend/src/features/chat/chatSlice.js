import { createSlice } from "@reduxjs/toolkit";
import {
  fetchMyChats,
  createChat,
  fetchMessages,
  sendMessageREST,
  fetchOnlineUsers,
} from "./chatThunks";

const initialState = {
  // Chat list
  chats: [],
  chatsLoading: false,
  chatsError: null,

  // Active conversation
  activeChat: null,

  // Messages keyed by chatId
  messagesByChat: {},
  messagesLoading: false,
  messagesError: null,

  // Online users
  onlineUsers: [],

  // Typing indicators: { [chatId]: [{ userId, username }] }
  typingUsers: {},
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    // Set the active conversation
    setActiveChat(state, action) {
      state.activeChat = action.payload;
    },

    // Clear active conversation
    clearActiveChat(state) {
      state.activeChat = null;
    },

    // WebSocket: receive a new message in real-time
    receiveMessage(state, action) {
      const msg = action.payload;
      const chatId = msg.chatId;

      if (!state.messagesByChat[chatId]) {
        state.messagesByChat[chatId] = [];
      }

      // Prevent duplicates (dedup by _id)
      const exists = state.messagesByChat[chatId].some(
        (m) => m._id === msg._id
      );
      if (!exists) {
        state.messagesByChat[chatId].push(msg);
      }

      // Update lastMessage on chat in the list
      const chatIdx = state.chats.findIndex((c) => c._id === chatId);
      if (chatIdx !== -1) {
        state.chats[chatIdx].lastMessage = msg;
        state.chats[chatIdx].updatedAt = msg.createdAt;

        // Move chat to top of list
        const [chat] = state.chats.splice(chatIdx, 1);
        state.chats.unshift(chat);
      }
    },

    // WebSocket: update online users
    setOnlineUsers(state, action) {
      state.onlineUsers = action.payload;
    },

    // WebSocket: typing indicator
    addTypingUser(state, action) {
      const { chatId, userId, username } = action.payload;
      if (!state.typingUsers[chatId]) {
        state.typingUsers[chatId] = [];
      }
      const exists = state.typingUsers[chatId].some(
        (u) => u.userId === userId
      );
      if (!exists) {
        state.typingUsers[chatId].push({ userId, username });
      }
    },

    // WebSocket: stop typing
    removeTypingUser(state, action) {
      const { chatId, userId } = action.payload;
      if (state.typingUsers[chatId]) {
        state.typingUsers[chatId] = state.typingUsers[chatId].filter(
          (u) => u.userId !== userId
        );
      }
    },
  },
  extraReducers: (builder) => {
    builder
      /* ================= FETCH MY CHATS ================= */
      .addCase(fetchMyChats.pending, (state) => {
        state.chatsLoading = true;
        state.chatsError = null;
      })
      .addCase(fetchMyChats.fulfilled, (state, action) => {
        state.chatsLoading = false;
        state.chats = action.payload;
      })
      .addCase(fetchMyChats.rejected, (state, action) => {
        state.chatsLoading = false;
        state.chatsError = action.payload;
      })

      /* ================= CREATE CHAT ================= */
      .addCase(createChat.pending, (state) => {
        state.chatsLoading = true;
        state.chatsError = null;
      })
      .addCase(createChat.fulfilled, (state, action) => {
        state.chatsLoading = false;
        // Add to list if not already there
        const exists = state.chats.some((c) => c._id === action.payload._id);
        if (!exists) {
          state.chats.unshift(action.payload);
        }
        state.activeChat = action.payload;
      })
      .addCase(createChat.rejected, (state, action) => {
        state.chatsLoading = false;
        state.chatsError = action.payload;
      })

      /* ================= FETCH MESSAGES ================= */
      .addCase(fetchMessages.pending, (state) => {
        state.messagesLoading = true;
        state.messagesError = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.messagesLoading = false;
        const { chatId, messages } = action.payload;
        state.messagesByChat[chatId] = messages;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.messagesLoading = false;
        state.messagesError = action.payload;
      })

      /* ================= SEND MESSAGE (REST) ================= */
      .addCase(sendMessageREST.fulfilled, (state, action) => {
        const msg = action.payload;
        const chatId = msg.chatId;
        if (!state.messagesByChat[chatId]) {
          state.messagesByChat[chatId] = [];
        }
        const exists = state.messagesByChat[chatId].some(
          (m) => m._id === msg._id
        );
        if (!exists) {
          state.messagesByChat[chatId].push(msg);
        }
      })

      /* ================= FETCH ONLINE USERS ================= */
      .addCase(fetchOnlineUsers.fulfilled, (state, action) => {
        state.onlineUsers = action.payload;
      });
  },
});

export const {
  setActiveChat,
  clearActiveChat,
  receiveMessage,
  setOnlineUsers,
  addTypingUser,
  removeTypingUser,
} = chatSlice.actions;

export default chatSlice.reducer;
