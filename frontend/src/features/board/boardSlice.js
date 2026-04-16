import { createSlice } from '@reduxjs/toolkit';
import {
  createBoard,
  getBoardsByWorkspace,
  getBoardById,
  getFullBoard,
  deleteBoard,
  updateBoard,
  createList,
  updateList,
  deleteList,
  createTask,
  updateTask,
  deleteTask,
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
  reducers: {
    // ── WebSocket-driven real-time reducers ─────────────────────────────
    ws_taskCreated(state, action) {
      const { task, boardId, listId } = action.payload;
      if (!state.fullBoard) return;
      if (state.fullBoard.board._id !== boardId) return;

      if (!state.fullBoard.tasksByList[listId]) {
        state.fullBoard.tasksByList[listId] = [];
      }
      // Dedup: don't re-add if already present (e.g. the user who created it)
      const exists = state.fullBoard.tasksByList[listId].some(t => t._id === task._id);
      if (!exists) {
        state.fullBoard.tasksByList[listId].push(task);
      }
    },

    ws_taskUpdated(state, action) {
      const { task, boardId, oldListId } = action.payload;
      if (!state.fullBoard) return;
      if (state.fullBoard.board._id !== boardId) return;

      const newListId = task.listId;

      // Remove from old list (search all lists if oldListId not provided)
      const listsToSearch = oldListId
        ? [oldListId]
        : Object.keys(state.fullBoard.tasksByList);

      for (const lId of listsToSearch) {
        const arr = state.fullBoard.tasksByList[lId];
        if (!arr) continue;
        const idx = arr.findIndex(t => t._id === task._id);
        if (idx !== -1) {
          arr.splice(idx, 1);
          break;
        }
      }

      // Add to new list
      if (!state.fullBoard.tasksByList[newListId]) {
        state.fullBoard.tasksByList[newListId] = [];
      }
      // Dedup
      const alreadyThere = state.fullBoard.tasksByList[newListId].some(t => t._id === task._id);
      if (!alreadyThere) {
        state.fullBoard.tasksByList[newListId].push(task);
      }
    },

    ws_taskDeleted(state, action) {
      const { taskId, boardId, listId } = action.payload;
      if (!state.fullBoard) return;
      if (state.fullBoard.board._id !== boardId) return;

      if (state.fullBoard.tasksByList[listId]) {
        state.fullBoard.tasksByList[listId] = state.fullBoard.tasksByList[listId].filter(
          t => t._id !== taskId
        );
      }
    },

    ws_boardCreated(state, action) {
      const board = action.payload;
      const exists = state.boards.some(b => b._id === board._id);
      if (!exists) {
        state.boards.push(board);
      }
    },
  },
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
      })

      /* ================= KANBAN UPDATES ================= */
      // Update Board
      .addCase(updateBoard.fulfilled, (state, action) => {
        if (state.fullBoard && state.fullBoard.board._id === action.payload.board._id) {
          state.fullBoard.board = action.payload.board;
        }
      })
      // Create List
      .addCase(createList.fulfilled, (state, action) => {
        if (state.fullBoard) {
          state.fullBoard.board.lists.push(action.payload.list);
          state.fullBoard.tasksByList[action.payload.list._id] = [];
        }
      })
      // Update List
      .addCase(updateList.fulfilled, (state, action) => {
        if (state.fullBoard) {
          const idx = state.fullBoard.board.lists.findIndex(l => l._id === action.payload.list._id);
          if (idx !== -1) state.fullBoard.board.lists[idx] = action.payload.list;
        }
      })
      // Delete List
      .addCase(deleteList.fulfilled, (state, action) => {
        if (state.fullBoard) {
          state.fullBoard.board.lists = state.fullBoard.board.lists.filter(l => l._id !== action.payload.listId);
          delete state.fullBoard.tasksByList[action.payload.listId];
        }
      })
      // Create Task
      .addCase(createTask.fulfilled, (state, action) => {
        if (state.fullBoard) {
          const listId = action.payload.task.listId;
          if (!state.fullBoard.tasksByList[listId]) state.fullBoard.tasksByList[listId] = [];
          state.fullBoard.tasksByList[listId].push(action.payload.task);
        }
      })
      // Update Task (handles standard updates and moving between lists)
      .addCase(updateTask.fulfilled, (state, action) => {
        if (state.fullBoard) {
          const updatedTask = action.payload.task;
          
          // Since a task might have moved from one list to another, we need to find it and remove it
          // from the old list, then add it to the new list (or just update if it hasn't moved).
          let oldListId = null;
          let oldTaskIndex = -1;
          
          Object.keys(state.fullBoard.tasksByList).forEach(lId => {
            const idx = state.fullBoard.tasksByList[lId].findIndex(t => t._id === updatedTask._id);
            if (idx !== -1) {
              oldListId = lId;
              oldTaskIndex = idx;
            }
          });

          if (oldListId && oldListId !== updatedTask.listId) {
            // Task moved to a different list
            state.fullBoard.tasksByList[oldListId].splice(oldTaskIndex, 1);
            if (!state.fullBoard.tasksByList[updatedTask.listId]) {
              state.fullBoard.tasksByList[updatedTask.listId] = [];
            }
            state.fullBoard.tasksByList[updatedTask.listId].push(updatedTask);
          } else if (oldListId) {
            // Task updated in the same list
            state.fullBoard.tasksByList[oldListId][oldTaskIndex] = updatedTask;
          }
        }
      })
      // Delete Task
      .addCase(deleteTask.fulfilled, (state, action) => {
        if (state.fullBoard) {
          const { listId, taskId } = action.payload;
          if (state.fullBoard.tasksByList[listId]) {
            state.fullBoard.tasksByList[listId] = state.fullBoard.tasksByList[listId].filter(t => t._id !== taskId);
          }
        }
      });
  },
});

export const {
  ws_taskCreated,
  ws_taskUpdated,
  ws_taskDeleted,
  ws_boardCreated,
} = boardSlice.actions;

export default boardSlice.reducer;
