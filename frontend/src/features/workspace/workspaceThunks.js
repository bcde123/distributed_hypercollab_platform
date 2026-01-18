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



export const generateInviteLink = createAsyncThunk(
  "workspace/generateInviteLink",
  async (workspaceId, { getState, rejectWithValue }) => {
    try {
      const state = getState()
      const token = state.auth.accessToken // 👈 IMPORTANT
      console.log(workspaceId);
      const res = await api.post(
        `/workspaces/${workspaceId}/invite`,
        {}, // empty body
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      return res.data.inviteLink
    } catch (err) {
      console.error("INVITE ERROR:", err.response?.data)
      return rejectWithValue(
        err.response?.data?.message || "Failed to generate invite link"
      )
    }
  }
)


export const joinWorkspaceByInvite = createAsyncThunk(
  "workspace/joinWorkspaceByInvite",
  async (inviteToken, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.accessToken

      const res = await api.post(
        `/workspaces/join/${inviteToken}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      return res.data.workspace
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to join workspace"
      )
    }
  }
)