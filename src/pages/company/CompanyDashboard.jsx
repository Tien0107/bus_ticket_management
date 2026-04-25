import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getVehicles, getDrivers, getStaff, getCompanyInfo, getCompanyProfile } from "../../api/company";
import { useToast } from "../../context/ToastContext";

export default function CompanyDashboard() {
  const { addToast } = useToast();

  const [user, setUser] = useState(null);
  const [data, setData] = useState({
    vehicles: 0,
    drivers: 0,
    staff: 0,
    company: null,
    userProfile: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) setUser(JSON.parse(stored));
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch với error handling riêng để partial success
      const results = await Promise.allSettled([
        getVehicles({ limit: 100 }),  // Pass limit parameter
        getDrivers({ limit: 100 }),   // Pass limit parameter
        getStaff({ limit: 100 }),     // Pass limit parameter
        getCompanyInfo(),
        getCompanyProfile(),          // NEW: Lấy profile của user
      ]);

      const [vehiclesRes, driversRes, staffRes, companyRes, profileRes] = results;

      // Xử lý từng response
      const vehicles = vehiclesRes.status === "fulfilled" 
        ? vehiclesRes.value.data?.vehicles?.length || 0
        : 0;
      
      const drivers = driversRes.status === "fulfilled"
        ? driversRes.value.data?.drivers?.length || 0
        : 0;
      
      const staff = staffRes.status === "fulfilled"
        ? staffRes.value.data?.staff?.length || 0
        : 0;
      
      const company = companyRes.status === "fulfilled"
        ? companyRes.value.data?.company || null
        : null;

      const userProfile = profileRes.status === "fulfilled"
        ? profileRes.value.data?.user || null
        : null;

      setData({
        vehicles,
        drivers,
        staff,
        company: company || { name: user?.fullName || "Công ty của tôi" },
        userProfile,
      });

      // Show warnings nếu có request fail
      if (vehiclesRes.status === "rejected") {
        console.warn("⚠️ Lỗi tải danh sách xe:", vehiclesRes.reason);
      }
      if (driversRes.status === "rejected") {
        console.warn("⚠️ Lỗi tải danh sách tài xế:", driversRes.reason);
      }
      if (staffRes.status === "rejected") {
        console.warn("⚠️ Lỗi tải danh sách nhân viên:", staffRes.reason);
      }
      if (companyRes.status === "rejected") {
        console.warn("⚠️ Lỗi tải thông tin công ty:", companyRes.reason);
      }
      if (profileRes.status === "rejected") {
        console.warn("⚠️ Lỗi tải profile user:", profileRes.reason);
      }

    } catch (err) {
      console.error("Lỗi tải dashboard:", err);
      const errorMsg = err.response?.data?.message || "Lỗi tải dashboard.";
      addToast(errorMsg, "error");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface p-6 lg:p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <p className="text-on-surface-variant mt-4">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold text-on-surface tracking-tight mb-2">
            Xin chào, {data.userProfile?.fullName || user?.fullName || "Nhà xe"}! 👋
          </h1>
          <p className="text-on-surface-variant text-lg">
            {data.company?.name || data.userProfile?.position || "Tổng quan kinh doanh"}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-on-surface-variant text-sm font-medium mb-1">Phương tiện</p>
                <p className="text-4xl font-bold text-primary">{data.vehicles}</p>
              </div>
              <span className="material-symbols-outlined text-5xl text-primary-container">
                directions_bus
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-on-surface-variant text-sm font-medium mb-1">Tài xế</p>
                <p className="text-4xl font-bold text-primary">{data.drivers}</p>
              </div>
              <span className="material-symbols-outlined text-5xl text-primary-container">
                person
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-on-surface-variant text-sm font-medium mb-1">Nhân viên</p>
                <p className="text-4xl font-bold text-primary">{data.staff}</p>
              </div>
              <span className="material-symbols-outlined text-5xl text-primary-container">
                group
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-on-surface-variant text-sm font-medium mb-1">Chuyến đi</p>
                <p className="text-4xl font-bold text-primary">—</p>
              </div>
              <span className="material-symbols-outlined text-5xl text-primary-container">
                calendar_month
              </span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Link
            to="/company/vehicles"
            className="bg-gradient-to-br from-primary to-primary-container text-white rounded-2xl p-6 hover:shadow-editorial transition-shadow cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold mb-1">Quản lý phương tiện</h3>
                <p className="opacity-90 text-sm">{data.vehicles} xe</p>
              </div>
              <span className="material-symbols-outlined text-4xl opacity-50">directions_bus</span>
            </div>
          </Link>

          <Link
            to="/company/drivers"
            className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-editorial transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-on-surface mb-1">Nhân viên tài xế</h3>
                <p className="text-on-surface-variant text-sm">{data.drivers} tài xế</p>
              </div>
              <span className="material-symbols-outlined text-3xl text-primary">person</span>
            </div>
          </Link>
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            to="/company/profile"
            className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-editorial transition-all text-center"
          >
            <span className="material-symbols-outlined text-4xl text-primary block mb-3">
              business
            </span>
            <p className="font-bold text-on-surface text-sm">Hồ sơ công ty</p>
          </Link>

          <Link
            to="/company/staff"
            className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-editorial transition-all text-center"
          >
            <span className="material-symbols-outlined text-4xl text-primary block mb-3">
              group
            </span>
            <p className="font-bold text-on-surface text-sm">Quản lý nhân viên</p>
          </Link>

          <Link
            to="/company/schedules"
            className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-editorial transition-all text-center"
          >
            <span className="material-symbols-outlined text-4xl text-primary block mb-3">
              schedule
            </span>
            <p className="font-bold text-on-surface text-sm">Lịch biểu</p>
          </Link>

          <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant block mb-3">
              analytics
            </span>
            <p className="font-bold text-on-surface-variant text-sm">Báo cáo (sắp)</p>
          </div>
        </div>
      </div>
    </div>
  );
}