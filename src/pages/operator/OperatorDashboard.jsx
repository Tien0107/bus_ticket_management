import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getRoutes, getStations, getTripSchedules, getTripPrices } from "../../api/operator";
import { useToast } from "../../context/ToastContext";

export default function OperatorDashboard() {
  const { addToast } = useToast();

  const [user, setUser] = useState(null);
  const [data, setData] = useState({
    routes: 0,
    stations: 0,
    schedules: 0,
    priceTemplates: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) setUser(JSON.parse(stored));
    try {
      const stored = localStorage.getItem("user");
      if (stored) setUser(JSON.parse(stored));
    } catch (e) {
      console.error("Lỗi khi parse thông tin user:", e);
    }
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const results = await Promise.allSettled([
        getRoutes({ limit: 100 }),
        getStations({ limit: 100 }),
        getTripSchedules({ limit: 100, orderBy: 'asc' }),
        getTripPrices({ limit: 100 }),
      ]);

      const [routesRes, stationsRes, schedulesRes, pricesRes] = results;

      const routes = routesRes.status === "fulfilled" ? routesRes.value.data?.routes?.length || 0 : 0;
      const stations = stationsRes.status === "fulfilled" ? stationsRes.value.data?.stations?.length || 0 : 0;
      const schedules = schedulesRes.status === "fulfilled" ? schedulesRes.value.data?.trip?.length || 0 : 0;
      const prices = pricesRes.status === "fulfilled" ? pricesRes.value.data?.prices?.length || 0 : 0;

      setData({
        routes,
        stations,
        schedules,
        priceTemplates: prices,
      });

      if (routesRes.status === "rejected") {
        console.warn("⚠️ Lỗi tải danh sách tuyến:", routesRes.reason);
      }
      if (stationsRes.status === "rejected") {
        console.warn("⚠️ Lỗi tải danh sách trạm:", stationsRes.reason);
      }
      if (schedulesRes.status === "rejected") {
        console.warn("⚠️ Lỗi tải danh sách lịch biểu:", schedulesRes.reason);
      }
      if (pricesRes.status === "rejected") {
        console.warn("⚠️ Lỗi tải bảng giá:", pricesRes.reason);
      }
    } catch (err) {
      console.error("Lỗi tải dashboard:", err);
      const errorMsg = err.response?.data?.message || "Lỗi tải dashboard.";
      addToast({
        type: "error",
        title: "Không tải được tổng quan",
        message: errorMsg,
      });
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
            Xin chào, {user?.fullName || "Điều hành viên"}!
          </h1>
          <p className="text-on-surface-variant text-lg">Quản lý tuyến, trạm và lịch biểu chuyến</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-on-surface-variant text-sm font-medium mb-1">Tuyến đường</p>
                <p className="text-4xl font-bold text-primary">{data.routes}</p>
              </div>
              <span className="material-symbols-outlined text-5xl text-primary-container">
                route
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-on-surface-variant text-sm font-medium mb-1">Trạm dừng</p>
                <p className="text-4xl font-bold text-primary">{data.stations}</p>
              </div>
              <span className="material-symbols-outlined text-5xl text-primary-container">
                location_on
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-on-surface-variant text-sm font-medium mb-1">Lịch biểu</p>
                <p className="text-4xl font-bold text-primary">{data.schedules}</p>
              </div>
              <span className="material-symbols-outlined text-5xl text-primary-container">
                schedule
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-on-surface-variant text-sm font-medium mb-1">Bảng giá</p>
                <p className="text-4xl font-bold text-primary">{data.priceTemplates}</p>
              </div>
              <span className="material-symbols-outlined text-5xl text-primary-container">
                local_offer
              </span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Link
            to="/operator/routes"
            className="bg-gradient-to-br from-primary to-primary-container text-white rounded-2xl p-6 hover:shadow-editorial transition-shadow cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold mb-1">Quản lý tuyến đường</h3>
                <p className="opacity-90 text-sm">{data.routes} tuyến</p>
              </div>
              <span className="material-symbols-outlined text-4xl opacity-50">route</span>
            </div>
          </Link>

          <Link
            to="/operator/schedules"
            className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-editorial transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-on-surface mb-1">Lịch biểu chuyến</h3>
                <p className="text-on-surface-variant text-sm">{data.schedules} lịch biểu</p>
              </div>
              <span className="material-symbols-outlined text-3xl text-primary">schedule</span>
            </div>
          </Link>
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            to="/operator/routes"
            className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-editorial transition-all text-center"
          >
            <span className="material-symbols-outlined text-4xl text-primary block mb-3">
              route
            </span>
            <p className="font-bold text-on-surface text-sm">Tuyến đường</p>
          </Link>

          <Link
            to="/operator/stations"
            className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-editorial transition-all text-center"
          >
            <span className="material-symbols-outlined text-4xl text-primary block mb-3">
              location_on
            </span>
            <p className="font-bold text-on-surface text-sm">Trạm dừng</p>
          </Link>

          <Link
            to="/operator/prices"
            className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-editorial transition-all text-center"
          >
            <span className="material-symbols-outlined text-4xl text-primary block mb-3">
              local_offer
            </span>
            <p className="font-bold text-on-surface text-sm">Bảng giá</p>
          </Link>

          <Link
            to="/operator/schedules"
            className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-editorial transition-all text-center"
          >
            <span className="material-symbols-outlined text-4xl text-primary block mb-3">
              schedule
            </span>
            <p className="font-bold text-on-surface text-sm">Lịch biểu</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
