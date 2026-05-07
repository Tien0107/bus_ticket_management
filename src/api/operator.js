import axiosClient from "./axiosClient";

/* ========== Company Admin Operator Endpoints ========== */

// ===== Routes =====
export const getRoutes = (params = {}) => {
  return axiosClient.get("/company-admin-operator/route", { params });
};

export const createRoute = (data) => {
  return axiosClient.post("/company-admin-operator/route", data);
};

export const updateRoute = (routeId, data) => {
  return axiosClient.put(`/company-admin-operator/route/${routeId}`, data);
};

// ===== Stations =====
export const getStations = (params = {}) => {
  return axiosClient.get("/company-admin-operator/station", { params });
};

export const createStation = (data) => {
  return axiosClient.post("/company-admin-operator/station", data);
};

// ===== Trip Price Templates =====
export const getTripPrices = (params = {}) => {
  return axiosClient.get("/company-admin-operator/trip-price-template", { params });
};

export const createTripPrice = (data) => {
  return axiosClient.post("/company-admin-operator/trip-price-template", data);
};

export const updateTripPrice = (priceId, data) => {
  return axiosClient.put(`/company-admin-operator/trip-price-template/${priceId}`, data);
};

export const deleteTripPrice = (priceId) => {
  return axiosClient.delete(`/company-admin-operator/trip-price-template/${priceId}`);
};

// ===== Trip Schedules =====
export const getTripSchedules = (params = {}) => {
  return axiosClient.get("/company-admin-operator/trip-schedule", { params });
};

export const createTripSchedule = (data) => {
  return axiosClient.post("/company-admin-operator/trip-schedule", data);
};

export const updateTripSchedule = (scheduleId, data) => {
  return axiosClient.put(`/company-admin-operator/trip-schedule/${scheduleId}`, data);
};

export const deleteTripSchedule = (scheduleId) => {
  return axiosClient.delete(`/company-admin-operator/trip-schedule/${scheduleId}`);
};

// ===== Stopping Points =====
export const getStoppingPoints = (scheduleId) => {
  return axiosClient.get(`/company-admin-operator/trip-schedule/${scheduleId}/stopping-point`);
};

export const createStoppingPoint = (scheduleId, data) => {
  return axiosClient.post(`/company-admin-operator/trip-schedule/${scheduleId}/stopping-point`, data);
};

export const updateStoppingPoint = (scheduleId, stoppingPointId, data) => {
  return axiosClient.put(
    `/company-admin-operator/trip-schedule/${scheduleId}/stopping-point/${stoppingPointId}`,
    data
  );
};

// ===== Trips (Individual trips under a schedule) =====
export const getTrips = (scheduleId, params = {}) => {
  return axiosClient.get(`/company-admin-operator/trip-schedule/${scheduleId}/trip`, { params });
};

export const updateTrip = (scheduleId, tripId, data) => {
  return axiosClient.put(`/company-admin-operator/trip-schedule/${scheduleId}/trip/${tripId}`, data);
};

// ===== Operator Sign-up =====
export const operatorSignUp = (data) => {
  return axiosClient.post("/company-admin/sign-up", data);
};
