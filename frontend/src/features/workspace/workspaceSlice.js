import { createSlice } from "@reduxjs/toolkit"
import {
  createWorkspace,
  generateInviteLink,
  joinWorkspaceByInvite,
} from "./workspaceThunks"

const initialState = {
  workspaces: [],
  currentWorkspace: null,   // ✅ important
  inviteLink: null,         // ✅ important
  isLoading: false,
  error: null,
}

const workspaceSlice = createSlice({
  name: "workspace",
  initialState,
  reducers: {
    clearInviteLink(state) {
      state.inviteLink = null
    },
    clearCurrentWorkspace(state) {
      state.currentWorkspace = null
    },
  },
  extraReducers: (builder) => {
    builder
      // CREATE WORKSPACE
      .addCase(createWorkspace.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(createWorkspace.fulfilled, (state, action) => {
        state.isLoading = false
        state.currentWorkspace = action.payload.workspace // ✅
        state.workspaces.push(action.payload.workspace)
      })
      .addCase(createWorkspace.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })

      // GENERATE INVITE LINK
      .addCase(generateInviteLink.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(generateInviteLink.fulfilled, (state, action) => {
        state.isLoading = false
        state.inviteLink = action.payload
      })
      .addCase(generateInviteLink.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
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
    },
})

export const {
  clearInviteLink,
  clearCurrentWorkspace,
} = workspaceSlice.actions

export default workspaceSlice.reducer