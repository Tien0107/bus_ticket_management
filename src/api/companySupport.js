import axiosClient from "./axiosClient";

export const companySupportRegister = (data) => {
  return axiosClient.post("/company-admin-support/sign-up", data);
};

export const getSupportTickets = (params) => {
  return axiosClient.get("/company-admin-support/ticket", { params });
};

export const getSupportTicketDetail = (id) => {
  return axiosClient.get(`/company-admin-support/ticket/${id}`);
};

export const cancelSupportTicket = (id) => {
  return axiosClient.delete(`/company-admin-support/ticket/${id}`);
};

export const getSupportCoupons = (params) => {
  return axiosClient.get("/company-admin-support/coupon", { params });
};

export const createSupportCoupon = (data) => {
  return axiosClient.post("/company-admin-support/coupon", data);
};

export const updateSupportCoupon = (id, data) => {
  return axiosClient.put(`/company-admin-support/coupon/${id}`, data);
};
