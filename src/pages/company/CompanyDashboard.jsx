import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getCompanyInfo, getDrivers, getRevenue, getStaff, getVehicles } from "../../api/company";
import { useToast } from "../../context/ToastContext";
import { CompanyPageShell, ErrorState, LoadingState, StatCard } from "./CompanyUI";

const quickLinks = [
  {
    to: "/company/vehicles",
    icon: "directions_bus",
    title: "Phương tiện",
    description: "Theo dõi xe, số ghế và trạng thái vận hành.",
  },
  {
    to: "/company/drivers",
    icon: "badge",
    title: "Tài xế",
    description: "Quản lý hồ sơ, liên hệ và trạng thái tài xế.",
  },
  {
    to: "/company/staff",
    icon: "groups",
    title: "Nhân viên",
    description: "Theo dõi đội ngũ vận hành và phân quyền.",
  },
  {
    to: "/company/payments",
    icon: "payments",
    title: "Thanh toán",
    description: "Kiểm tra giao dịch, doanh thu và số dư.",
  },
  {
    to: "/company/profile",
    icon: "domain",
    title: "Hồ sơ",
    description: "Cập nhật tên, hotline, logo và địa chỉ công ty.",
  },
];

const formatCurrency = (value) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

export default function CompanyDashboard() {
  const { addToast } = useToast();
  const [user, setUser] = useState(null);
  const [data, setData] = useState({
    vehicles: [],
    drivers: [],
    staff: [],
    company: null,
    revenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboardData = useCallback(async (storedUser = null) => {
    try {
      setLoading(true);
      setError("");

      const [vehiclesRes, driversRes, staffRes, companyRes, revenueRes] = await Promise.allSettled([
        getVehicles({ limit: 10 }),
        getDrivers({ limit: 10 }),
        getStaff({ limit: 10 }),
        getCompanyInfo(),
        getRevenue(),
      ]);

      setData({
        vehicles: vehiclesRes.status === "fulfilled" ? vehiclesRes.value.data?.vehicles || [] : [],
        drivers: driversRes.status === "fulfilled" ? driversRes.value.data?.drivers || [] : [],
        staff: staffRes.status === "fulfilled" ? staffRes.value.data?.staff || [] : [],
        company:
          companyRes.status === "fulfilled"
            ? companyRes.value.data?.company || companyRes.value.data
            : { name: storedUser?.fullName || "Công ty của tôi" },
        revenue: revenueRes.status === "fulfilled" ? Number(revenueRes.value.data?.total || 0) : 0,
      });
    } catch (err) {
      const message = err.response?.data?.message || "Không thể tải dữ liệu tổng quan.";
      setError(message);
      addToast(message, "error");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    const storedUser = stored ? JSON.parse(stored) : null;
    setUser(storedUser);
    fetchDashboardData(storedUser);
  }, [fetchDashboardData]);

  const stats = useMemo(() => {
    const activeVehicles = data.vehicles.filter((vehicle) => vehicle.status === "active").length;
    const activeDrivers = data.drivers.filter((driver) => driver.status === "active").length;
    const activeStaff = data.staff.filter((member) => member.status === "active").length;

    return [
      { icon: "directions_bus", label: "Phương tiện", value: data.vehicles.length, tone: "primary" },
      { icon: "verified", label: "Xe hoạt động", value: activeVehicles, tone: "emerald" },
      { icon: "badge", label: "Tài xế hoạt động", value: activeDrivers, tone: "blue" },
      { icon: "groups", label: "Nhân viên hoạt động", value: activeStaff, tone: "slate" },
      { icon: "payments", label: "Doanh thu", value: formatCurrency(data.revenue), tone: "amber" },
    ];
  }, [data]);

  if (loading) {
    return (
      <CompanyPageShell title="Tổng quan công ty" description="Đang tải dữ liệu vận hành mới nhất.">
        <LoadingState />
      </CompanyPageShell>
    );
  }

  const companyName = data.company?.name || "Nhà xe";

  return (
    <CompanyPageShell
      eyebrow="Company Admin"
      title={`Xin chào, ${user?.fullName || "quản trị viên"}`}
      description={`${companyName} - tổng quan nhanh về phương tiện, tài xế và nhân sự vận hành.`}
      actions={
        <Link
          to="/company/profile"
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-outline-variant/60 bg-white px-4 py-3 text-sm font-bold text-on-surface transition-colors hover:bg-surface-container-low"
        >
          <span className="material-symbols-outlined text-[20px]">settings</span>
          Cài đặt hồ sơ
        </Link>
      }
    >
      {error && <div className="mb-6"><ErrorState message={error} /></div>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-xl border border-outline-variant/30 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-extrabold text-on-surface">Truy cập nhanh</h2>
              <p className="mt-1 text-sm text-on-surface-variant">Các khu vực quản trị thường dùng.</p>
            </div>
            <span className="material-symbols-outlined text-primary">apps</span>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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

        <aside className="rounded-xl border border-outline-variant/30 bg-white p-5 shadow-sm">
          <div className="mb-5">
            <h2 className="text-xl font-extrabold text-on-surface">Tình trạng hệ thống</h2>
            <p className="mt-1 text-sm text-on-surface-variant">Tóm tắt từ dữ liệu hiện có.</p>
          </div>
          <div className="space-y-4">
            <div className="rounded-lg bg-surface-container-low p-4">
              <p className="text-sm font-medium text-on-surface-variant">Tỷ lệ xe hoạt động</p>
              <p className="mt-2 text-2xl font-extrabold text-primary">
                {data.vehicles.length ? Math.round((data.vehicles.filter((v) => v.status === "active").length / data.vehicles.length) * 100) : 0}%
              </p>
            </div>
            <div className="rounded-lg bg-surface-container-low p-4">
              <p className="text-sm font-medium text-on-surface-variant">Nhân sự vận hành</p>
              <p className="mt-2 text-2xl font-extrabold text-on-surface">{data.drivers.length + data.staff.length}</p>
            </div>
            <Link
              to="/company/payments"
              className="flex items-center justify-between rounded-lg border border-outline-variant/40 px-4 py-3 text-sm font-bold text-on-surface transition-colors hover:bg-surface-container-low"
            >
              Xem thanh toán
              <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
            </Link>
          </div>
        </aside>
      </div>
    </CompanyPageShell>
  );
}
