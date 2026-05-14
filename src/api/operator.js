import axiosClient from "./axiosClient";

/* ========== Operator Dispatcher Endpoints ========== */

// ===== Routes =====
export const getRoutes = (params = {}) => {
  return axiosClient.get("/operator-dispatcher/route", { params });
};

export const createRoute = (data) => {
  return axiosClient.post("/operator-dispatcher/route", data);
};

export const updateRoute = (routeId, data) => {
  return axiosClient.put(`/operator-dispatcher/route/${routeId}`, data);
};

// ===== Stations =====
export const getStations = (params = {}) => {
  return axiosClient.get("/operator-dispatcher/station", { params });
};

export const createStation = (data) => {
  return axiosClient.post("/operator-dispatcher/station", data);
};

// ===== Trip Price Templates =====
export const getTripPrices = (params = {}) => {
  return axiosClient.get("/operator-dispatcher/trip-price-template", { params });
};

export const createTripPrice = (data) => {
  return axiosClient.post("/operator-dispatcher/trip-price-template", data);
};

export const updateTripPrice = (priceId, data) => {
  return axiosClient.put(`/operator-dispatcher/trip-price-template/${priceId}`, data);
};

export const deleteTripPrice = (priceId) => {
  return axiosClient.delete(`/operator-dispatcher/trip-price-template/${priceId}`);
};

// ===== Trip Schedules =====
export const getTripSchedules = (params = {}) => {
  return axiosClient.get("/operator-dispatcher/trip-schedule", { params });
};

export const createTripSchedule = (data) => {
  return axiosClient.post("/operator-dispatcher/trip-schedule", data);
};

export const updateTripSchedule = (scheduleId, data) => {
  return axiosClient.put(`/operator-dispatcher/trip-schedule/${scheduleId}`, data);
};

export const deleteTripSchedule = (scheduleId) => {
  return axiosClient.delete(`/operator-dispatcher/trip-schedule/${scheduleId}`);
};

// ===== Stopping Points =====
export const getStoppingPoints = (scheduleId) => {
  return axiosClient.get(`/operator-dispatcher/trip-schedule/${scheduleId}/stopping-point`);
};

export const createStoppingPoint = (scheduleId, data) => {
  return axiosClient.post(`/operator-dispatcher/trip-schedule/${scheduleId}/stopping-point`, data);
};

export const updateStoppingPoint = (scheduleId, stoppingPointId, data) => {
  return axiosClient.put(
    `/operator-dispatcher/trip-schedule/${scheduleId}/stopping-point/${stoppingPointId}`,
    data
  );
};

// ===== Trips (Individual trips under a schedule) =====
export const getTrips = (scheduleId, params = {}) => {
  return axiosClient.get(`/operator-dispatcher/trip-schedule/${scheduleId}/trip`, { params });
};

export const updateTrip = (scheduleId, tripId, data) => {
  return axiosClient.put(`/operator-dispatcher/trip-schedule/${scheduleId}/trip/${tripId}`, data);
};

// ===== Vehicles =====
export const getVehicles = (params = {}) => {
  return axiosClient.get("/operator-dispatcher/vehicle", { params });
};

// ===== Drivers (Dispatcher view) =====
export const getDrivers = (params = {}) => {
  return axiosClient.get("/operator-dispatcher/driver", { params });
};

// ===== Dispatcher Sign-up =====
export const operatorSignUp = (data) => {
  return axiosClient.post("/operator-dispatcher/sign-up", data);
};
