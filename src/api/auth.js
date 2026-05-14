import axiosClient from "./axiosClient";

// đăng ký CUSTOMER
export const customerSignUp = (data) => {
  return axiosClient.post("/customer/sign-up", data);
};

// đăng nhập (DÙNG CHUNG)
export const signIn = (data) => {
  return axiosClient.post("/auth/sign-in", data);
};

// đăng nhập bằng Google (backend trả đúng role/staffProfileRole của tài khoản)
export const verifyAuthGoogleToken = (data) => {
  return axiosClient.post("/auth/google/verify-token", data);
};

// đăng nhập bằng Facebook (backend trả đúng role/staffProfileRole của tài khoản)
export const verifyAuthFacebookToken = (data) => {
  return axiosClient.post("/auth/facebook/verify-token", data);
};

// Giữ alias cũ để không làm vỡ các import khác.
export const verifyCustomerGoogleToken = verifyAuthGoogleToken;
export const verifyCustomerFacebookToken = verifyAuthFacebookToken;

// đăng xuất
export const logout = () => {
  window.__isLoggingOut = true;
  return axiosClient
    .post("/auth/logout")
    .catch((error) => {
      if (error?.response?.status === 401) {
        return { data: { success: true, ignored: true } };
      }
      throw error;
    })
    .finally(() => {
      window.__isLoggingOut = false;
    });
};

// gửi OTP cho quên mật khẩu
export const sendOtp = (data) => {
  return axiosClient.post("/auth/send-otp", data);
};

// reset mật khẩu bằng OTP
export const resetPassword = (data) => {
  return axiosClient.put("/auth/reset-password", data);
};
