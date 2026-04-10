import axiosClient from "./axiosClient";

export const getTripSchedules = (params) => {
  return axiosClient.get("/customer/trip-schedule", { params });
};
