import axiosClient from "./axiosClient";

// đăng ký CUSTOMER
export const customerSignUp = (data) => {
  return axiosClient.post("/customer/sign-up", data);
};

// đăng nhập (DÙNG CHUNG)
export const signIn = (data) => {
  return axiosClient.post("/auth/sign-in", data);
};
