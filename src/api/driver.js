import axiosClient from "./axiosClient";

// ===== Đăng ký tài xế =====
export const driverSignUp = (data) => {
  return axiosClient.post("/driver/sign-up", data);
};

// ===== Quản lý chuyến =====

// Lấy danh sách chuyến của tài xế (tất cả status)
export const getDriverTrips = (params = {}) => {
  return axiosClient.get("/driver/trip", {
    params: { orderBy: "asc", ...params }
  });
};

// Lấy trips từ tất cả status vì API danh sách lọc theo từng status
export const getDriverTripsAllStatuses = async () => {
  try {
    const statuses = ["scheduled", "running", "completed", "cancelled"];
    const allTripsArray = [];
    const tripIds = new Set();

    const promises = statuses.map((status) =>
      getDriverTrips({ status })
        .then((response) => {
          const trips = response?.data?.trips || [];
          return trips;
        })
        .catch(() => [])
    );

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
    return getDriverTrips();
  }
};

// Cập nhật thông tin chuyến
export const updateTrip = (tripId, data) => {
  return axiosClient.patch(`/driver/trip/${tripId}`, data);
};

// ===== Quản lý hành khách =====

// Lấy danh sách hành khách của chuyến
export const getTripPassengers = (tripId, params) => {
  return axiosClient.get(`/driver/trip/${tripId}/passenger`, { params });
};

// Check-in hành khách
export const checkInPassenger = (tripId, passengerId, status = "checked_in") => {
  return axiosClient.put(`/driver/trip/${tripId}/passenger/${passengerId}/check-in`, { status });
};

// ===== Quản lý tuyến đường =====

// Lấy route của chuyến
export const getTripRoute = (tripId) => {
  return axiosClient.get(`/driver/trip/${tripId}/route`);
};
