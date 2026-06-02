import React, { useState, useEffect } from "react";
import { Outlet, Link, useNavigate, useLocation, Navigate } from "react-router-dom";
import { logout } from "../../api/auth";
import NotificationBell from "../common/NotificationBell";
import ChatWidget from "../chat/ChatWidget";
import { clearAuthSession, clearStoredUser, getStoredToken, getStoredUser, getStoredUserRaw } from "../../utils/authStorage";

export default function DashboardLayout() {
  const token = getStoredToken();
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const syncStoredUser = () => {
      if (getStoredUserRaw()) {
        setUser(getStoredUser(null));
      } else {
        setUser(null);
      }
    };

    syncStoredUser();
    window.addEventListener("storage", syncStoredUser);
    window.addEventListener("busgo:user-updated", syncStoredUser);

    return () => {
      window.removeEventListener("storage", syncStoredUser);
      window.removeEventListener("busgo:user-updated", syncStoredUser);
    };
  }, []);

  if (!token) {
    clearStoredUser();
    return <Navigate to="/login" replace />;
  }

  const role = String(user?.role || "").replace(/[\s-]+/g, "_").toLowerCase();
  const staffProfileRole = String(user?.staffProfileRole || "").replace(/[\s-]+/g, "_").toLowerCase();
  const isCompanyAdmin = role === "admin" || role === "operator" && ["company_admin", "operator_admin", "admin"].includes(staffProfileRole);
  const isDispatcher = role === "operator" && ["dispatcher", "operator_dispatcher"].includes(staffProfileRole);
  const isSupport = role === "operator" && ["support", "company_support", "operator_support"].includes(staffProfileRole);
  const dashboardHomePath = role === "driver" ?
  "/driver/dashboard" :
  isCompanyAdmin ?
  "/company/dashboard" :
  isSupport ?
  "/company-support/tickets" :
  isDispatcher ?
  "/operator/dashboard" :
  role === "super_admin" || role === "superadmin" ?
  "/super-admin/dashboard" :
  location.pathname || "/";

  const handleLogout = async () => {
    try {
      await logout();
    } catch {

    }
    clearAuthSession();
    navigate("/login", { replace: true });
  };

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + "/");

  const getLinkClass = (path) => {
    const baseClass = sidebarOpen ?
    "group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition-all" :
    "group mx-auto flex h-14 w-14 items-center justify-center rounded-2xl text-sm font-bold transition-all";

    return isActive(path) ?
    `${baseClass} bg-primary text-white shadow-[0_12px_26px_rgba(0,128,43,0.24)]` :
    `${baseClass} text-on-surface-variant hover:bg-white hover:text-on-surface hover:shadow-sm`;
  };

  const sectionLabel = role === "driver" ?
  "Tài xế" :
  isCompanyAdmin ?
  "Công ty" :
  isSupport ?
  "Hỗ trợ" :
  isDispatcher ?
  "Điều hành" :
  "Quản trị";

  const getInitials = (name = "") => {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "BG";
    return parts.slice(-2).map((part) => part[0]).join("").toUpperCase();
  };

  const renderNavLink = (to, icon, label) => {
    const active = isActive(to);

    return (
      <Link key={to} to={to} className={getLinkClass(to)} title={label}>
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors ${
          active ?
          "bg-white/15 text-white" :
          "bg-white/70 text-on-surface-variant group-hover:bg-primary/10 group-hover:text-primary"} ${
          sidebarOpen ? "" : "h-10 w-10"}`}>
          
          <span className="material-symbols-outlined text-[21px] leading-none">{icon}</span>
        </span>
        {sidebarOpen && <span className="truncate">{label}</span>}
      </Link>);

  };

  const showChatWidget = role === "driver" || isCompanyAdmin || isDispatcher;

  return (
    <div className="flex min-h-screen bg-[#f6f8f5]">
      {}
      <aside
        className={`${
        sidebarOpen ? "w-72" : "w-[88px]"} sticky top-0 flex h-screen shrink-0 flex-col border-r border-outline-variant/20 bg-[#eef2ef] shadow-[10px_0_30px_rgba(15,23,42,0.05)] transition-all duration-300`
        }>
        
        {}
        <div className={`${sidebarOpen ? "p-4" : "px-3 py-4"} border-b border-outline-variant/20`}>
          {sidebarOpen ?
          <div className="flex items-center justify-between">
              <Link
              to={dashboardHomePath}
              className="flex min-w-0 items-center gap-3 rounded-xl px-2 py-2 text-primary transition-colors hover:bg-white/70"
              aria-label="Về trang quản trị"
              title="Về trang quản trị">
              
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <span className="material-symbols-outlined text-[25px]">directions_bus</span>
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-xl font-extrabold leading-tight">BusGo</span>
                  <span className="block truncate text-xs font-bold uppercase text-primary/70">{sectionLabel}</span>
                </span>
              </Link>
              <div className="flex items-center gap-1.5">
                <NotificationBell align="left" />
                <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-on-surface-variant transition-all hover:bg-white hover:text-on-surface"
                aria-label="Thu gọn menu"
                title="Thu gọn menu">
                
                  <span className="material-symbols-outlined text-[22px]">menu_open</span>
                </button>
              </div>
            </div> :

          <div className="flex flex-col items-center gap-3">
              <Link
              to={dashboardHomePath}
              className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors hover:bg-white/80"
              aria-label="Về trang quản trị"
              title="Về trang quản trị">
              
                <span className="material-symbols-outlined text-[29px]">directions_bus</span>
              </Link>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/60 text-on-surface-variant">
                <NotificationBell align="left" />
              </div>
              <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white/60 text-on-surface-variant transition-all hover:bg-white hover:text-on-surface"
              aria-label="Mở rộng menu"
              title="Mở rộng menu">
              
                <span className="material-symbols-outlined text-[24px]">menu</span>
              </button>
            </div>
          }
        </div>

        {}
        <nav className={`flex-1 space-y-3 overflow-y-auto ${sidebarOpen ? "p-4" : "px-3 py-5"}`}>
          {sidebarOpen &&
          <div className="pb-2 pt-3">
              <div className="px-3 text-xs font-extrabold uppercase tracking-wide text-on-surface-variant transition-all">
                {sectionLabel}
              </div>
            </div>
          }

          {}
          {role === "driver" &&
          <>
              {renderNavLink("/driver/dashboard", "dashboard", "Bảng điều khiển")}
              {renderNavLink("/driver/profile", "person", "Hồ sơ")}
            </>
          }

          {}
          {isCompanyAdmin &&
          <>
              {renderNavLink("/company/dashboard", "dashboard", "Bảng điều khiển")}
              {renderNavLink("/company/vehicles", "directions_bus", "Phương tiện")}
              {renderNavLink("/company/drivers", "people", "Tài xế")}
              {renderNavLink("/company/staff", "group", "Nhân viên")}
              {renderNavLink("/company/payments", "payments", "Thanh toán")}
              {renderNavLink("/company/profile", "person", "Hồ sơ")}
            </>
          }

          {}
          {isDispatcher &&
          <>
              {renderNavLink("/operator/dashboard", "dashboard", "Bảng điều khiển")}
              {renderNavLink("/operator/routes", "route", "Tuyến đường")}
              {renderNavLink("/operator/stations", "location_on", "Trạm")}
              {renderNavLink("/operator/prices", "local_offer", "Bảng giá")}
              {renderNavLink("/operator/schedules", "schedule", "Lịch biểu")}
              {renderNavLink("/operator/profile", "person", "Hồ sơ")}
            </>
          }

          {}
          {(role === "super_admin" || role === "superadmin") &&
          <>
              {renderNavLink("/super-admin/dashboard", "dashboard", "Bảng điều khiển")}
              {renderNavLink("/super-admin/companies", "business", "Công ty")}
            </>
          }
        </nav>

        {}
        <div className="space-y-3 border-t border-outline-variant/20 p-4">
          {user &&
          <div
            className={`rounded-xl bg-white/70 ring-1 ring-outline-variant/20 ${
            sidebarOpen ? "flex items-center gap-3 p-3" : "flex justify-center p-2"}`
            }>
            
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-extrabold text-primary">
                {getInitials(user.fullName)}
              </div>
              {sidebarOpen &&
            <div className="min-w-0">
                  <p className="truncate text-sm font-extrabold text-on-surface">{user.fullName}</p>
                  <p className="truncate text-xs font-medium text-on-surface-variant">{user.email}</p>
                </div>
            }
            </div>
          }
          <button
            type="button"
            onClick={handleLogout}
            className={`flex w-full items-center justify-center gap-2 rounded-xl bg-red-50 px-3 py-3 text-sm font-bold text-red-700 transition-all hover:bg-red-100 ${
            sidebarOpen ? "" : "px-2"}`
            }
            aria-label="Đăng xuất"
            title="Đăng xuất">
            
            <span className="material-symbols-outlined text-[21px]">logout</span>
            {sidebarOpen && <span>Đăng xuất</span>}
          </button>
        </div>
      </aside>

      {}
      <main className="min-w-0 flex-1 overflow-auto">
{}        <Outlet />
      </main>
      {showChatWidget && <ChatWidget />}
    </div>);

}
