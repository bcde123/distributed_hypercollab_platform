import api from "@/lib/axios"
import { createAsyncThunk } from "@reduxjs/toolkit"

/* ================= CREATE WORKSPACE ================= */
export const createWorkspace = createAsyncThunk(
  "workspace/create",
  async (workspaceData, { rejectWithValue }) => {
    try {
      const res = await api.post("/workspaces", workspaceData)
      return res.data
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to create workspace"
      )
    }
  }
)

/* ================= GENERATE INVITE LINK ================= */
export const generateInviteLink = createAsyncThunk(
  "workspace/generateInviteLink",
  async (
    { workspaceId, emails = [], expiryHours = 168 },
    { getState, rejectWithValue }
  ) => {
    try {
      const token = getState().auth.accessToken

      const body = { expiryHours }
      if (emails.length > 0) body.emails = emails

      const res = await api.post(
        `/workspaces/${workspaceId}/invite`,
        body,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      return {
        inviteLink: res.data.inviteLink,
        expiresAt: res.data.expiresAt,
        emailsSent: res.data.emailsSent || 0,
      }
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to generate invite link"
      )
    }
  }
)

/* ================= JOIN WORKSPACE ================= */
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
