import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { logout } from "../../api/auth";

const MainNavbar = () => {
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) setUser(JSON.parse(stored));
    } catch (e) {
      console.error("Lỗi parse user:", e);
    }
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error("Lỗi khi đăng xuất:", err);
    }
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setShowUserMenu(false);
    navigate("/");
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-white shadow-editorial">
      <div className="flex justify-between items-center w-full px-6 py-3 max-w-7xl mx-auto">
        <Link to="/" className="flex items-center gap-2">
          <img src="/img/busgo.jpg" alt="BusGo" className="h-10 mix-blend-multiply" />
          <span className="text-xl font-black text-primary tracking-tighter">Bus Go</span>
        </Link>
        <div className="hidden md:flex items-center space-x-8">
          <Link
            to="/"
            className="text-primary font-bold border-b-2 border-primary pb-1"
          >
            Trang chủ
          </Link>
          <a href="/#routes" className="text-gray-600 hover:text-primary transition-colors">
            Lịch trình
          </a>
          <a href="/#partners" className="text-gray-600 hover:text-primary transition-colors">
            Khuyến mãi
          </a>
          <a href="/#footer" className="text-gray-600 hover:text-primary transition-colors">
            Liên hệ
          </a>
        </div>
        {user ? (
          /* === Đã đăng nhập === */
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-xl hover:bg-primary/20 transition-colors"
            >
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-lg">person</span>
              </div>
              <span className="text-on-surface font-semibold text-sm max-w-[120px] truncate">
                {user.fullName || user.username || "User"}
              </span>
              <span className="material-symbols-outlined text-on-surface-variant text-lg">
                {showUserMenu ? "expand_less" : "expand_more"}
              </span>
            </button>
            {showUserMenu && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-lg border border-outline-variant/20 py-2 z-50">
                <div className="px-4 py-3 border-b border-outline-variant/10">
                  <p className="text-sm font-bold text-on-surface truncate">{user.fullName || user.username}</p>
                  <p className="text-xs text-on-surface-variant truncate">{user.email}</p>
                </div>
                {/* Link Admin cho Company Support */}
                {(String(user.role?.name || user.role).toUpperCase().includes('SUPPORT') || String(user.role?.name || user.role).toUpperCase() === 'ADMIN' || String(user.role?.name || user.role).toUpperCase() === 'COMPANY_ADMIN') && (
                  <button
                    onClick={() => { navigate("/company-support/tickets"); setShowUserMenu(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-primary font-bold hover:bg-primary/10 transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">admin_panel_settings</span>
                    Vào trang Quản trị Support
                  </button>
                )}

                <button
                  onClick={() => { navigate("/profile"); setShowUserMenu(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-on-surface hover:bg-surface-container-low transition-colors"
                >
                  <span className="material-symbols-outlined text-lg text-primary">account_circle</span>
                  Hồ sơ cá nhân
                </button>
                <button
                  onClick={() => { navigate("/profile/tickets"); setShowUserMenu(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-on-surface hover:bg-surface-container-low transition-colors"
                >
                  <span className="material-symbols-outlined text-lg text-primary">confirmation_number</span>
                  Vé của tôi
                </button>
                <button
                  onClick={() => { navigate("/profile/coupons"); setShowUserMenu(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-on-surface hover:bg-surface-container-low transition-colors"
                >
                  <span className="material-symbols-outlined text-lg text-secondary">sell</span>
                  Khuyến mãi của tôi
                </button>
                <div className="border-t border-outline-variant/10"></div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">logout</span>
                  Đăng xuất
                </button>
              </div>
            )}
          </div>
        ) : (
          /* === Chưa đăng nhập === */
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-primary font-semibold px-4 py-2 rounded-xl border-2 border-primary hover:bg-primary/5 active:scale-95 transition-all duration-150"
            >
              Đăng nhập
            </Link>
            <Link
              to="/register"
              className="bg-primary text-on-primary px-4 py-2 rounded-xl font-bold hover:bg-primary/90 active:scale-95 transition-all duration-150"
            >
              Đăng ký
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default MainNavbar;
