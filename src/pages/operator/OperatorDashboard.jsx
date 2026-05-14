import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getDrivers, getRoutes, getStations, getTripPrices, getTripSchedules, getVehicles } from "../../api/operator";
import { useToast } from "../../context/ToastContext";
import { ErrorState, LoadingState, OperatorPageShell, StatCard } from "./OperatorUI";

const quickLinks = [
  {
    to: "/operator/routes",
    icon: "route",
    title: "Tuyến đường",
    description: "Tạo và cập nhật tuyến khai thác.",
  },
  {
    to: "/operator/stations",
    icon: "pin_drop",
    title: "Trạm",
    description: "Tạo trạm đón trả theo địa chỉ và thành phố.",
  },
  {
    to: "/operator/prices",
    icon: "local_offer",
    title: "Bảng giá",
    description: "Quản lý giá vé theo tuyến và trạm.",
  },
  {
    to: "/operator/schedules",
    icon: "calendar_month",
    title: "Lịch biểu",
    description: "Tạo lịch chạy, điểm dừng và chuyến.",
  },
];

export default function OperatorDashboard() {
  const { addToast } = useToast();
  const [user, setUser] = useState(null);
  const [data, setData] = useState({
    routes: [],
    stations: [],
    schedules: [],
    prices: [],
    drivers: [],
    vehicles: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      setUser(stored ? JSON.parse(stored) : null);
    } catch (err) {
      console.error("Lỗi đọc thông tin người dùng:", err);
    }
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [routesRes, stationsRes, schedulesRes, pricesRes, driversRes, vehiclesRes] = await Promise.allSettled([
        getRoutes({ limit: 100 }),
        getStations({ limit: 100 }),
        getTripSchedules({ limit: 100, orderBy: "asc" }),
        getTripPrices({ limit: 100 }),
        getDrivers({ limit: 100, status: "active" }),
        getVehicles({ limit: 100, status: "active" }),
      ]);

      setData({
        routes: routesRes.status === "fulfilled" ? routesRes.value.data?.routes || [] : [],
        stations: stationsRes.status === "fulfilled" ? stationsRes.value.data?.stations || [] : [],
        schedules: schedulesRes.status === "fulfilled" ? schedulesRes.value.data?.trip || [] : [],
        prices: pricesRes.status === "fulfilled" ? pricesRes.value.data?.prices || [] : [],
        drivers: driversRes.status === "fulfilled" ? driversRes.value.data?.drivers || [] : [],
        vehicles: vehiclesRes.status === "fulfilled" ? vehiclesRes.value.data?.vehicles || [] : [],
      });
      setError("");
    } catch (err) {
      console.error("Lỗi tải tổng quan điều hành:", err);
      const message = err.response?.data?.message || "Không thể tải dữ liệu tổng quan.";
      setError(message);
      addToast({ type: "error", title: "Không tải được tổng quan", message });
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => [
    { icon: "route", label: "Tuyến đường", value: data.routes.length, tone: "primary" },
    { icon: "pin_drop", label: "Trạm", value: data.stations.length, tone: "blue" },
    { icon: "calendar_month", label: "Lịch biểu", value: data.schedules.length, tone: "amber" },
    { icon: "local_offer", label: "Bảng giá", value: data.prices.length, tone: "emerald" },
    { icon: "badge", label: "Tài xế sẵn sàng", value: data.drivers.length, tone: "slate" },
    { icon: "directions_bus", label: "Xe hoạt động", value: data.vehicles.length, tone: "violet" },
  ], [data]);

  if (loading) {
    return (
      <OperatorPageShell title="Tổng quan điều hành" description="Đang tải dữ liệu vận hành.">
        <LoadingState />
      </OperatorPageShell>
    );
  }

  return (
    <OperatorPageShell
      eyebrow="Dispatcher"
      title={`Xin chào, ${user?.fullName || "điều hành viên"}`}
      description="Tổng quan tuyến, trạm, lịch biểu, giá vé và nguồn lực đang sẵn sàng."
    >
      {error && <div className="mb-6"><ErrorState message={error} /></div>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <section className="mt-6 rounded-xl border border-outline-variant/30 bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-on-surface">Khu vực điều hành</h2>
            <p className="mt-1 text-sm text-on-surface-variant">Các phần vận hành thường dùng trong ca điều phối.</p>
          </div>
          <span className="material-symbols-outlined text-primary">apps</span>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {quickLinks.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="group rounded-xl border border-outline-variant/30 p-4 transition-all hover:border-primary/50 hover:bg-primary/5"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
              </div>
              <h3 className="font-bold text-on-surface group-hover:text-primary">{item.title}</h3>
              <p className="mt-1 text-sm leading-6 text-on-surface-variant">{item.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </OperatorPageShell>
  );
}
