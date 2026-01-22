import { createSlice } from '@reduxjs/toolkit';
import {
  createBoard,
  getBoardsByWorkspace,
  getBoardById,
  getFullBoard,
  deleteBoard,
} from './boardThunks';

const boardSlice = createSlice({
  name: 'board',
  initialState: {
    boards: [],
    currentBoard: null,
    fullBoard: null,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      /* ================= CREATE BOARD ================= */
      .addCase(createBoard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createBoard.fulfilled, (state, action) => {
        state.loading = false;
        state.boards.push(action.payload.board); // ✅ FIXED
      })
      .addCase(createBoard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /* ================= GET BOARDS ================= */
      .addCase(getBoardsByWorkspace.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getBoardsByWorkspace.fulfilled, (state, action) => {
        state.loading = false;
        state.boards = action.payload; // ✅ FIXED
      })
      .addCase(getBoardsByWorkspace.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /* ================= GET BOARD ================= */
      .addCase(getBoardById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getBoardById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentBoard = action.payload;
      })
      .addCase(getBoardById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /* ================= GET FULL BOARD ================= */
      .addCase(getFullBoard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getFullBoard.fulfilled, (state, action) => {
        state.loading = false;
        state.fullBoard = action.payload;
      })
      .addCase(getFullBoard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /* ================= DELETE BOARD ================= */
      .addCase(deleteBoard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteBoard.fulfilled, (state, action) => {
        state.loading = false;
        state.boards = state.boards.filter(
          (b) => b._id !== action.meta.arg.boardId
        );
      })
      .addCase(deleteBoard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default boardSlice.reducer;
