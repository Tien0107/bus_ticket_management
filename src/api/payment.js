import axiosClient from "./axiosClient";

// Gửi yêu cầu khởi tạo thanh toán VNPay
export const createPaymentMethod = (data) => {
  return axiosClient.post("/payment/method", data);
};
