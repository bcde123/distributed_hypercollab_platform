import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.PROD ? "/api" : "http://localhost:5001/api", // backend base URL
  withCredentials: true, // for cookies / refresh tokens
});

export default api;
