import { configureStore } from "@reduxjs/toolkit";
import authReducer from "@/features/auth/authSlice";
import workspaceReducer from "@/features/workspace/workspaceSlice";
import boardReducer from "@/features/board/boardSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    workspace: workspaceReducer,
    board: boardReducer,
  },
});
