import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getCompanies } from "../api/public";
import { getTripSchedules } from "../api/customer";
import { logout } from "../api/auth";

// Data features
const features = [
  {
    icon: "confirmation_number",
    title: "Đặt vé dễ dàng",
    desc: "Chỉ với 3 bước đơn giản, bạn đã sở hữu ngay tấm vé cho hành trình của mình.",
  },
  {
    icon: "sell",
    title: "Giá tốt nhất",
    desc: "Cam kết giá vé minh bạch, không phụ phí ẩn, luôn cập nhật ưu đãi hấp dẫn nhất.",
  },
  {
    icon: "directions_bus",
    title: "Nhiều nhà xe",
    desc: "Hợp tác với hơn 500 nhà xe uy tín trên toàn quốc, đảm bảo chất lượng dịch vụ.",
  },
  {
    icon: "support_agent",
    title: "Hỗ trợ 24/7",
    desc: "Đội ngũ chăm sóc khách hàng luôn sẵn sàng giải đáp mọi thắc mắc của bạn.",
  },
];



const Home = () => {
  const navigate = useNavigate();
  const [departure, setDeparture] = useState("");
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Search states
  const [schedules, setSchedules] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [searchInitiated, setSearchInitiated] = useState(false);

  const handleSearch = async () => {
    if (!departure.trim() || !destination.trim() || !date) {
      setSearchInitiated(true);
      setSearchError("Vui lòng nhập đầy đủ Điểm đi, Điểm đến và Ngày đi trước khi tìm kiếm.");
      setSchedules([]);
      return;
    }

    setSearchInitiated(true);
    setLoadingSearch(true);
    setSearchError(null);
    try {
      const response = await getTripSchedules({
        from: departure.trim(),
        to: destination.trim(),
        date: date,
        limit: 10,
        orderBy: "asc"
      });
      const data = response.data?.trip || [];
      setSchedules(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Lỗi tìm chuyến:", err);
      if (err.response?.status === 401) {
         setSearchError("Vui lòng Đăng nhập ở góc trên bên phải để tìm và đặt vé.");
      } else {
         setSearchError("Không thể tìm chuyến. Vui lòng thử lại sau.");
      }
    } finally {
      setLoadingSearch(false);
    }
  };

  // Lấy user từ localStorage
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

  // State cho danh sách nhà xe từ API
  const [companies, setCompanies] = useState([]);
  const [companiesLoading, setCompaniesLoading] = useState(true);
  const [companiesError, setCompaniesError] = useState(null);

  // Fetch danh sách nhà xe khi component mount
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        setCompaniesLoading(true);
        const response = await getCompanies({ limit: 10 });
        // API trả về object có chứa mảng companies
        const data = response.data?.companies || response.data?.data || [];
        setCompanies(Array.isArray(data) ? data : []);
        setCompaniesError(null);
      } catch (err) {
        console.error("Lỗi khi lấy danh sách nhà xe:", err);
        setCompaniesError("Không thể tải danh sách nhà xe. Vui lòng thử lại sau.");
      } finally {
        setCompaniesLoading(false);
      }
    };
    fetchCompanies();
  }, []);

  return (
    <div className="min-h-screen bg-surface text-on-surface font-body">
      {/* ===== HEADER / NAVIGATION ===== */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl shadow-editorial">
        <div className="flex justify-between items-center w-full px-6 py-4 max-w-7xl mx-auto">
          <Link to="/" className="text-2xl font-black text-primary tracking-tighter">
            BusGo
          </Link>
          <div className="hidden md:flex items-center space-x-8">
            <Link
              to="/"
              className="text-primary font-bold border-b-2 border-primary pb-1"
            >
              Trang chủ
            </Link>
            <a href="#routes" className="text-gray-600 hover:text-primary transition-colors">
              Lịch trình
            </a>
            <a href="#partners" className="text-gray-600 hover:text-primary transition-colors">
              Khuyến mãi
            </a>
            <a href="#footer" className="text-gray-600 hover:text-primary transition-colors">
              Liên hệ
            </a>
          </div>
          {user ? (
            /* === Đã đăng nhập === */
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 bg-primary/10 px-4 py-2.5 rounded-xl hover:bg-primary/20 transition-colors"
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
                    onClick={() => { navigate("/my-tickets"); setShowUserMenu(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-on-surface hover:bg-surface-container-low transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg text-primary">confirmation_number</span>
                    Vé của tôi
                  </button>
                  <button
                    onClick={() => { navigate("/my-coupons"); setShowUserMenu(false); }}
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
                className="text-primary font-semibold px-5 py-2.5 rounded-xl border-2 border-primary hover:bg-primary/5 active:scale-95 transition-all duration-150"
              >
                Đăng nhập
              </Link>
              <Link
                to="/register"
                className="bg-primary text-on-primary px-5 py-2.5 rounded-xl font-bold hover:bg-primary/90 active:scale-95 transition-all duration-150"
              >
                Đăng ký
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* ===== HERO SECTION ===== */}
      <section className="relative pt-24 pb-20 md:pt-40 md:pb-32 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            className="w-full h-full object-cover brightness-[0.85] contrast-110"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBUW9fcNHX9pJbSgTmqbunSj6ZQqKjEwUpfI8Wri_yw5tVnFkItbM99NAD0OkfkttqjglTOioq63afj0esnJvPsa8uU_lTSgzF4YI5TOIpLdaGcMRv-5EL3NWLhyopk08be1Bf7s9VgST1xIh_OUqOUXyzZvVyMDmROOWlzlkr5KiZdc4JA5Rvkdc8aVohFAA_dr1NCElixZrLP9B1aV5G1eWu--jIQyjTEayCN4ADLucbSseXHFcqnwwfZRWvOh3Gz89DK9eKpt8A"
            alt="Xe khách đi qua cung đường đẹp Việt Nam"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Hero Text */}
          <div className="lg:col-span-7">
            <h1 className="text-white text-5xl md:text-7xl font-black tracking-tight leading-[1.1] mb-6">
              Đặt vé xe khách <br />
              <span className="text-primary-fixed">trực tuyến</span>
            </h1>
            <p className="text-white/90 text-lg md:text-xl font-medium leading-relaxed max-w-xl">
              Tìm và đặt vé xe nhanh chóng, tiện lợi, giá tốt nhất cho hành
              trình khám phá Việt Nam của bạn.
            </p>
          </div>

          {/* Search Form */}
          <div className="lg:col-span-5">
            <div className="bg-white p-8 rounded-3xl shadow-editorial">
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4">
                  {/* Điểm đi */}
                  <div>
                    <label className="text-[0.7rem] font-bold uppercase tracking-wider text-outline mb-1 block">
                      Điểm đi
                    </label>
                    <div className="flex items-center bg-surface-container-low px-4 py-3 rounded-xl focus-within:ring-2 ring-primary/20 transition-all">
                      <span className="material-symbols-outlined text-primary mr-3">
                        location_on
                      </span>
                      <input
                        className="bg-transparent border-none p-0 focus:ring-0 focus:outline-none text-on-surface w-full placeholder:text-outline-variant font-medium"
                        placeholder="Thành phố xuất phát"
                        type="text"
                        value={departure}
                        onChange={(e) => setDeparture(e.target.value)}
                      />
                    </div>
                  </div>
                  {/* Điểm đến */}
                  <div>
                    <label className="text-[0.7rem] font-bold uppercase tracking-wider text-outline mb-1 block">
                      Điểm đến
                    </label>
                    <div className="flex items-center bg-surface-container-low px-4 py-3 rounded-xl focus-within:ring-2 ring-primary/20 transition-all">
                      <span className="material-symbols-outlined text-primary mr-3">
                        flag
                      </span>
                      <input
                        className="bg-transparent border-none p-0 focus:ring-0 focus:outline-none text-on-surface w-full placeholder:text-outline-variant font-medium"
                        placeholder="Thành phố đến"
                        type="text"
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Ngày đi */}
                  <div>
                    <label className="text-[0.7rem] font-bold uppercase tracking-wider text-outline mb-1 block">
                      Ngày đi
                    </label>
                    <div className="flex items-center bg-surface-container-low px-4 py-3 rounded-xl">
                      <span className="material-symbols-outlined text-primary mr-3">
                        calendar_today
                      </span>
                      <input
                        className="bg-transparent border-none p-0 focus:ring-0 focus:outline-none text-on-surface w-full placeholder:text-outline-variant font-medium"
                        placeholder="Chọn ngày"
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                      />
                    </div>
                  </div>
                  {/* Số lượng */}
                  <div>
                    <label className="text-[0.7rem] font-bold uppercase tracking-wider text-outline mb-1 block">
                      Số lượng
                    </label>
                    <div className="flex items-center bg-surface-container-low px-4 py-3 rounded-xl">
                      <span className="material-symbols-outlined text-primary mr-3">
                        person
                      </span>
                      <input
                        className="bg-transparent border-none p-0 focus:ring-0 focus:outline-none text-on-surface w-full font-medium"
                        type="number"
                        min="1"
                        max="10"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleSearch}
                  disabled={loadingSearch}
                  className="w-full bg-primary-container text-on-primary-container py-4 rounded-xl font-extrabold text-lg flex justify-center items-center gap-2 hover:bg-primary hover:text-on-primary transition-colors disabled:opacity-50">
                  <span>{loadingSearch ? "Đang tìm..." : "Tìm chuyến"}</span>
                  {!loadingSearch && <span className="material-symbols-outlined">arrow_forward</span>}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== KẾT QUẢ TÌM KIẾM ===== */}
      {searchInitiated && (
        <section id="search-results" className="py-16 bg-surface">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-3xl font-black text-on-surface mb-8">Kết quả tìm kiếm</h2>
            
            {loadingSearch && (
              <div className="flex justify-center items-center py-10">
                <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
              </div>
            )}
            
            {searchError && !loadingSearch && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl text-center">
                {searchError}
              </div>
            )}

            {!loadingSearch && !searchError && schedules.length === 0 && (
              <div className="text-center py-10 text-on-surface-variant font-medium">
                <span className="material-symbols-outlined text-4xl block mb-2 opacity-50">sentiment_dissatisfied</span>
                Không tìm thấy chuyến xe nào phù hợp. Vui lòng thử thay đổi điểm đi/đến hoặc ngày đi.
              </div>
            )}

            {!loadingSearch && !searchError && schedules.length > 0 && (
              <div className="space-y-4">
                {schedules.map((schedule, idx) => (
                  <div key={schedule.id || idx} className="bg-white border text-left border-outline-variant/20 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex-1 w-full">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          {schedule.logoUrl ? (
                            <img src={schedule.logoUrl} alt="Logo" className="w-10 h-10 rounded-lg object-contain border border-outline-variant/20" />
                          ) : (
                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                              <span className="material-symbols-outlined text-primary">directions_bus</span>
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-on-surface">{schedule.name || "Chuyến xe"}</p>
                            <p className="text-xs text-on-surface-variant flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">call</span> {schedule.hotline || "Đang cập nhật"}</p>
                          </div>
                        </div>
                        <span className="px-2.5 py-1 bg-surface-container text-on-surface-variant text-xs font-bold rounded-md uppercase">
                           {schedule.distanceKm ? `${schedule.distanceKm} km` : ""}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-4 relative">
                        {/* Điểm đi */}
                        <div className="flex-1">
                          <p className="font-extrabold text-xl text-on-surface text-primary">{schedule.departureTime ? schedule.departureTime.slice(0,5) : "??:??"}</p>
                          <p className="text-sm text-on-surface-variant font-medium mt-1">{schedule.fromLocation || departure || "Điểm đi"}</p>
                        </div>
                        {/* Thanh nối lộ trình */}
                        <div className="flex-1 flex flex-col items-center px-4 relative">
                           <p className="text-xs text-outline mb-1">{schedule.durationMinutes ? `${Math.floor(schedule.durationMinutes/60)}h ${schedule.durationMinutes%60}m` : "Di chuyển"}</p>
                           <div className="w-full h-0.5 bg-outline-variant/30 flex items-center justify-center relative">
                             <div className="absolute w-2 h-2 rounded-full bg-outline-variant -left-1"></div>
                             <div className="absolute w-2 h-2 rounded-full border-2 border-outline-variant bg-white -right-1"></div>
                           </div>
                        </div>
                        {/* Điểm đến */}
                        <div className="flex-1 text-right">
                          <p className="font-extrabold text-xl text-on-surface text-primary">
                            {(() => {
                               if (!schedule.departureTime || !schedule.durationMinutes) return "--:--";
                               let [h, m] = schedule.departureTime.split(":").map(Number);
                               if (isNaN(h) || isNaN(m)) return "--:--";
                               let d = new Date(); d.setHours(h); d.setMinutes(m + schedule.durationMinutes);
                               return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
                            })()}
                          </p>
                          <p className="text-sm text-on-surface-variant font-medium mt-1">{schedule.toLocation || destination || "Điểm đến"}</p>
                        </div>
                      </div>
                    </div>
                    
                       <Link 
                         to={`/booking/${schedule.id || ''}`} 
                         state={{ 
                           schedule: schedule, 
                           companyId: schedule.company?.id || schedule.companyId, 
                           date: date 
                         }} 
                         className="w-full md:w-auto md:px-10 shrink-0 text-center bg-secondary-container text-on-secondary-container py-2.5 px-6 rounded-xl font-bold hover:bg-secondary hover:text-white transition-colors">
                         Chọn vé
                       </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ===== WHY CHOOSE US ===== */}
      <section className="bg-surface-container-low py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-16">
            <h2 className="text-3xl font-black text-on-surface mb-2">
              Tại sao chọn BusGo?
            </h2>
            <div className="w-20 h-1.5 bg-primary-container rounded-full"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((f, i) => (
              <div
                key={i}
                className="bg-white p-8 rounded-3xl shadow-editorial hover:-translate-y-2 transition-transform duration-300"
              >
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-primary text-3xl">
                    {f.icon}
                  </span>
                </div>
                <h3 className="text-xl font-bold mb-3">{f.title}</h3>
                <p className="text-on-surface-variant leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>



      {/* ===== DANH SÁCH NHÀ XE TỪ API ===== */}
      <section id="partners" className="py-24 bg-surface-container-low">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-12">
            <h2 className="text-3xl font-black text-on-surface mb-2">
              Nhà xe đối tác
            </h2>
            <p className="text-on-surface-variant">
              Các nhà xe uy tín hợp tác với BusGo
            </p>
            <div className="w-20 h-1.5 bg-primary-container rounded-full mt-2"></div>
          </div>

          {/* Loading State */}
          {companiesLoading && (
            <div className="flex justify-center items-center py-16">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                <p className="text-on-surface-variant font-medium">Đang tải danh sách nhà xe...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {companiesError && !companiesLoading && (
            <div className="flex justify-center items-center py-16">
              <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center max-w-md">
                <span className="material-symbols-outlined text-red-500 text-4xl mb-3 block">error</span>
                <p className="text-red-600 font-medium mb-4">{companiesError}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="bg-primary text-on-primary px-6 py-2 rounded-xl font-bold hover:bg-primary/90 transition-colors"
                >
                  Thử lại
                </button>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!companiesLoading && !companiesError && companies.length === 0 && (
            <div className="flex justify-center items-center py-16">
              <div className="text-center">
                <span className="material-symbols-outlined text-on-surface-variant text-5xl mb-3 block">directions_bus</span>
                <p className="text-on-surface-variant font-medium">Chưa có nhà xe nào.</p>
              </div>
            </div>
          )}

          {/* Companies Grid */}
          {!companiesLoading && !companiesError && companies.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {companies.map((company) => (
                <div
                  key={company.id || company._id}
                  className="bg-white p-6 rounded-3xl shadow-editorial hover:-translate-y-1 hover:shadow-lg transition-all duration-300 flex items-center gap-4"
                >
                  {/* Company Avatar */}
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                    {company.logo ? (
                      <img
                        src={company.logo}
                        alt={company.name}
                        className="w-12 h-12 object-contain rounded-lg"
                      />
                    ) : (
                      <span className="material-symbols-outlined text-primary text-3xl">
                        directions_bus
                      </span>
                    )}
                  </div>

                  {/* Company Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-on-surface truncate">
                      {company.name || company.company_name || "Nhà xe"}
                    </h3>
                    {(company.phone || company.phone_number) && (
                      <p className="text-on-surface-variant text-sm flex items-center gap-1 mt-1">
                        <span className="material-symbols-outlined text-sm">call</span>
                        {company.phone || company.phone_number}
                      </p>
                    )}
                    {company.email && (
                      <p className="text-on-surface-variant text-sm flex items-center gap-1 mt-0.5 truncate">
                        <span className="material-symbols-outlined text-sm">mail</span>
                        {company.email}
                      </p>
                    )}
                    {company.address && (
                      <p className="text-on-surface-variant text-sm flex items-center gap-1 mt-0.5 truncate">
                        <span className="material-symbols-outlined text-sm">location_on</span>
                        {company.address}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer id="footer" className="w-full rounded-t-3xl mt-20 bg-gray-50">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 px-8 py-16 max-w-7xl mx-auto text-sm leading-6">
          {/* Brand */}
          <div>
            <div className="text-xl font-bold text-primary mb-6">BusGo</div>
            <p className="text-gray-500 mb-6">
              Nền tảng đặt vé xe khách trực tuyến hàng đầu Việt Nam, giúp bạn
              kết nối với hàng nghìn hành trình mỗi ngày.
            </p>
            <div className="flex space-x-4">
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all"
              >
                <span className="material-symbols-outlined">public</span>
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all"
              >
                <span className="material-symbols-outlined">phone</span>
              </a>
            </div>
          </div>

          {/* Dịch vụ */}
          <div>
            <h4 className="font-bold text-on-surface mb-6">Dịch vụ</h4>
            <ul className="space-y-4">
              <li>
                <a href="#" className="text-gray-500 hover:text-secondary transition-colors">
                  Về chúng tôi
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-500 hover:text-secondary transition-colors">
                  Đăng ký nhà xe
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-500 hover:text-secondary transition-colors">
                  Hướng dẫn đặt vé
                </a>
              </li>
            </ul>
          </div>

          {/* Pháp lý */}
          <div>
            <h4 className="font-bold text-on-surface mb-6">Pháp lý</h4>
            <ul className="space-y-4">
              <li>
                <a href="#" className="text-gray-500 hover:text-secondary transition-colors">
                  Điều khoản
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-500 hover:text-secondary transition-colors">
                  Chính sách
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-500 hover:text-secondary transition-colors">
                  Hỗ trợ
                </a>
              </li>
            </ul>
          </div>

          {/* Liên hệ */}
          <div>
            <h4 className="font-bold text-on-surface mb-6">Liên hệ</h4>
            <ul className="space-y-4 text-gray-500">
              <li className="flex items-start gap-3">
                <span className="material-symbols-outlined text-primary">mail</span>
                <span>hotro@busgo.vn</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="material-symbols-outlined text-primary">call</span>
                <span>1900 6789</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="material-symbols-outlined text-primary">location_on</span>
                <span>Số 123, Đường Lê Lợi, Quận 1, TP. HCM</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="max-w-7xl mx-auto px-8 pb-12 border-t border-outline-variant/20 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm">
            © 2024 BusGo. Tất cả quyền được bảo lưu.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
