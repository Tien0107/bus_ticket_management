import React, { useState, useEffect } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";

export default function DashboardLayout() {
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      setUser(JSON.parse(stored));
    }
  }, []);

  const handleLogout = () => {
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
            {sidebarOpen && <h2 className="text-xl font-bold text-primary">Bus Go</h2>}
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

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {/* Back to Home */}
          <Link to="/" className={getLinkClass("/")}>
            <span className="material-symbols-outlined">home</span>
            {sidebarOpen && <span>Trang chủ</span>}
          </Link>

          <div className="my-4">
            <div className={`text-xs font-bold uppercase transition-all ${sidebarOpen ? "px-4 py-2" : "px-2"}`}>
              {sidebarOpen ? user?.role === "driver" ? "Tài xế" : (user?.role === "admin" || (user?.role === "operator" && user?.staffProfileRole === "company_admin")) ? "Công ty" : user?.role === "operator" && user?.staffProfileRole === "dispatcher" ? "Điều hành" : "Quản trị" : ""}
            </div>
          </div>

          {/* Driver Menu */}
          {user?.role === "driver" && (
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
          {(user?.role === "admin" || (user?.role === "operator" && user?.staffProfileRole === "company_admin")) && (
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
          {user?.role === "operator" && user?.staffProfileRole === "dispatcher" && (
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
          {(user?.role === "super_admin" || user?.role === "superadmin") && (
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
    </div>
  );
}
