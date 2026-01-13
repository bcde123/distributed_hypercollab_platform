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
      
      // Set the token in Axios headers immediately after login
      const token = response.data.accessToken;
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

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
      // 1. Try to refresh the token first (uses the HttpOnly cookie)
      const refreshRes = await api.post("/auth/refresh");
      const accessToken = refreshRes.data.accessToken;

      // 2. Set the new token in Axios headers for future requests
      api.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
      // 3. Now verify authentication with the new token
      const verifyRes = await api.get("/auth/verify");
      return { 
        user: verifyRes.data.user, 
        accessToken: accessToken 
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Not authenticated" }
      );
    }
  }
);