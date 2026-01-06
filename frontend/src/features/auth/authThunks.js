import { createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/lib/axios";

export const registerUser = createAsyncThunk(
  "auth/register",
  async (formData, { rejectWithValue }) => {
    try {
      const res = await api.post("/auth/signup", formData);
      return res.data; // goes to fulfilled
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Signup failed"
      );
    }
  }
);
