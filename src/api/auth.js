import axiosClient from "./axiosClient";

// đăng ký CUSTOMER
export const customerSignUp = (data) => {
  return axiosClient.post("/customer/sign-up", data);
};

// đăng nhập (DÙNG CHUNG)
export const signIn = (data) => {
  return axiosClient.post("/auth/sign-in", data);
};

// đăng xuất
export const logout = () => {
  return axiosClient.post("/auth/logout");
};

// gửi OTP cho quên mật khẩu
export const sendOtp = (data) => {
  return axiosClient.post("/auth/send-otp", data);
};

// reset mật khẩu bằng OTP
export const resetPassword = (data) => {
  return axiosClient.put("/auth/reset-password", data);
};