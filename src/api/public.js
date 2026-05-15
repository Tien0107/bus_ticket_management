import axiosClient from "./axiosClient";

// Lấy danh sách nhà xe (công khai, không cần auth)
export const getCompanies = () => {
  return axiosClient.get("/public/company");
};

// Lấy danh sách chương trình khuyến mãi
export const getPromotions = (params) => {
  return axiosClient.get("/public/promotion-new", { params });
};
