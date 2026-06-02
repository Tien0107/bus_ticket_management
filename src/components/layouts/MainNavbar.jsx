import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { logout } from "../../api/auth";
import NotificationBell from "../common/NotificationBell";

import { getCustomerProfile } from "../../api/customer";
import { clearAuthSession, clearStoredUser, getStoredToken, getStoredUserRaw, setStoredUser } from "../../utils/authStorage";

const MainNavbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const initUser = async () => {
      try {
        const token = getStoredToken();
        if (!token) {
          clearStoredUser();
          setUser(null);
          setShowUserMenu(false);
          return;
        }

        const stored = getStoredUserRaw();
        if (stored) {
          let parsedUser = JSON.parse(stored);


          if (!parsedUser.fullName && (!parsedUser.role || parsedUser.role === 'customer')) {
            try {
              const res = await getCustomerProfile();
              const profileUser = res.data?.user || res.data;
              if (profileUser && profileUser.fullName) {
                parsedUser = { ...parsedUser, ...profileUser };
                setStoredUser(parsedUser);
              }
            } catch (err) {
              console.error("Lỗi lấy profile cho navbar:", err);
            }
          }

          setUser(parsedUser);
        } else {
          setUser(null);
        }
      } catch (e) {
        clearStoredUser();
        setUser(null);
        console.error("Lỗi parse user:", e);
      }
    };

    initUser();

    const handleAuthStateChange = () => {
      initUser();
    };

    window.addEventListener("storage", handleAuthStateChange);
    window.addEventListener("focus", handleAuthStateChange);
    window.addEventListener("pageshow", handleAuthStateChange);
    return () => {
      window.removeEventListener("storage", handleAuthStateChange);
      window.removeEventListener("focus", handleAuthStateChange);
      window.removeEventListener("pageshow", handleAuthStateChange);
    };
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error("Lỗi khi đăng xuất:", err);
    }
    clearAuthSession();
    setUser(null);
    setShowUserMenu(false);
    navigate("/login", { replace: true });
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-white shadow-editorial">
      <div className="flex justify-between items-center w-full px-6 py-3 max-w-7xl mx-auto">
        <Link to="/" className="flex items-center gap-2">
          <img src="/img/busgo.jpg" alt="BusGo" className="h-10 mix-blend-multiply" />
          <span className="text-xl font-black text-primary tracking-tighter">BusGo</span>
        </Link>
        <div className="hidden md:flex items-center space-x-8">
          <Link
            to="/"
            className={`${location.pathname === '/' ? 'text-primary font-bold border-b-2 border-primary pb-1' : 'text-gray-600 hover:text-primary transition-colors'}`}>
            
            Trang chủ
          </Link>
          <Link
            to="/routes"
            className={`${location.pathname === '/routes' ? 'text-primary font-bold border-b-2 border-primary pb-1' : 'text-gray-600 hover:text-primary transition-colors'}`}>
            
            Lịch trình
          </Link>
          <Link
            to="/contact"
            className={`${location.pathname === '/contact' ? 'text-primary font-bold border-b-2 border-primary pb-1' : 'text-gray-600 hover:text-primary transition-colors'}`}>
            
            Liên hệ
          </Link>
        </div>
        {user ? (

        <div className="flex items-center gap-3">
            <NotificationBell />
            <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-xl hover:bg-primary/20 transition-colors">
              
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-lg">person</span>
              </div>
              <span className="text-on-surface font-semibold text-sm max-w-[120px] truncate">
                {user.fullName || user.username || user.name || (user.email ? user.email.split('@')[0] : "User")}
              </span>
              <span className="material-symbols-outlined text-on-surface-variant text-lg">
                {showUserMenu ? "expand_less" : "expand_more"}
              </span>
            </button>
            {showUserMenu &&
            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-lg border border-outline-variant/20 py-2 z-50">
                <div className="px-4 py-3 border-b border-outline-variant/10">
                  <p className="text-sm font-bold text-on-surface truncate">
                    {user.fullName || user.username || user.name || (user.email ? user.email.split('@')[0] : "Người dùng")}
                  </p>
                  <p className="text-xs text-on-surface-variant truncate">{user.email || "Chưa có email"}</p>
                </div>
                {}
                {(String(user.role?.name || user.role).toUpperCase().includes('SUPPORT') || String(user.role?.name || user.role).toUpperCase() === 'ADMIN' || String(user.role?.name || user.role).toUpperCase() === 'COMPANY_ADMIN') &&
              <button
                onClick={() => {navigate("/company-support/tickets");setShowUserMenu(false);}}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-primary font-bold hover:bg-primary/10 transition-colors">
                
                    <span className="material-symbols-outlined text-lg">admin_panel_settings</span>
                    Vào trang Quản trị Support
                  </button>
              }

                <button
                onClick={() => {navigate("/profile");setShowUserMenu(false);}}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-on-surface hover:bg-surface-container-low transition-colors">
                
                  <span className="material-symbols-outlined text-lg text-primary">account_circle</span>
                  Hồ sơ cá nhân
                </button>
                <button
                onClick={() => {navigate("/profile/tickets");setShowUserMenu(false);}}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-on-surface hover:bg-surface-container-low transition-colors">
                
                  <span className="material-symbols-outlined text-lg text-primary">confirmation_number</span>
                  Vé của tôi
                </button>
                <div className="border-t border-outline-variant/10"></div>
                <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors">
                
                  <span className="material-symbols-outlined text-lg">logout</span>
                  Đăng xuất
                </button>
              </div>
            }
          </div>
          </div>) : (


        <div className="flex items-center gap-3">
            <Link
            to="/login"
            className="text-primary font-semibold px-4 py-2 rounded-xl border-2 border-primary hover:bg-primary/5 active:scale-95 transition-all duration-150">
            
              Đăng nhập
            </Link>
            <Link
            to="/register"
            className="bg-primary text-on-primary px-4 py-2 rounded-xl font-bold hover:bg-primary/90 active:scale-95 transition-all duration-150">
            
              Đăng ký
            </Link>
          </div>)
        }
      </div>
    </nav>);

};

export default MainNavbar;
