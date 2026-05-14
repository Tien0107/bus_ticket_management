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

// 4. Verify Company Account
export const verifyCompanyAccount = (data) => {
  return axiosClient.post("/operator-admin/account/verify", data);
};

// 5. Get All Vehicles
export const getVehicles = (params = {}) => {
  return axiosClient.get("/operator-admin/vehicle", { params });
};

// 6. Create Vehicle
export const createVehicle = (data) => {
  return axiosClient.post("/operator-admin/vehicle", data);
};

// 7. Update Vehicle
export const updateVehicle = (vehicleId, data) => {
  return axiosClient.put(`/operator-admin/vehicle/${vehicleId}`, data);
};

// 8. Delete Vehicle Seat
export const deleteVehicleSeat = (vehicleId) => {
  return axiosClient.delete(`/operator-admin/vehicle/${vehicleId}/seat`);
};

// 9. Add/Update Seat Configuration
export const manageSeat = (data) => {
  return axiosClient.post("/operator-admin/seat", data);
};

// 10. Get All Drivers
export const getDrivers = (params = {}) => {
  return axiosClient.get("/operator-admin/driver", { params });
};

// 11. Get All Staff
export const getStaff = (params = {}) => {
  return axiosClient.get("/operator-admin/staff", { params });
};

// 12. Update Staff Info
export const updateStaff = (userId, data) => {
  return axiosClient.put(`/operator-admin/staff/${userId}`, data);
};

// 13. Update Staff Role
export const updateStaffRole = (userId, role) => {
  // Swagger show request body là string, không object
  return axiosClient.put(`/operator-admin/staff/${userId}/role`, role);
};

// ===== Payment Management =====
// 14. Get All Payments
export const getPayments = (params = {}) => {
  return axiosClient.get("/operator-admin/payment", { params });
};

// 15. Update Payment Status
export const updatePayment = (paymentCode) => {
  return axiosClient.put(`/operator-admin/payment/${paymentCode}`);
};

// ===== Revenue =====
// 16. Get Revenue
export const getRevenue = () => {
  return axiosClient.get("/operator-admin/revenue");
};

// ===== Stripe Integration =====
// 17. Create Stripe Account
export const createStripeAccount = () => {
  return axiosClient.post("/operator-admin/stripe/account");
};

// 18. Get Stripe Balance
export const getStripeBalance = () => {
  return axiosClient.get("/operator-admin/stripe/balance");
};

// 19. Withdraw from Stripe Balance
export const withdrawStripeBalance = (data) => {
  return axiosClient.post("/operator-admin/stripe/balance/withdraw", data);
};
