import axiosClient from "./axiosClient";

/* ========== Company Admin Endpoints ========== */

// 1. Company Sign-up
export const companySignUp = (data) => {
  return axiosClient.post("/company-admin/sign-up", data);
};

// 2. Get Company Info (NEW - FIX)
export const getCompanyInfo = () => {
  return axiosClient.get("/company-admin/company");
};

// 3. Update Company Info (FIX)
export const updateCompanyInfo = (data) => {
  return axiosClient.put("/company-admin/company", data);
};

// 4. Get User/Staff Profile
export const getCompanyProfile = () => {
  return axiosClient.get("/company-admin/profile");
};

// 5. Update User/Staff Profile
export const updateCompanyProfile = (data) => {
  return axiosClient.put("/company-admin/profile", data);
};

// 6. Verify Company Account (NEW)
export const verifyCompanyAccount = (data) => {
  return axiosClient.post("/company-admin/account/verify", data);
};

// 7. Get All Vehicles
export const getVehicles = (params = {}) => {
  return axiosClient.get("/company-admin/vehicle", { params });
};

// 8. Create Vehicle
export const createVehicle = (data) => {
  return axiosClient.post("/company-admin/vehicle", data);
};

// 9. Update Vehicle
export const updateVehicle = (vehicleId, data) => {
  return axiosClient.put(`/company-admin/vehicle/${vehicleId}`, data);
};

// 10. Delete Vehicle Seat
export const deleteVehicleSeat = (vehicleId) => {
  return axiosClient.delete(`/company-admin/vehicle/${vehicleId}/seat`);
};

// 11. Add/Update Seat Configuration
export const manageSeat = (data) => {
  return axiosClient.post("/company-admin/seat", data);
};

// 12. Get All Drivers
export const getDrivers = (params = {}) => {
  return axiosClient.get("/company-admin/driver", { params });
};

// 13. Get All Staff
export const getStaff = (params = {}) => {
  return axiosClient.get("/company-admin/staff", { params });
};

// 14. Update Staff Info (NEW)
export const updateStaff = (userId, data) => {
  return axiosClient.put(`/company-admin/staff/${userId}`, data);
};

// 15. Update Staff Role
export const updateStaffRole = (userId, role) => {
  // Swagger show request body là string, không object
  return axiosClient.put(`/company-admin/staff/${userId}/role`, role);
};
