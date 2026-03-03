import axios from "axios";

const axiosClient = axios.create({
  baseURL: "https://my-server.serveminecraft.net",
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json"
  }
});

// Gắn token tự động
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default axiosClient;
