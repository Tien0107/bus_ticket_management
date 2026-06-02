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

const getNextCursor = (response) => {
  const next = response?.data?.next;
  return next === undefined || next === null || next === 0 || next === "" ? null : next;
};

const getFirstArray = (data, keys) => {
  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key];
    if (Array.isArray(data?.data?.[key])) return data.data[key];
  }

  return Array.isArray(data) ? data : [];
};

const getAllPages = async (request, keys, params = {}, outputKey = keys[0]) => {
  const items = [];
  let next = params.next || null;
  let pageCount = 0;

  do {
    const response = await request({
      limit: 10,
      ...params,
      ...(next ? { next } : {})
    });

    items.push(...getFirstArray(response.data, keys));
    next = getNextCursor(response);
    pageCount += 1;
  } while (next && pageCount < 50);

  return { data: { [outputKey]: items, next } };
};

export const getAllRoutes = (params = {}) => getAllPages(getRoutes, ["routes"], params);
export const getAllStations = (params = {}) => getAllPages(getStations, ["stations"], params);
export const getAllTripPrices = (params = {}) => getAllPages(getTripPrices, ["prices"], params);
export const getAllTripSchedules = (params = {}) => getAllPages(getTripSchedules, ["trip", "tripSchedules"], params, "trip");
export const getAllVehicles = (params = {}) => getAllPages(getVehicles, ["vehicles"], params);
export const getAllDrivers = (params = {}) => getAllPages(getDrivers, ["drivers"], params);
export const getAllTrips = (scheduleId, params = {}) => getAllPages((pageParams) => getTrips(scheduleId, pageParams), ["trips", "trip"], params, "trips");

const normalizePhone = (value) => String(value || "").replace(/\D/g, "");

const getDriverDedupeKey = (driver = {}) => {
  const phone = normalizePhone(driver.phone || driver.phoneNumber);
  if (phone) return `phone:${phone}`;

  const email = String(driver.email || "").trim().toLowerCase();
  if (email) return `email:${email}`;

  return `id:${driver.id}`;
};

const getDriverScore = (driver = {}) =>
  Number(driver.completedTripCount || 0) + Number(driver.cancelledTripCount || 0);

export const dedupeDriversByContact = (drivers = []) => {
  const uniqueMap = new Map();

  drivers.forEach((driver) => {
    const key = getDriverDedupeKey(driver);
    const current = uniqueMap.get(key);

    if (!current || getDriverScore(driver) > getDriverScore(current)) {
      uniqueMap.set(key, driver);
    }
  });

  return Array.from(uniqueMap.values());
};
