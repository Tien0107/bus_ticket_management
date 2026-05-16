import React, { useState, useEffect } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { logout } from "../../api/auth";
import NotificationBell from "../common/NotificationBell";
import ChatWidget from "../chat/ChatWidget";

export default function DashboardLayout() {
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const role = String(user?.role || "").replace(/[\s-]+/g, "_").toLowerCase();
  const staffProfileRole = String(user?.staffProfileRole || "").replace(/[\s-]+/g, "_").toLowerCase();
  const isCompanyAdmin = role === "admin" || (role === "operator" && ["company_admin", "operator_admin", "admin"].includes(staffProfileRole));
  const isDispatcher = role === "operator" && ["dispatcher", "operator_dispatcher"].includes(staffProfileRole);
  const isSupport = role === "operator" && ["support", "company_support", "operator_support"].includes(staffProfileRole);
  const dashboardHomePath = role === "driver"
    ? "/driver/dashboard"
    : isCompanyAdmin
    ? "/company/dashboard"
    : isSupport
    ? "/company-support/tickets"
    : isDispatcher
    ? "/operator/dashboard"
    : role === "super_admin" || role === "superadmin"
    ? "/super-admin/dashboard"
    : location.pathname || "/";

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      setUser(JSON.parse(stored));
    }
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error("Lỗi khi gọi API logout:", err);
    }
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + "/");

  const getLinkClass = (path) => {
    const baseClass = "px-4 py-3 rounded-lg flex items-center gap-3 font-medium transition-all";
    return isActive(path)
      ? `${baseClass} bg-primary text-white`
      : `${baseClass} text-on-surface-variant hover:bg-surface-container-high`;
  };

  const showChatWidget = role === "driver" || isCompanyAdmin || isDispatcher;

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } bg-surface-container shadow-lg transition-all duration-300 flex flex-col`}
      >
        {/* Header */}
        <div className="p-4 border-b border-outline-variant/20">
          <div className="flex items-center justify-between">
            <Link
              to={dashboardHomePath}
              className={`flex items-center gap-3 rounded-lg text-primary transition-colors hover:bg-surface-container-high ${
                sidebarOpen ? "px-2 py-1" : "p-2"
              }`}
              aria-label="Về trang quản trị"
              title="Về trang quản trị"
            >
              <span className="material-symbols-outlined text-[26px]">directions_bus</span>
              {sidebarOpen && <span className="text-xl font-bold">Bus Go</span>}
            </Link>
            <div className="flex items-center gap-2">
              <NotificationBell align="left" />
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-surface-container-high rounded-lg transition-all"
              >
                <span className="material-symbols-outlined">
                  {sidebarOpen ? "menu_open" : "menu"}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          <div className="my-4">
            <div className={`text-xs font-bold uppercase transition-all ${sidebarOpen ? "px-4 py-2" : "px-2"}`}>
              {sidebarOpen ? role === "driver" ? "Tài xế" : isCompanyAdmin ? "Công ty" : isSupport ? "Hỗ trợ" : isDispatcher ? "Điều hành" : "Quản trị" : ""}
            </div>
          </div>

          {/* Driver Menu */}
          {role === "driver" && (
            <>
              <Link to="/driver/dashboard" className={getLinkClass("/driver/dashboard")}>
                <span className="material-symbols-outlined">dashboard</span>
                {sidebarOpen && <span>Bảng điều khiển</span>}
              </Link>
              <Link to="/driver/profile" className={getLinkClass("/driver/profile")}>
                <span className="material-symbols-outlined">person</span>
                {sidebarOpen && <span>Hồ sơ</span>}
              </Link>
            </>
          )}

          {/* Company Menu */}
          {isCompanyAdmin && (
            <>
              <Link to="/company/dashboard" className={getLinkClass("/company/dashboard")}>
                <span className="material-symbols-outlined">dashboard</span>
                {sidebarOpen && <span>Bảng điều khiển</span>}
              </Link>
              <Link to="/company/vehicles" className={getLinkClass("/company/vehicles")}>
                <span className="material-symbols-outlined">directions_bus</span>
                {sidebarOpen && <span>Phương tiện</span>}
              </Link>
              <Link to="/company/drivers" className={getLinkClass("/company/drivers")}>
                <span className="material-symbols-outlined">people</span>
                {sidebarOpen && <span>Tài xế</span>}
              </Link>
              <Link to="/company/staff" className={getLinkClass("/company/staff")}>
                <span className="material-symbols-outlined">group</span>
                {sidebarOpen && <span>Nhân viên</span>}
              </Link>
              <Link to="/company/payments" className={getLinkClass("/company/payments")}>
                <span className="material-symbols-outlined">payments</span>
                {sidebarOpen && <span>Thanh toán</span>}
              </Link>
              <Link to="/company/profile" className={getLinkClass("/company/profile")}>
                <span className="material-symbols-outlined">person</span>
                {sidebarOpen && <span>Hồ sơ</span>}
              </Link>
            </>
          )}

          {/* Operator Menu */}
          {isDispatcher && (
            <>
              <Link to="/operator/dashboard" className={getLinkClass("/operator/dashboard")}>
                <span className="material-symbols-outlined">dashboard</span>
                {sidebarOpen && <span>Bảng điều khiển</span>}
              </Link>
              <Link to="/operator/routes" className={getLinkClass("/operator/routes")}>
                <span className="material-symbols-outlined">route</span>
                {sidebarOpen && <span>Tuyến đường</span>}
              </Link>
              <Link to="/operator/stations" className={getLinkClass("/operator/stations")}>
                <span className="material-symbols-outlined">location_on</span>
                {sidebarOpen && <span>Trạm</span>}
              </Link>
              <Link to="/operator/prices" className={getLinkClass("/operator/prices")}>
                <span className="material-symbols-outlined">local_offer</span>
                {sidebarOpen && <span>Bảng giá</span>}
              </Link>
              <Link to="/operator/schedules" className={getLinkClass("/operator/schedules")}>
                <span className="material-symbols-outlined">schedule</span>
                {sidebarOpen && <span>Lịch biểu</span>}
              </Link>
            </>
          )}

          {/* Super Admin Menu */}
          {(role === "super_admin" || role === "superadmin") && (
            <>
              <Link to="/super-admin/dashboard" className={getLinkClass("/super-admin/dashboard")}>
                <span className="material-symbols-outlined">dashboard</span>
                {sidebarOpen && <span>Bảng điều khiển</span>}
              </Link>
              <Link to="/super-admin/companies" className={getLinkClass("/super-admin/companies")}>
                <span className="material-symbols-outlined">business</span>
                {sidebarOpen && <span>Công ty</span>}
              </Link>
            </>
          )}
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-outline-variant/20 space-y-2">
          {sidebarOpen && user && (
            <div className="mb-3 pb-3 border-b border-outline-variant/20">
              <p className="text-sm font-semibold text-on-surface truncate">{user.fullName}</p>
              <p className="text-xs text-on-surface-variant truncate">{user.email}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full px-4 py-3 bg-error/10 text-error rounded-lg flex items-center justify-center gap-2 font-medium hover:bg-error/20 transition-all"
          >
            <span className="material-symbols-outlined">logout</span>
            {sidebarOpen && <span>Đăng xuất</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
      {showChatWidget && <ChatWidget />}
    </div>
  );
}
