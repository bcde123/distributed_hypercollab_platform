import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/lib/axios';

/* ================= CREATE BOARD ================= */
export const createBoard = createAsyncThunk(
  'board/createBoard',
  async ({ workspaceId, title, background }, { rejectWithValue }) => {
    try {
      const res = await api.post(
        `/workspaces/${workspaceId}/boards`,
        { title, background }
      );
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Failed to create board'
      );
    }
  }
);

/* ================= GET BOARDS ================= */
export const getBoardsByWorkspace = createAsyncThunk(
  'board/getBoardsByWorkspace',
  async (workspaceId, { rejectWithValue }) => {
    try {
      const res = await api.get(
        `/workspaces/${workspaceId}/boards`
      );
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Failed to fetch boards'
      );
    }
  }
);

/* ================= GET BOARD ================= */
export const getBoardById = createAsyncThunk(
  'board/getBoardById',
  async ({ workspaceId, boardId }, { rejectWithValue }) => {
    try {
      const res = await api.get(
        `/workspaces/${workspaceId}/boards/${boardId}`
      );
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Failed to fetch board'
      );
    }
  }
);

/* ================= GET FULL BOARD ================= */
export const getFullBoard = createAsyncThunk(
  'board/getFullBoard',
  async ({ workspaceId, boardId }, { rejectWithValue }) => {
    try {
      const res = await api.get(
        `/workspaces/${workspaceId}/boards/${boardId}/full`
      );
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Failed to fetch full board'
      );
    }
  }
);

/* ================= CLOSE BOARD ================= */
export const deleteBoard = createAsyncThunk(
  'board/deleteBoard',
  async ({ workspaceId, boardId }, { rejectWithValue }) => {
    try {
      const res = await api.patch(
        `/workspaces/${workspaceId}/boards/${boardId}/close`
      );
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Failed to delete board'
      );
    }
  }
);
