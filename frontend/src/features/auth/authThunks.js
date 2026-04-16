import { createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/lib/axios";
import { generateKEMKeyPair } from "@/crypto/crypto";
import { storeKeyPair, hasKeyPair, getPublicKey } from "@/crypto/keyStore";

/**
 * Ensures the user has a Kyber768 keypair in localStorage and the public
 * key is uploaded to the server.  Called after every successful auth.
 */
const ensureKeyPair = async () => {
  try {
    if (!hasKeyPair()) {
      console.log("🔑 Generating new Kyber768 keypair…");
      const { pk, sk } = await generateKEMKeyPair();
      storeKeyPair(pk, sk);
      // Upload the public key to the server
      await api.put("/auth/publickey", { publicKey: pk });
      console.log("🔑 Keypair generated & public key uploaded");
    } else {
      // Key exists locally — make sure the server has it too
      const pk = getPublicKey();
      if (pk) {
        await api.put("/auth/publickey", { publicKey: pk });
      }
    }
  } catch (err) {
    console.error("🔑 Key pair setup error (non-fatal):", err);
  }
};

// ── Register ─────────────────────────────────────────────────────────────
export const registerUser = createAsyncThunk(
  "auth/register",
  async (formData, { rejectWithValue }) => {
    try {
      const res = await api.post("/auth/register", formData);
      const token = res.data.accessToken;
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      // Generate Kyber keypair after registration
      await ensureKeyPair();
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Signup failed"
      );
    }
  }
);

// ── Login ────────────────────────────────────────────────────────────────
export const loginUser = createAsyncThunk(
  "auth/login",
  async (formData, { rejectWithValue }) => {
    try {
      const response = await api.post(
        "/auth/login",
        formData,
        { withCredentials: true }
      );

      const token = response.data.accessToken;
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      // Generate Kyber keypair after login
      await ensureKeyPair();

      return response.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Invalid email or password"
      );
    }
  }
);

// ── Check Auth (session restore) ─────────────────────────────────────────
export const checkAuth = createAsyncThunk(
  "auth/checkAuth",
  async (_, { rejectWithValue }) => {
    try {
      const refreshRes = await api.post("/auth/refresh");
      const accessToken = refreshRes.data.accessToken;

      api.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;

      const verifyRes = await api.get("/auth/verify");

      // Ensure Kyber keypair exists after session restore
      await ensureKeyPair();

      return {
        user: verifyRes.data.user,
        accessToken: accessToken,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Not authenticated" }
      );
    }
  }
);