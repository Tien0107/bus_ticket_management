import axiosClient from "./axiosClient";


export const driverSignUp = (data) => {
  return axiosClient.post("/driver/sign-up", data);
};




export const getDriverTrips = (params = {}) => {
  return axiosClient.get("/driver/trip", {
    params: { orderBy: "asc", ...params }
  });
};

export const getDriverStats = () => {
  return axiosClient.get("/driver/me/stat");
};

const getNextCursor = (response) => {
  const next = response?.data?.next;
  return next === undefined || next === null || next === 0 || next === "" ? null : next;
};

export const getAllDriverTrips = async (params = {}) => {
  const trips = [];
  let next = params.next || null;
  let pageCount = 0;

  do {
    const response = await getDriverTrips({
      limit: 10,
      ...params,
      ...(next ? { next } : {})
    });

    const pageTrips = Array.isArray(response.data?.trips)
      ? response.data.trips
      : Array.isArray(response.data)
      ? response.data
      : [];

    trips.push(...pageTrips);
    next = getNextCursor(response);
    pageCount += 1;
  } while (next && pageCount < 50);

  return { data: { trips, next } };
};


export const getDriverTripsAllStatuses = async (date = null) => {
  try {
    const statuses = ["scheduled", "running", "completed", "cancelled"];
    const allTripsArray = [];
    const tripIds = new Set();

    const promises = statuses.map((status) => {
      const params = { status };
      if (date) params.date = date;
      return getAllDriverTrips(params)
        .then((response) => response?.data?.trips || [])
        .catch(() => []);
    });

    const results = await Promise.all(promises);

    results.forEach((trips) => {
      trips.forEach((trip) => {
        if (!tripIds.has(trip.id)) {
          tripIds.add(trip.id);
          allTripsArray.push(trip);
        }
      });
    });

    return { data: { trips: allTripsArray } };
  } catch (err) {
    const params = date ? { date } : {};
    return getDriverTrips(params);
  }
};


export const updateTrip = (tripId, data) => {
  return axiosClient.patch(`/driver/trip/${tripId}`, data);
};




const TRIP_PASSENGER_PAGE_LIMIT = 10;

export const getTripPassengers = (tripId, params = {}) => {
  const { limit: _limit, ...restParams } = params;
  return axiosClient.get(`/driver/trip/${tripId}/passenger`, {
    params: { ...restParams, limit: TRIP_PASSENGER_PAGE_LIMIT }
  });
};

export const getAllTripPassengers = async (tripId, params = {}) => {
  const passengers = [];
  let next = params.next || null;
  let pageCount = 0;

  do {
    const response = await getTripPassengers(tripId, {
      ...params,
      ...(next ? { next } : {})
    });

    const pagePassengers = Array.isArray(response.data?.passengers)
      ? response.data.passengers
      : Array.isArray(response.data)
      ? response.data
      : [];

    passengers.push(...pagePassengers);
    next = getNextCursor(response);
    pageCount += 1;
  } while (next && pageCount < 50);

  return { data: { passengers, next } };
};


export const checkInPassenger = (tripId, passengerId, ticketStatus = "checked_in") => {
  const endpoint = `/driver/trip/${tripId}/passenger/${passengerId}/check-in`;
  return axiosClient.put(endpoint, { ticketStatus });
};




export const getTripRoute = (tripId) => {
  return axiosClient.get(`/driver/trip/${tripId}/route`);
};
