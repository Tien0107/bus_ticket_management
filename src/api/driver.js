import axiosClient from "./axiosClient";

// ===== Đăng ký tài xế =====
export const driverSignUp = (data) => {
  return axiosClient.post("/driver/sign-up", data);
};

// ===== Quản lý chuyến =====

// Lấy danh sách chuyến của tài xế
export const getDriverTrips = () => {
  return axiosClient.get("/driver/trip", {
    params: { orderBy: "asc" }
  });
};

// Cập nhật thông tin chuyến
export const updateTrip = (tripId, data) => {
  return axiosClient.patch(`/driver/trip/${tripId}`, data);
};

// Lấy thông tin chi tiết chuyến
export const getTripDetail = (tripId) => {
  return axiosClient.get(`/driver/trip/${tripId}`);
};

// ===== Quản lý hành khách =====

// Lấy danh sách hành khách của chuyến
export const getTripPassengers = (tripId, params) => {
  return axiosClient.get(`/driver/trip/${tripId}/passenger`, { params });
};

// Check-in hành khách
export const checkInPassenger = (tripId, passengerId) => {
  return axiosClient.put(`/driver/trip/${tripId}/passenger/${passengerId}/check-in`);
};

// ===== Quản lý tuyến đường =====

// Lấy route của chuyến
export const getTripRoute = (tripId) => {
  return axiosClient.get(`/driver/trip/${tripId}/route`);
};
