import axios from "axios";
import toast from "react-hot-toast";
import { clearAuthSession, getStoredToken } from "../utils/authStorage";

const axiosClient = axios.create({
  baseURL: "https://busgo.servecounterstrike.com",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

const publicEndpoints = [
  "/auth/send-otp",
  "/auth/reset-password",
  "/auth/sign-in",
  "/auth/google/verify-token",
  "/auth/facebook/verify-token",
  "/auth/contact/check",
  "/auth/contact/verify",
  "/customer/sign-in",
  "/customer/sign-up",
  "/customer/google/verify-token",
  "/customer/facebook/verify-token",
  "/driver/login",
  "/driver/sign-up",
];

const isSessionExpiredError = (status, data) => {
  const message = [data?.message, data?.error, data?.detail]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return (
    status === 401 ||
    message.includes("phiên đăng nhập đã hết hạn") ||
    message.includes("vui lòng đăng nhập lại") ||
    message.includes("token expired") ||
    message.includes("jwt expired") ||
    message.includes("invalid token")
  );
};

const redirectToLogin = () => {
  clearAuthSession();

  if (window.__isLoggingOut === true || window.__sessionExpiredRedirecting === true) return;
  if (window.location.pathname === "/login") return;

  window.__sessionExpiredRedirecting = true;

  // Disconnect active sockets before forcing re-login (token is no longer valid)
  if (window.__chatSocket) {
    try { window.__chatSocket.disconnect(); } catch {}
    window.__chatSocket = null;
  }

  toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.", { duration: 5500 });
  window.location.replace("/login");
};

axiosClient.interceptors.request.use((config) => {
  const token = getStoredToken();
  const isPublicEndpoint = publicEndpoints.some((endpoint) => config.url?.startsWith(endpoint));

  if (token && !isPublicEndpoint) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const data = error.response?.data;
    const requestUrl = error.response?.config?.url || "";
    const isLogoutRequest = requestUrl.includes("/auth/logout");
    const isLoggingOut = window.__isLoggingOut === true;
    const isPublicEndpoint = publicEndpoints.some((endpoint) => requestUrl?.startsWith(endpoint));

    window.lastError = {
      status,
      url: error.response?.config?.url,
      data,
    };

    if (!isLogoutRequest && !isLoggingOut && !isPublicEndpoint && isSessionExpiredError(status, data)) {
      redirectToLogin();
    }

    const translateError = (msg) => {
      if (!msg) return msg;
      const lowerMsg = msg.toLowerCase();
      if (lowerMsg.includes("network error")) return "Lỗi kết nối mạng, vui lòng thử lại sau.";
      if (lowerMsg.includes("timeout")) return "Kết nối quá hạn, vui lòng kiểm tra mạng.";
      if (lowerMsg.includes("unauthorized") || lowerMsg.includes("invalid token"))
        return "Phiên đăng nhập không hợp lệ hoặc đã hết hạn.";
      if (lowerMsg.includes("forbidden") || lowerMsg.includes("not allowed"))
        return "Bạn không có quyền thực hiện thao tác này.";
      if (lowerMsg.includes("not found")) return "Không tìm thấy dữ liệu yêu cầu.";
      if (lowerMsg.includes("internal server error"))
        return "Lỗi hệ thống máy chủ. Vui lòng thử lại sau.";
      if (lowerMsg.includes("bad request") || lowerMsg.includes("invalid input"))
        return "Dữ liệu đầu vào không hợp lệ.";
      if (lowerMsg.includes("already exists")) return "Dữ liệu đã tồn tại trong hệ thống.";
      if (lowerMsg.includes("invalid credentials") || lowerMsg.includes("wrong password"))
        return "Sai tên đăng nhập hoặc mật khẩu.";
      if (lowerMsg.includes("user not found") || lowerMsg.includes("not exist"))
        return "Tài khoản không tồn tại.";
      if (lowerMsg.includes("email already in use") || lowerMsg.includes("email exists"))
        return "Email này đã được sử dụng.";
      if (lowerMsg.includes("validation failed")) return "Dữ liệu không đúng định dạng.";
      if (
        lowerMsg.includes("not enough seats") ||
        lowerMsg.includes("seat unavailable") ||
        lowerMsg.includes("already booked") ||
        lowerMsg.includes("ghế đã được người khác đặt") ||
        lowerMsg.includes("ghế đã được đặt") ||
        lowerMsg.includes("ghế này đã có người đặt") ||
        lowerMsg.includes("ghế đã có người đặt") ||
        lowerMsg.includes("đã được người khác đặt")
      )
        return "Ghế này đã có người đặt, vui lòng chọn ghế khác.";
      if (
        lowerMsg.includes("invalid coupon") ||
        lowerMsg.includes("coupon expired") ||
        lowerMsg.includes("not valid")
      )
        return "Mã khuyến mãi không hợp lệ hoặc đã hết hạn.";
      return msg;
    };

    if (error.response && error.response.data) {
      const d = error.response.data;

      // Normalize issues[] style validation errors (e.g. from Zod) into a usable message
      if (!d.message && Array.isArray(d.issues) && d.issues.length > 0) {
        const joined = d.issues.map((i) => i?.reason || i?.message).filter(Boolean).join(". ");
        if (joined) d.message = joined;
      }

      if (d.message) {
        d.message = translateError(d.message);
      }
      if (d.error) {
        d.error = translateError(d.error);
      }
    }
    if (error.message) {
      error.message = translateError(error.message);
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
