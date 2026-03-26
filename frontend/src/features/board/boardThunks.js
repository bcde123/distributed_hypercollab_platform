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

/* ================= UPDATE BOARD ================= */
export const updateBoard = createAsyncThunk(
  'board/updateBoard',
  async ({ workspaceId, boardId, title, background }, { rejectWithValue }) => {
    try {
      const res = await api.put(
        `/workspaces/${workspaceId}/boards/${boardId}`,
        { title, background }
      );
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update board');
    }
  }
);

/* ================= CREATE LIST ================= */
export const createList = createAsyncThunk(
  'board/createList',
  async ({ workspaceId, boardId, title }, { rejectWithValue }) => {
    try {
      const res = await api.post(
        `/workspaces/${workspaceId}/boards/${boardId}/lists`,
        { title }
      );
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create list');
    }
  }
);

/* ================= UPDATE LIST ================= */
export const updateList = createAsyncThunk(
  'board/updateList',
  async ({ workspaceId, boardId, listId, title }, { rejectWithValue }) => {
    try {
      const res = await api.put(
        `/workspaces/${workspaceId}/boards/${boardId}/lists/${listId}`,
        { title }
      );
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update list');
    }
  }
);

/* ================= DELETE LIST ================= */
export const deleteList = createAsyncThunk(
  'board/deleteList',
  async ({ workspaceId, boardId, listId }, { rejectWithValue }) => {
    try {
      await api.delete(
        `/workspaces/${workspaceId}/boards/${boardId}/lists/${listId}`
      );
      return { listId };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete list');
    }
  }
);

/* ================= CREATE TASK ================= */
export const createTask = createAsyncThunk(
  'board/createTask',
  async ({ workspaceId, boardId, listId, title, description }, { rejectWithValue }) => {
    try {
      const res = await api.post(
        `/workspaces/${workspaceId}/boards/${boardId}/tasks/lists/${listId}`,
        { title, description }
      );
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create task');
    }
  }
);

/* ================= UPDATE TASK ================= */
export const updateTask = createAsyncThunk(
  'board/updateTask',
  async ({ workspaceId, boardId, taskId, listId, title, description, rank, status }, { rejectWithValue }) => {
    try {
      const res = await api.put(
        `/workspaces/${workspaceId}/boards/${boardId}/tasks/${taskId}`,
        { listId, title, description, rank, status }
      );
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update task');
    }
  }
);

/* ================= DELETE TASK ================= */
export const deleteTask = createAsyncThunk(
  'board/deleteTask',
  async ({ workspaceId, boardId, taskId, listId }, { rejectWithValue }) => {
    try {
      await api.delete(
        `/workspaces/${workspaceId}/boards/${boardId}/tasks/${taskId}`
      );
      return { taskId, listId };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete task');
    }
  }
);
