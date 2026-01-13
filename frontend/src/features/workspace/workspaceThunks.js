import api from "@/lib/axios";
import { createAsyncThunk } from "@reduxjs/toolkit";

/**
 * CREATE WORKSPACE
 */
export const createWorkspace = createAsyncThunk(
  "workspace/create",
  async (workspaceData, { rejectWithValue }) => {
    try {
      const res = await api.post("/workspaces", workspaceData);
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to create workspace"
      );
    }
  }
);