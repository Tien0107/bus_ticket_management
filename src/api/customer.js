import axiosClient from "./axiosClient";


export const getTripSchedules = (params) => {
  return axiosClient.get("/customer/trip-schedule", { params });
};


export const getPickupPoints = (tripScheduleId) => {
  return axiosClient.get(`/customer/trip-schedule/${tripScheduleId}/pickup`);
};

export const getDropoffPoints = (tripScheduleId, fromStationId, stopOrder) => {
  return axiosClient.get(`/customer/trip-schedule/${tripScheduleId}/dropoff`, {
    params: { fromStationId, stopOrder }
  });
};


export const getTripSeats = (tripId, stopOrderPickup, stopOrderDropoff) => {
  return axiosClient.get(`/customer/trip/${tripId}/seat`, {
    params: { stopOrderPickup, stopOrderDropoff }
  });
};


export const prepareTrip = (data) => {
  return axiosClient.post("/customer/trip-schedule/prepare", data);
};


export const checkCoupon = (params) => {
  return axiosClient.get("/customer/coupon/check", { params });
};


export const createBooking = (data) => {
  return axiosClient.post("/customer/booking", data);
};


export const getCustomerProfile = () => {
  return axiosClient.get("/customer/profile");
};

export const verifyContactIdentity = (data) => {
  return axiosClient.post("/customer/profile/contact/identity/verify", data);
};

export const updateCustomerContact = (data) => {
  return axiosClient.put("/customer/profile/contact", data);
};

export const getMyTickets = (params) => {
  return axiosClient.get("/customer/ticket", { params });
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


export const createPaymentMethod = (orderId, method = "vnpay") => {
  return axiosClient.post(`/payment/method?id=${orderId}&method=${method}`);
};

export const createSetupIntent = () => {
  return axiosClient.post("/customer/payment-method/setup-intent");
};

export const addPaymentMethod = (paymentMethodId) => {
  return axiosClient.post("/customer/payment-method", { paymentMethodId });
};

export const getPaymentMethods = () => {
  return axiosClient.get("/customer/payment-method");
};

export const deletePaymentMethod = (paymentMethodId) => {
  return axiosClient.delete("/customer/payment-method", {
    data: { paymentMethodId }
  });
};

export const setDefaultPaymentMethod = (paymentMethodId) => {
  return axiosClient.put("/customer/payment-method/default", { paymentMethodId });
};

export const rateTicket = (data) => {
  return axiosClient.post("/customer/ticket/rating", data);
};

export const getTripScheduleRatings = (params) => {
  return axiosClient.get("/customer/trip-schedule/rating", { params });
};