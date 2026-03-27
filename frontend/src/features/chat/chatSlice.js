import { createSlice } from "@reduxjs/toolkit";
import { fetchWorkspaceChats, fetchMessages, sendMessage, createChat } from "./chatThunk";

const initialState = {
  conversations: [],
  activeConversation: null,
  messagesByChat: {},
  isLoading: false,
  messagesLoading: false,
  sendingMessage: false,
  error: null,
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setActiveConversation(state, action) {
      state.activeConversation = action.payload;
    },
    clearActiveConversation(state) {
      state.activeConversation = null;
    },
    addIncomingMessage(state, action) {
      const message = action.payload;
      const chatId = message.chatId;
      if (!chatId) return;

      // Only add if we have this chat loaded and the message isn't already there
      if (state.messagesByChat[chatId]) {
        const exists = state.messagesByChat[chatId].some((m) => m._id === message._id);
        if (!exists) {
          state.messagesByChat[chatId].push(message);
        }
      }
    },
    clearChat(state) {
      state.conversations = [];
      state.activeConversation = null;
      state.messagesByChat = {};
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      /* ═══════ FETCH WORKSPACE CHATS ═══════ */
      .addCase(fetchWorkspaceChats.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchWorkspaceChats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.conversations = action.payload;
      })
      .addCase(fetchWorkspaceChats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      /* ═══════ FETCH MESSAGES ═══════ */
      .addCase(fetchMessages.pending, (state) => {
        state.messagesLoading = true;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.messagesLoading = false;
        state.messagesByChat[action.payload.chatId] = action.payload.messages;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.messagesLoading = false;
        state.error = action.payload;
      })

      /* ═══════ SEND MESSAGE ═══════ */
      .addCase(sendMessage.pending, (state) => {
        state.sendingMessage = true;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.sendingMessage = false;
        const message = action.payload;
        const chatId = message.chatId;
        if (!state.messagesByChat[chatId]) {
          state.messagesByChat[chatId] = [];
        }
        // Avoid duplicate (WebSocket might deliver it first)
        const exists = state.messagesByChat[chatId].some((m) => m._id === message._id);
        if (!exists) {
          state.messagesByChat[chatId].push(message);
        }
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.sendingMessage = false;
        state.error = action.payload;
      })

      /* ═══════ CREATE CHAT ═══════ */
      .addCase(createChat.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createChat.fulfilled, (state, action) => {
        state.isLoading = false;
        const newChat = action.payload;
        // Avoid duplicates (createChat for DM returns existing)
        const exists = state.conversations.some((c) => c._id === newChat._id);
        if (!exists) {
          state.conversations.unshift(newChat);
        }
        state.activeConversation = newChat;
      })
      .addCase(createChat.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { setActiveConversation, clearActiveConversation, addIncomingMessage, clearChat } =
  chatSlice.actions;
export default chatSlice.reducer;
