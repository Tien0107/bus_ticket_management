import axiosClient from "./axiosClient";

export const companySupportRegister = (data) => {
    return axiosClient.post("/operator-support/sign-up", data);
};

export const getSupportTickets = (params) => {
    return axiosClient.get("/operator-support/ticket", { params });
};

export const getSupportTicketDetail = (id) => {
    return axiosClient.get(`/operator-support/ticket/${id}`);
};

export const cancelSupportTicket = (id) => {
    return axiosClient.delete(`/operator-support/ticket/${id}`);
};

export const getSupportCoupons = (params) => {
    return axiosClient.get("/operator-support/coupon", { params });
};

export const createSupportCoupon = (data) => {
    return axiosClient.post("/operator-support/coupon", data);
};

export const updateSupportCoupon = (id, data) => {
    return axiosClient.put(`/operator-support/coupon/${id}`, data);
};