import axiosClient from "./axiosClient";


export const customerSignUp = (data) => {
    return axiosClient.post("/customer/sign-up", data);
};


export const signIn = (data) => {
    return axiosClient.post("/auth/sign-in", data);
};


export const verifyAuthGoogleToken = (data) => {
    return axiosClient.post("/auth/google/verify-token", data);
};


export const verifyAuthFacebookToken = (data) => {
    return axiosClient.post("/auth/facebook/verify-token", data);
};


export const verifyCustomerGoogleToken = verifyAuthGoogleToken;
export const verifyCustomerFacebookToken = verifyAuthFacebookToken;


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


export const getUsers = (params = {}) => {
    return axiosClient.get("/auth/user", { params });
};


export const sendOtp = (data) => {
    return axiosClient.post("/auth/send-otp", data);
};


export const resetPassword = (data) => {
    return axiosClient.put("/auth/reset-password", data);
};


export const updatePassword = (data) => {
    return axiosClient.put("/auth/password", data);
};


export const sendEmail = (data) => {
    return axiosClient.post("/auth/email/send", data);
};


export const contactCheck = (data) => {
  return axiosClient.post("/auth/contact/check", data);
};

export const contactVerify = (data) => {
  return axiosClient.post("/auth/contact/verify", data);
};