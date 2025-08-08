import axios from "axios";

// Create an axios instance
const api = axios.create({
  baseURL: "http://127.0.0.1:8000", // ✅ Local FastAPI backend URL
});

// ✅ Automatically attach token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token"); // Assumes token is saved after login
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
