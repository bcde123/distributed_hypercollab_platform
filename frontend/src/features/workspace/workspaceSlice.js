import { createSlice } from "@reduxjs/toolkit"
import {
  createWorkspace,
  generateInviteLink,
  joinWorkspaceByInvite,
  getWorkspaceBySlug,
} from "./workspaceThunks"

const initialState = {
  workspaces: [],
  currentWorkspace: null,

  invite: {
    link: null,
    expiresAt: null,
    emailsSent: 0,
  },

  isLoading: false,
  error: null,
}

const workspaceSlice = createSlice({
  name: "workspace",
  initialState,
  reducers: {
    clearInviteLink(state) {
      state.invite = {
        link: null,
        expiresAt: null,
        emailsSent: 0,
      }
    },
    clearCurrentWorkspace(state) {
      state.currentWorkspace = null
    },
  },
  extraReducers: (builder) => {
    builder
      /* ================= CREATE WORKSPACE ================= */
      .addCase(createWorkspace.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(createWorkspace.fulfilled, (state, action) => {
        state.isLoading = false
        state.currentWorkspace = action.payload.workspace
        state.workspaces.push(action.payload.workspace)
      })
      .addCase(createWorkspace.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })

      /* ================= GENERATE INVITE LINK ================= */
      .addCase(generateInviteLink.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(generateInviteLink.fulfilled, (state, action) => {
        state.isLoading = false
        state.invite.link = action.payload.inviteLink
        state.invite.expiresAt = action.payload.expiresAt
        state.invite.emailsSent = action.payload.emailsSent
      })
      .addCase(generateInviteLink.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })

      /* ================= JOIN WORKSPACE ================= */
      .addCase(joinWorkspaceByInvite.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(joinWorkspaceByInvite.fulfilled, (state, action) => {
        state.isLoading = false
        state.currentWorkspace = action.payload
      })
      .addCase(joinWorkspaceByInvite.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })

      .addCase(getWorkspaceBySlug.pending, (state) => {
  state.isLoading = true;
  state.error = null;
})
.addCase(getWorkspaceBySlug.fulfilled, (state, action) => {
  state.isLoading = false;
  state.currentWorkspace = action.payload;
})
.addCase(getWorkspaceBySlug.rejected, (state, action) => {
  state.isLoading = false;
  state.error = action.payload;
})

  },
})

export const { clearInviteLink, clearCurrentWorkspace } =
  workspaceSlice.actions

export default workspaceSlice.reducer
