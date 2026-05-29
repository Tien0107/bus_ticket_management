import axiosClient from "./axiosClient";


export const createPaymentMethod = (data) => {
  return axiosClient.post("/payment/method", data);
};