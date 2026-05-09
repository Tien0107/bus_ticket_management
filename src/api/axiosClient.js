import axios from "axios";

const axiosClient = axios.create({
  baseURL: "https://my-server.serveminecraft.net",
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json"
  }
});

// Request interceptor - Gắn token tự động
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    console.warn("⚠️ Không tìm thấy token trong localStorage");
  }

  console.log("📤 Request:", {
    method: config.method,
    url: config.url,
    hasToken: !!token
  });

  return config;
});

// Response interceptor - Xử lý lỗi
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const data = error.response?.data;

    // lưu lỗi cuối để debug
    window.lastError = {
      status,
      url: error.response?.config?.url,
      data
    };

    console.error("❌ API Error:", {
      status,
      url: error.response?.config?.url,
      message: error.message,
      errorData: data
    });

    if (data?.message) {
      console.error("📝 Server message:", data.message);
    }

    if (data?.error) {
      console.error("📝 Server error:", data.error);
    }

    if (data?.details) {
      console.error("📝 Server details:", data.details);
    }

    // Unauthorized
    if (status === 401) {
      // Chỉ show alert nếu user đã từng đăng nhập (tức là có token/user trước đó)
      const wasLoggedIn = !!localStorage.getItem("user");
      
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      if (wasLoggedIn && window.location.pathname !== "/login") {
        alert("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default axiosClient;