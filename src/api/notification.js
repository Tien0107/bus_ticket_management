import axiosClient from "./axiosClient";

export const getNotifications = (params) => {
  return axiosClient.get("/auth/notification", { params });
};

export const createNotification = (data) => {
  return axiosClient.post("/auth/notification", data);
};

export const markNotificationRead = (id) => {
  return axiosClient.put(`/auth/notification/${id}/read`);
};
