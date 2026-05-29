import axiosClient from "./axiosClient";



export const getOperatorProfile = () => {
  return axiosClient.get("/operator/profile");
};

export const updateOperatorProfile = (data) => {
  return axiosClient.put("/operator/profile", data);
};




export const getRoutes = (params = {}) => {
  return axiosClient.get("/operator-dispatcher/route", { params });
};

export const createRoute = (data) => {
  return axiosClient.post("/operator-dispatcher/route", data);
};

export const updateRoute = (routeId, data) => {
  return axiosClient.put(`/operator-dispatcher/route/${routeId}`, data);
};


export const getStations = (params = {}) => {
  return axiosClient.get("/operator-dispatcher/station", { params });
};

export const createStation = (data) => {
  return axiosClient.post("/operator-dispatcher/station", data);
};


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


export const getStoppingPoints = (scheduleId, params = {}) => {
  return axiosClient.get(`/operator-dispatcher/trip-schedule/${scheduleId}/stopping-point`, { params });
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


export const getTrips = (scheduleId, params = {}) => {
  return axiosClient.get(`/operator-dispatcher/trip-schedule/${scheduleId}/trip`, { params });
};

export const updateTrip = (scheduleId, tripId, data) => {
  return axiosClient.put(`/operator-dispatcher/trip-schedule/${scheduleId}/trip/${tripId}`, data);
};


export const getVehicles = (params = {}) => {
  return axiosClient.get("/operator-dispatcher/vehicle", { params });
};


export const getDrivers = (params = {}) => {
  return axiosClient.get("/operator-dispatcher/driver", { params });
};


export const operatorSignUp = (data) => {
  return axiosClient.post("/operator-dispatcher/sign-up", data);
};