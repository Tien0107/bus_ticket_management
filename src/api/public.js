import axiosClient from "./axiosClient";


export const getCompanies = () => {
  return axiosClient.get("/public/company");
};


export const getPromotions = (params) => {
  return axiosClient.get("/public/promotion-new", { params });
};