import axiosClient from "./axiosClient";




export const companySignUp = (data) => {
  return axiosClient.post("/operator-admin/sign-up", data);
};


export const getCompanyInfo = () => {
  return axiosClient.get("/operator-admin/me");
};


export const updateCompanyInfo = (data) => {
  return axiosClient.put("/operator-admin/me", data);
};


export const getAdminCompanyUploadPresigned = () => {
  return axiosClient.get("/file/upload/admin-company/presigned");
};

export const uploadAdminCompanyFile = async (file, presignedConfig) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", presignedConfig.apiKey);
  formData.append("timestamp", presignedConfig.timestamp);
  formData.append("signature", presignedConfig.signature);

  if (presignedConfig.folder) {
    formData.append("folder", presignedConfig.folder);
  }

  const response = await fetch(presignedConfig.uploadUrl, {
    method: "POST",
    body: formData
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.error?.message || data?.message || "Upload ảnh thất bại");
  }

  return data;
};


export const verifyCompanyAccount = (data) => {
  return axiosClient.post("/operator-admin/account/verify", data);
};


export const getVehicles = (params = {}) => {
  return axiosClient.get("/operator-admin/vehicle", { params });
};


export const createVehicle = (data) => {
  return axiosClient.post("/operator-admin/vehicle", data);
};


export const updateVehicle = (vehicleId, data) => {
  return axiosClient.put(`/operator-admin/vehicle/${vehicleId}`, data);
};


export const deleteVehicleSeat = (vehicleId) => {
  return axiosClient.delete(`/operator-admin/vehicle/${vehicleId}/seat`);
};


export const manageSeat = (data) => {
  return axiosClient.post("/operator-admin/seat", data);
};


export const getDrivers = (params = {}) => {
  return axiosClient.get("/operator-admin/driver", { params });
};


export const getStaff = (params = {}) => {
  return axiosClient.get("/operator-admin/staff", { params });
};


export const updateStaff = (userId, data) => {
  return axiosClient.put(`/operator-admin/staff/${userId}`, data);
};


export const updateStaffRole = (userId, role) => {

  return axiosClient.put(`/operator-admin/staff/${userId}/role`, role);
};



export const getPayments = (params = {}) => {
  return axiosClient.get("/operator-admin/payment", { params });
};


export const updatePayment = (paymentCode) => {
  return axiosClient.put(`/operator-admin/payment/${paymentCode}`);
};



export const getRevenue = () => {
  return axiosClient.get("/operator-admin/revenue");
};



export const createStripeAccount = () => {
  return axiosClient.post("/operator-admin/stripe/account");
};


export const handleStripeConnectCallback = (search = "") => {
  return axiosClient.get(`/stripe/connect/callback${search}`);
};


export const getStripeConnectStatus = () => {
  return axiosClient.get("/stripe/connect/status", {
    validateStatus: (status) => status < 600
  });
};


export const getStripeBalance = () => {
  return axiosClient.get("/operator-admin/stripe/balance");
};


export const withdrawStripeBalance = (data) => {
  return axiosClient.post("/operator-admin/stripe/balance/withdraw", data);
};