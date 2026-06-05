import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { logout } from "../../api/auth";
import ChangePasswordCard from "../../components/profile/ChangePasswordCard";
import OperatorProfileCard from "../../components/profile/OperatorProfileCard";
import { clearAuthSession, getStoredUser as getAuthStoredUser } from "../../utils/authStorage";

const sidebarItems = [
{ icon: "confirmation_number", label: "Quản lý vé", path: "/company-support/tickets" },
{ icon: "sell", label: "Mã khuyến mãi", path: "/company-support/coupons" },
{ icon: "person", label: "Hồ sơ", path: "/company-support/profile", active: true }];


const getStoredUser = () => {
  return getAuthStoredUser();
};

export default function SupportProfile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(getStoredUser);

  useEffect(() => {
    const syncUser = () => setUser(getStoredUser());

    window.addEventListener("storage", syncUser);
    window.addEventListener("busgo:user-updated", syncUser);

    return () => {
      window.removeEventListener("storage", syncUser);
      window.removeEventListener("busgo:user-updated", syncUser);
    };
  }, []);

  const handleProfileUpdated = useCallback((profile) => {
    setUser((current) => ({ ...current, ...profile }));
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
    } catch {

    }
    clearAuthSession();
    navigate("/login", { replace: true });
  };

  return (
    <div className="flex min-h-screen bg-surface font-body text-on-surface">
      <aside className="flex w-[260px] shrink-0 flex-col border-r border-surface-container-high bg-white py-6">
        <div className="mb-4 px-4">
          <h1 className="text-lg font-black tracking-tight text-primary">Quản trị nhà xe</h1>
          <p className="mt-1 text-xs font-bold uppercase tracking-wide text-outline">Trung tâm hỗ trợ</p>
        </div>

        <nav className="flex-1">
          {sidebarItems.map((item) =>
          <Link
            key={item.label}
            to={item.path}
            className={`flex items-center gap-3 border-r-4 px-6 py-3 text-sm transition-colors ${
            item.active ?
            "border-primary bg-primary/10 font-extrabold text-primary" :
            "border-transparent font-semibold text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"}`
            }>
            
              <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              {item.label}
            </Link>
          )}
        </nav>

        <div className="border-t border-surface-container-high px-6 pt-4">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-black text-white">
              {(user.fullName || user.username || "U").charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-extrabold text-on-surface">
                {user.fullName || user.username || "Support"}
              </p>
              <p className="text-xs font-semibold text-outline">Nhân viên hỗ trợ</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm font-bold text-outline transition-colors hover:text-primary">
            
            <span className="material-symbols-outlined text-[18px]">logout</span>
            Đăng xuất
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 overflow-auto bg-[#f6f8f5] px-4 py-4 lg:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
            <p className="text-sm font-bold uppercase tracking-wide text-primary">Profile</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-on-surface">Hồ sơ hỗ trợ</h2>
            <p className="mt-2 text-sm font-medium text-on-surface-variant">
              Quản lý thông tin cá nhân, vai trò, mã nhân viên, ngày vào làm, bộ phận và vị trí.
            </p>
            </div>
          </div>

          <div className="space-y-5">
            <OperatorProfileCard roleLabel="Nhân viên hỗ trợ" onProfileUpdated={handleProfileUpdated} />
            <ChangePasswordCard user={user} />
          </div>
        </div>
      </main>
    </div>);

}
