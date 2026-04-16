import axiosClient from "./axiosClient";

// Lấy danh sách lịch trình
export const getTripSchedules = (params) => {
  return axiosClient.get("/customer/trip-schedule", { params });
};

// Bước 1: Điểm Đón & Trả
export const getPickupPoints = (tripScheduleId) => {
  return axiosClient.get(`/customer/trip-schedule/${tripScheduleId}/pickup`);
};

export const getDropoffPoints = (tripScheduleId, fromStationId, stopOrder) => {
  return axiosClient.get(`/customer/trip-schedule/${tripScheduleId}/dropoff`, {
    params: { fromStationId, stopOrder }
  });
};

// Bước 2: Lấy thông tin sơ đồ Ghế theo tripId chạy thật
export const getTripSeats = (tripId, stopOrderPickup, stopOrderDropoff) => {
  return axiosClient.get(`/customer/trip/${tripId}/seat`, {
    params: { stopOrderPickup, stopOrderDropoff }
  });
};

// Prepare (Giữ chỗ tạm)
export const prepareTrip = (data) => {
  return axiosClient.post("/customer/trip-schedule/prepare", data);
};

// Bước 3: Voucher
export const checkCoupon = (params) => {
  return axiosClient.get("/customer/coupon/check", { params });
};

// Bước 4: Chốt Đặt vé
export const createBooking = (data) => {
  return axiosClient.post("/customer/booking", data);
};

// Màn hình cá nhân (My Tickets/Coupons)
export const getMyTickets = () => {
  return axiosClient.get("/customer/ticket");
};

export const getTicketDetail = (ticketId) => {
  return axiosClient.get(`/customer/ticket/${ticketId}`);
};

export const cancelTicket = (ticketId) => {
  return axiosClient.delete(`/customer/ticket/${ticketId}`);
};

export const getMyCoupons = () => {
  return axiosClient.get("/customer/coupon");
};

// Payment Flow
export const createPaymentMethod = (orderId, method = "vnpay") => {
  return axiosClient.post(`/payment/method?id=${orderId}&method=${method}`);
};
