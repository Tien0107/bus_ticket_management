import axiosClient from "./axiosClient";

/* ========== Operator Admin Endpoints ========== */

// 1. Company Sign-up
export const companySignUp = (data) => {
  return axiosClient.post("/operator-admin/sign-up", data);
};

// 2. Get Company Info
export const getCompanyInfo = () => {
  return axiosClient.get("/operator-admin/me");
};

// 3. Update Company Info
export const updateCompanyInfo = (data) => {
  return axiosClient.put("/operator-admin/me", data);
};

// 4. Get User/Staff Profile
export const getCompanyProfile = () => {
  return axiosClient.get("/operator-admin/profile");
};

// 5. Update User/Staff Profile
export const updateCompanyProfile = (data) => {
  return axiosClient.put("/operator-admin/profile", data);
};

// 6. Verify Company Account
export const verifyCompanyAccount = (data) => {
  return axiosClient.post("/operator-admin/account/verify", data);
};

// 7. Get All Vehicles
export const getVehicles = (params = {}) => {
  return axiosClient.get("/operator-admin/vehicle", { params });
};

// 8. Create Vehicle
export const createVehicle = (data) => {
  return axiosClient.post("/operator-admin/vehicle", data);
};

// 9. Update Vehicle
export const updateVehicle = (vehicleId, data) => {
  return axiosClient.put(`/operator-admin/vehicle/${vehicleId}`, data);
};

// 10. Delete Vehicle Seat
export const deleteVehicleSeat = (vehicleId) => {
  return axiosClient.delete(`/operator-admin/vehicle/${vehicleId}/seat`);
};

// 11. Add/Update Seat Configuration
export const manageSeat = (data) => {
  return axiosClient.post("/operator-admin/seat", data);
};

// 12. Get All Drivers
export const getDrivers = (params = {}) => {
  return axiosClient.get("/operator-admin/driver", { params });
};

// 13. Get All Staff
export const getStaff = (params = {}) => {
  return axiosClient.get("/operator-admin/staff", { params });
};

// 14. Update Staff Info
export const updateStaff = (userId, data) => {
  return axiosClient.put(`/operator-admin/staff/${userId}`, data);
};

// 15. Update Staff Role
export const updateStaffRole = (userId, role) => {
  // Swagger show request body là string, không object
  return axiosClient.put(`/operator-admin/staff/${userId}/role`, role);
};
