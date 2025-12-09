import axios from "axios";

const api = axios.create({
  baseURL: "https://localhost:7019",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token"); // ⬅ CHANGE
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
