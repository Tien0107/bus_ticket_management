import axiosClient from "./axiosClient";

/* ========== Company Admin Endpoints ========== */

// 1. Company Sign-up
export const companySignUp = (data) => {
  return axiosClient.post("/company-admin/sign-up", data);
};

// 2. Get Company Profile
export const getCompanyProfile = () => {
  return axiosClient.get("/company-admin/profile");
};

// 3. Update Company Profile
export const updateCompanyProfile = (data) => {
  return axiosClient.put("/company-admin/profile", data);
};

// 4. Get All Vehicles
export const getVehicles = (params = {}) => {
  return axiosClient.get("/company-admin/vehicle", { params });
};

// 5. Create Vehicle
export const createVehicle = (data) => {
  return axiosClient.post("/company-admin/vehicle", data);
};

// 6. Update Vehicle
export const updateVehicle = (vehicleId, data) => {
  return axiosClient.put(`/company-admin/vehicle/${vehicleId}`, data);
};

// 7. Delete Vehicle
export const deleteVehicle = (vehicleId) => {
  return axiosClient.delete(`/company-admin/vehicle/${vehicleId}`);
};

// 8. Delete Vehicle Seat
export const deleteVehicleSeat = (vehicleId) => {
  return axiosClient.delete(`/company-admin/vehicle/${vehicleId}/seat`);
};

// 9. Add/Update Seat Configuration
export const manageSeat = (data) => {
  return axiosClient.post("/company-admin/seat", data);
};

// 10. Get All Drivers
export const getDrivers = (params = {}) => {
  return axiosClient.get("/company-admin/driver", { params });
};

// 11. Get All Staff
export const getStaff = (params = {}) => {
  return axiosClient.get("/company-admin/staff", { params });
};

// 12. Update Staff Role
export const updateStaffRole = (userId, roleData) => {
  return axiosClient.put(`/company-admin/staff/${userId}/role`, roleData);
};
