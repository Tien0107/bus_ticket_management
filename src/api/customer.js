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

// Màn hình cá nhân (My Tickets/Coupons/Profile)
export const getCustomerProfile = () => {
  return axiosClient.get("/customer/profile");
};

export const verifyContactIdentity = (data) => {
  return axiosClient.post("/customer/profile/contact/identity/verify", data);
};

export const updateCustomerContact = (data) => {
  return axiosClient.put("/customer/profile/contact", data);
};

export const getMyTickets = () => {
  return axiosClient.get("/customer/ticket");
};

export const getTicketDetail = (ticketId) => {
  return axiosClient.get(`/customer/ticket/${ticketId}`);
};

export const cancelTicket = (ticketId) => {
  return axiosClient.delete(`/customer/ticket/${ticketId}`);
};

export const getMyCoupons = (params) => {
  return axiosClient.get("/customer/coupon", { params });
};

// Payment Flow
export const createPaymentMethod = (orderId, method = "vnpay") => {
  return axiosClient.post(`/payment/method?id=${orderId}&method=${method}`);
};

export const createSetupIntent = () => {
  return axiosClient.post("/customer/payment-methods/setup-intent");
};

export const addPaymentMethod = (paymentMethodId) => {
  return axiosClient.post("/customer/payment-methods", { paymentMethodId });
};

export const getPaymentMethods = () => {
  return axiosClient.get("/customer/payment-methods");
};

export const deletePaymentMethod = (paymentMethodId) => {
  return axiosClient.delete("/customer/payment-methods", {
    data: { paymentMethodId }
  });
};

export const setDefaultPaymentMethod = (paymentMethodId) => {
  return axiosClient.put("/customer/payment-methods/default", { paymentMethodId });
};