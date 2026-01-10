import { createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/lib/axios";

export const registerUser = createAsyncThunk(
  "auth/register",
  async (formData, { rejectWithValue }) => {
    try {
      const res = await api.post("/auth/register", formData);
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Signup failed"
      );
    }
  }
);

export const loginUser = createAsyncThunk(
  "auth/login",
  async (formData, { rejectWithValue }) => {
    try {
      const response = await api.post(
        "/auth/login",
        formData,
        { withCredentials: true }
      );
      
      return response.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Invalid email or password"
      );
    }
  }
);


export const checkAuth = createAsyncThunk(
  "auth/checkAuth",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/auth/verify");
      return res.data; 
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Not authenticated" }
      );
    }
  }
);