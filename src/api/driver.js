import axiosClient from "./axiosClient";


export const driverSignUp = (data) => {
  return axiosClient.post("/driver/sign-up", data);
};




export const getDriverTrips = (params = {}) => {
  return axiosClient.get("/driver/trip", {
    params: { orderBy: "asc", ...params }
  });
};


export const getDriverTripsAllStatuses = async (date = null) => {
  try {
    const statuses = ["scheduled", "running", "completed", "cancelled"];
    const allTripsArray = [];
    const tripIds = new Set();

    const promises = statuses.map((status) => {
      const params = { status };
      if (date) params.date = date;
      return getDriverTrips(params)
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




export const getTripPassengers = (tripId, params) => {
  return axiosClient.get(`/driver/trip/${tripId}/passenger`, { params });
};


export const checkInPassenger = (tripId, passengerId, status = "checked_in") => {
  return axiosClient.put(`/driver/trip/${tripId}/passenger/${passengerId}/check-in`, { status });
};




export const getTripRoute = (tripId) => {
  return axiosClient.get(`/driver/trip/${tripId}/route`);
};