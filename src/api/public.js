import axiosClient from "./axiosClient";

// Lấy danh sách nhà xe (công khai, không cần auth)
export const getCompanies = () => {
  return axiosClient.get("/public/company");
};
