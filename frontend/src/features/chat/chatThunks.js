import { createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/lib/axios";

/* ================= FETCH MY CHATS ================= */
export const fetchMyChats = createAsyncThunk(
  "chat/fetchMyChats",
  async ({ workspaceId } = {}, { rejectWithValue }) => {
    try {
      const params = workspaceId ? `?workspaceId=${workspaceId}` : "";
      const res = await api.get(`/chat/my-chats${params}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch chats"
      );
    }
  }
);

/* ================= CREATE CHAT (DM or Channel) ================= */
export const createChat = createAsyncThunk(
  "chat/createChat",
  async ({ type, name, members, workspaceId }, { rejectWithValue }) => {
    try {
      const res = await api.post("/chat/create", {
        type,
        name,
        members,
        workspaceId,
      });
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to create chat"
      );
    }
  }
);

/* ================= FETCH MESSAGES ================= */
export const fetchMessages = createAsyncThunk(
  "chat/fetchMessages",
  async ({ chatId, page = 1, limit = 50 }, { rejectWithValue }) => {
    try {
      const res = await api.get(
        `/chat/${chatId}/messages?page=${page}&limit=${limit}`
      );
      return { chatId, ...res.data };
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch messages"
      );
    }
  }
);

/* ================= SEND MESSAGE (REST fallback) ================= */
export const sendMessageREST = createAsyncThunk(
  "chat/sendMessageREST",
  async ({ chatId, content }, { rejectWithValue }) => {
    try {
      const res = await api.post("/chat/send", { chatId, content });
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to send message"
      );
    }
  }
);

/* ================= FETCH ONLINE USERS ================= */
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
