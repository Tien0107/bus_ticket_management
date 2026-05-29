import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getCompanies, getPromotions } from "../api/public";
import { getTripSchedules, getTripScheduleRatings } from "../api/customer";
import LocationDropdown from "../components/common/LocationDropdown";
import CompanyReviewsModal from "../components/reviews/CompanyReviewsModal";
import PromotionModal from "../components/promotions/PromotionModal";


const features = [
{
  icon: "confirmation_number",
  title: "Đặt vé dễ dàng",
  desc: "Chỉ với 3 bước đơn giản, bạn đã sở hữu ngay tấm vé cho hành trình của mình."
},
{
  icon: "sell",
  title: "Giá tốt nhất",
  desc: "Cam kết giá vé minh bạch, không phụ phí ẩn, luôn cập nhật ưu đãi hấp dẫn nhất."
},
{
  icon: "directions_bus",
  title: "Nhiều nhà xe",
  desc: "Hợp tác với hơn 500 nhà xe uy tín trên toàn quốc, đảm bảo chất lượng dịch vụ."
},
{
  icon: "support_agent",
  title: "Hỗ trợ 24/7",
  desc: "Đội ngũ chăm sóc khách hàng luôn sẵn sàng giải đáp mọi thắc mắc của bạn."
}];



const fallbackPromoImages = [
"/images/real_promo_flash_1778469351380.png",
"/images/real_promo_route_1778469366193.png",
"/images/real_promo_referral_1778469381670.png",
"/images/real_promo_summer_1778469397468.png",
"/images/real_promo_payment_1778469409783.png"];


const getTodayInputValue = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const isDateBeforeToday = (value) => Boolean(value) && value < getTodayInputValue();

const Home = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const todayInputValue = getTodayInputValue();
  const [departure, setDeparture] = useState("");
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState(todayInputValue);
  const [tripType] = useState("one_way");
  const [returnDate] = useState("");
  const [swapAnimating, setSwapAnimating] = useState(false);


  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedCompanyForReview, setSelectedCompanyForReview] = useState(null);


  const [selectedPromotion, setSelectedPromotion] = useState(null);

  const openReviewModal = (company, e) => {
    e.stopPropagation();
    setSelectedCompanyForReview({
      id: company.id || company._id,
      name: company.name || company.company_name
    });
    setIsReviewModalOpen(true);
  };


  const [schedules, setSchedules] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [searchInitiated, setSearchInitiated] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    const state = location.state || {};
    if (state.from) setDeparture(state.from);
    if (state.to) setDestination(state.to);
    if (state.date) setDate(isDateBeforeToday(state.date) ? todayInputValue : state.date);
  }, [location.state, todayInputValue]);

  const handleDateChange = (value) => {
    setDate(!value || isDateBeforeToday(value) ? todayInputValue : value);
  };

  const handleSwapLocations = () => {
    if (!departure && !destination) return;

    setSwapAnimating(true);
    setDeparture(destination);
    setDestination(departure);
    window.setTimeout(() => setSwapAnimating(false), 260);
  };

  const fetchSchedules = async (currentPage, isLoadMore = false) => {
    try {
      if (!isLoadMore) {
        setLoadingSearch(true);
        setSearchError(null);
      } else {
        setLoadingMore(true);
      }

      const response = await getTripSchedules({
        from: departure.trim(),
        to: destination.trim(),
        date: isDateBeforeToday(date) ? todayInputValue : date,
        limit: 10,
        page: currentPage,
        orderBy: "asc"
      });

      const data = response.data?.trip || [];
      const dataArray = Array.isArray(data) ? data : [];

      if (!isLoadMore) {
        setSchedules(dataArray);
      } else {
        setSchedules((prev) => [...prev, ...dataArray]);
      }

      setHasMore(dataArray.length === 10);
    } catch (err) {
      console.error("Lỗi tìm chuyến:", err);
      if (!isLoadMore) {
        if (err.response?.status === 401) {
          setSearchError("Vui lòng Đăng nhập ở góc trên bên phải để tìm và đặt vé.");
        } else {
          setSearchError("Không thể tìm chuyến. Vui lòng thử lại sau.");
        }
        setSchedules([]);
      }
    } finally {
      setLoadingSearch(false);
      setLoadingMore(false);
    }
  };

  const handleSearch = () => {
    const searchDate = isDateBeforeToday(date) ? todayInputValue : date;

    if (!departure.trim() || !destination.trim() || !searchDate) {
      setSearchInitiated(true);
      setSearchError("Vui lòng nhập đầy đủ Điểm đi, Điểm đến và Ngày đi trước khi tìm kiếm.");
      setSchedules([]);
      return;
    }

    if (searchDate !== date) {
      setDate(searchDate);
    }

    if (tripType === "round_trip" && !returnDate) {
      setSearchInitiated(true);
      setSearchError("Vui lòng chọn ngày về cho chuyến khứ hồi.");
      setSchedules([]);
      return;
    }

    setSearchInitiated(true);
    setPage(1);
    fetchSchedules(1, false);
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchSchedules(nextPage, true);
  };




  const [companies, setCompanies] = useState([]);
  const [companiesLoading, setCompaniesLoading] = useState(true);
  const [companiesError, setCompaniesError] = useState(null);

  const [popularRoutes, setPopularRoutes] = useState([]);
  const [loadingPopular, setLoadingPopular] = useState(false);


  const [promotions, setPromotions] = useState([]);
  const [promotionsLoading, setPromotionsLoading] = useState(true);
  const [promotionsError, setPromotionsError] = useState(null);


  useEffect(() => {
    const fetchHomeData = async () => {

      try {
        setCompaniesLoading(true);
        const response = await getCompanies({ limit: 10 });
        const data = response.data?.companies || response.data?.data || [];
        const baseCompanies = Array.isArray(data) ? data : [];


        const companiesWithRatings = await Promise.all(
          baseCompanies.map(async (company) => {
            try {
              const res = await getTripScheduleRatings({ companyId: company.id || company._id, limit: 100 });
              const comments = res.data?.comments || [];
              if (comments.length === 0) return { ...company, rating: 0, totalReviews: 0 };

              let sum = 0;
              comments.forEach((c) => sum += c.rating || 5);
              return {
                ...company,
                rating: sum / comments.length,
                totalReviews: comments.length
              };
            } catch (err) {
              return { ...company, rating: 0, totalReviews: 0 };
            }
          })
        );

        setCompanies(companiesWithRatings);
        setCompaniesError(null);
      } catch (err) {
        console.error("Lỗi khi lấy danh sách nhà xe:", err);
        setCompaniesError("Không thể tải danh sách nhà xe. Vui lòng thử lại sau.");
      } finally {
        setCompaniesLoading(false);
      }


      try {
        setLoadingPopular(true);
        const tripRes = await getTripSchedules({ limit: 50, orderBy: "asc" });
        const trips = tripRes.data?.trip || [];
        if (Array.isArray(trips) && trips.length > 0) {
          const routesMap = new Map();
          trips.forEach((trip) => {
            if (!trip.fromLocation || !trip.toLocation) return;
            const key = `${trip.fromLocation}-${trip.toLocation}`;
            if (!routesMap.has(key)) {
              routesMap.set(key, {
                id: trip.id,
                from: trip.fromLocation,
                to: trip.toLocation,
                title: `${trip.fromLocation} ➔ ${trip.toLocation}`,
                image: `https://picsum.photos/seed/${encodeURIComponent(key)}/800/1000`,
                price: trip.price ? `Từ ${trip.price.toLocaleString('vi-VN')}đ` : "Từ 150.000đ",
                duration: trip.durationMinutes ? `Khoảng ${Math.floor(trip.durationMinutes / 60)}h ${trip.durationMinutes % 60}m` : "Khoảng 2-3 giờ"
              });
            }
          });
          setPopularRoutes(Array.from(routesMap.values()).slice(0, 4));
        } else {
          throw new Error("No trips found");
        }
      } catch (err) {
        console.error("Lỗi tải tuyến đường phổ biến (hoặc do chưa đăng nhập):", err);

        setPopularRoutes([
        { id: 1, from: "Hà Nội", to: "Sapa", title: "Hà Nội ➔ Sapa", image: "https://picsum.photos/seed/hn-sp/800/1000", price: "Từ 250.000đ", duration: "Khoảng 6 giờ" },
        { id: 2, from: "TP. Hồ Chí Minh", to: "Đà Lạt", title: "TP. Hồ Chí Minh ➔ Đà Lạt", image: "https://picsum.photos/seed/hcm-dl/800/1000", price: "Từ 300.000đ", duration: "Khoảng 8 giờ" },
        { id: 3, from: "Đà Nẵng", to: "Hội An", title: "Đà Nẵng ➔ Hội An", image: "https://picsum.photos/seed/dn-ha/800/1000", price: "Từ 100.000đ", duration: "Khoảng 1 giờ" },
        { id: 4, from: "Hà Nội", to: "Hải Phòng", title: "Hà Nội ➔ Hải Phòng", image: "https://picsum.photos/seed/hn-hp/800/1000", price: "Từ 120.000đ", duration: "Khoảng 2 giờ" }]
        );
      } finally {
        setLoadingPopular(false);
      }


      try {
        setPromotionsLoading(true);

        const promoRes = await getPromotions({ limit: 10 });
        const items = promoRes.data?.items || promoRes.data?.data || [];
        setPromotions(Array.isArray(items) ? items : []);
        setPromotionsError(null);
      } catch (err) {
        console.error("Lỗi khi tải danh sách khuyến mãi:", err);
        setPromotionsError("Không thể tải danh sách khuyến mãi.");
      } finally {
        setPromotionsLoading(false);
      }
    };
    fetchHomeData();
  }, []);

  const handleSelectPopularRoute = async (from, to) => {
    setDeparture(from);
    setDestination(to);


    const searchDate = date && !isDateBeforeToday(date) ? date : todayInputValue;
    setDate(searchDate);

    setSearchInitiated(true);
    setLoadingSearch(true);
    setSearchError(null);
    setPage(1);


    window.scrollTo({ top: 300, behavior: 'smooth' });

    try {
      const response = await getTripSchedules({
        from: from,
        to: to,
        date: searchDate,
        limit: 10,
        page: 1,
        orderBy: "asc"
      });
      const data = response.data?.trip || [];
      const dataArray = Array.isArray(data) ? data : [];
      setSchedules(dataArray);
      setHasMore(dataArray.length === 10);


      setTimeout(() => {
        const el = document.getElementById("search-results");
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
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

  return (
    <div className="min-h-screen bg-surface text-on-surface font-body">

      {}
      <section className="relative pt-24 pb-20 md:pt-40 md:pb-32 overflow-hidden">
        {}
        <div className="absolute inset-0 z-0">
          <img
            className="w-full h-full object-cover brightness-[0.85] contrast-110"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBUW9fcNHX9pJbSgTmqbunSj6ZQqKjEwUpfI8Wri_yw5tVnFkItbM99NAD0OkfkttqjglTOioq63afj0esnJvPsa8uU_lTSgzF4YI5TOIpLdaGcMRv-5EL3NWLhyopk08be1Bf7s9VgST1xIh_OUqOUXyzZvVyMDmROOWlzlkr5KiZdc4JA5Rvkdc8aVohFAA_dr1NCElixZrLP9B1aV5G1eWu--jIQyjTEayCN4ADLucbSseXHFcqnwwfZRWvOh3Gz89DK9eKpt8A"
            alt="Xe khách đi qua cung đường đẹp Việt Nam" />
          
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {}
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

          {}
          <div className="lg:col-span-5">
            <div className="bg-white p-8 rounded-3xl shadow-editorial">
              <div className="space-y-6">
                {}

                <div className="relative space-y-4">
                  {}
                  <div className={`transition-all duration-300 ${swapAnimating ? "translate-y-1 opacity-80" : ""}`}>
                    <label className="text-[0.7rem] font-bold uppercase tracking-wider text-outline mb-1 block">
                      Điểm đi
                    </label>
                    <LocationDropdown
                      value={departure}
                      onChange={setDeparture}
                      placeholder="Thành phố xuất phát"
                      icon="location_on" />
                    
                  </div>

                  {}
                  <div className={`transition-all duration-300 ${swapAnimating ? "-translate-y-1 opacity-80" : ""}`}>
                    <label className="text-[0.7rem] font-bold uppercase tracking-wider text-outline mb-1 block">
                      Điểm đến
                    </label>
                    <LocationDropdown
                      value={destination}
                      onChange={setDestination}
                      placeholder="Thành phố đến"
                      icon="flag" />
                    
                  </div>

                  <button
                    type="button"
                    onClick={handleSwapLocations}
                    disabled={!departure && !destination}
                    className="group absolute right-4 top-1/2 z-20 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-outline-variant/40 bg-white text-primary shadow-[0_10px_24px_rgba(15,23,42,0.14)] transition-all duration-300 hover:scale-105 hover:border-primary/40 hover:bg-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100 disabled:hover:bg-white disabled:hover:text-primary"
                    aria-label="Đổi chiều điểm đi và điểm đến"
                    title="Đổi chiều">
                    
                    <span className={`material-symbols-outlined text-[23px] transition-transform duration-300 ${swapAnimating ? "rotate-180" : ""}`}>
                      swap_vert
                    </span>
                  </button>
                </div>

                {}
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="text-[0.7rem] font-bold uppercase tracking-wider text-outline mb-1 block">
                      Ngày đi
                    </label>
                    <div className="flex min-h-[58px] items-center bg-surface-container-low px-4 py-3 rounded-xl">
                      <span className="material-symbols-outlined text-primary mr-3">
                        calendar_today
                      </span>
                      <input
                        className="bg-transparent border-none p-0 focus:ring-0 focus:outline-none text-on-surface w-full placeholder:text-outline-variant font-medium text-sm"
                        placeholder="Chọn ngày đi"
                        type="date"
                        min={todayInputValue}
                        value={date}
                        onChange={(e) => handleDateChange(e.target.value)} />
                      
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

      {}
      {searchInitiated &&
      <section id="search-results" className="py-16 bg-surface">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-3xl font-black text-on-surface mb-8">Kết quả tìm kiếm</h2>

            {loadingSearch &&
          <div className="flex justify-center items-center py-10">
                <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
              </div>
          }

            {searchError && !loadingSearch &&
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-center">
                {searchError}
              </div>
          }

            {!loadingSearch && !searchError && schedules.length === 0 &&
          <div className="text-center py-10 text-on-surface-variant font-medium">
                <span className="material-symbols-outlined text-4xl block mb-2 opacity-50">sentiment_dissatisfied</span>
                Không tìm thấy chuyến xe nào phù hợp. Vui lòng thử thay đổi điểm đi/đến hoặc ngày đi.
              </div>
          }

            {!loadingSearch && !searchError && schedules.length > 0 &&
          <div className="space-y-4">
                {schedules.map((schedule, idx) =>
            <div key={schedule.id || idx} className="bg-white border text-left border-outline-variant/20 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex-1 w-full">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          {schedule.logoUrl ?
                    <img src={schedule.logoUrl} alt="Logo" className="w-10 h-10 rounded-lg object-contain border border-outline-variant/20" /> :

                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                              <span className="material-symbols-outlined text-primary">directions_bus</span>
                            </div>
                    }
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
                        {}
                        <div className="flex-1">
                          <p className="font-extrabold text-xl text-on-surface text-primary">{schedule.departureTime ? schedule.departureTime.slice(0, 5) : "??:??"}</p>
                          <p className="text-sm text-on-surface-variant font-medium mt-1">{schedule.fromLocation || departure || "Điểm đi"}</p>
                        </div>
                        {}
                        <div className="flex-1 flex flex-col items-center px-4 relative">
                          <p className="text-xs text-outline mb-1">{schedule.durationMinutes ? `${Math.floor(schedule.durationMinutes / 60)}h ${schedule.durationMinutes % 60}m` : "Di chuyển"}</p>
                          <div className="w-full h-0.5 bg-outline-variant/30 flex items-center justify-center relative">
                            <div className="absolute w-2 h-2 rounded-full bg-outline-variant -left-1"></div>
                            <div className="absolute w-2 h-2 rounded-full border-2 border-outline-variant bg-white -right-1"></div>
                          </div>
                        </div>
                        {}
                        <div className="flex-1 text-right">
                          <p className="font-extrabold text-xl text-on-surface text-primary">
                            {(() => {
                        if (!schedule.departureTime || !schedule.durationMinutes) return "--:--";
                        let [h, m] = schedule.departureTime.split(":").map(Number);
                        if (isNaN(h) || isNaN(m)) return "--:--";
                        let d = new Date();d.setHours(h);d.setMinutes(m + schedule.durationMinutes);
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
                  date: date,
                  isRoundTrip: tripType === "round_trip",
                  returnDate: returnDate
                }}
                className="w-full md:w-auto md:px-10 shrink-0 text-center bg-secondary-container text-on-secondary-container py-2.5 px-6 rounded-xl font-bold hover:bg-secondary hover:text-white transition-colors">
                      Chọn vé
                    </Link>
                  </div>
            )}
              </div>
          }

            {}
            {!loadingSearch && hasMore && schedules.length > 0 &&
          <div className="mt-8 flex justify-center">
                <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="bg-surface-container text-on-surface-variant px-8 py-3 rounded-xl font-bold hover:bg-surface-container-high transition-colors disabled:opacity-50 flex items-center gap-2">
              
                  {loadingMore ?
              <>
                      <div className="w-5 h-5 border-2 border-on-surface-variant/20 border-t-on-surface-variant rounded-full animate-spin"></div>
                      <span>Đang tải...</span>
                    </> :

              <>
                      <span>Xem thêm chuyến</span>
                      <span className="material-symbols-outlined text-[20px]">expand_more</span>
                    </>
              }
                </button>
              </div>
          }
          </div>
        </section>
      }

      {}
      <section className="bg-surface-container-low py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-16">
            <h2 className="text-3xl font-black text-on-surface mb-2">
              Tại sao chọn BusGo?
            </h2>
            <div className="w-20 h-1.5 bg-primary-container rounded-full"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((f, i) =>
            <div
              key={i}
              className="bg-white p-8 rounded-3xl shadow-editorial hover:-translate-y-2 transition-transform duration-300">
              
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-primary text-3xl">
                    {f.icon}
                  </span>
                </div>
                <h3 className="text-xl font-bold mb-3">{f.title}</h3>
                <p className="text-on-surface-variant leading-relaxed">{f.desc}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {}
      <section className="bg-surface py-20 border-t border-surface-container">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-3 mb-10">
            <span className="material-symbols-outlined text-4xl text-secondary">local_fire_department</span>
            <h2 className="text-3xl font-black text-on-surface">Tuyến đường phổ biến</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {loadingPopular ?
            <div className="col-span-full flex justify-center items-center py-10">
                <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
              </div> :
            popularRoutes.length > 0 ? popularRoutes.map((route) =>
            <div
              key={route.id}
              className="group relative rounded-3xl overflow-hidden cursor-pointer shadow-sm hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
              onClick={() => handleSelectPopularRoute(route.from, route.to)}>
              
                <div className="aspect-[4/5] w-full">
                  <img
                  src={route.image}
                  alt={route.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <h3 className="text-xl font-bold mb-3 leading-tight">{route.title}</h3>
                  <div className="flex items-center gap-2 text-sm text-white/90 mb-1.5">
                    <span className="material-symbols-outlined text-[18px]">schedule</span>
                    {route.duration}
                  </div>
                  <div className="flex items-center gap-2 text-sm font-bold text-secondary-fixed">
                    <span className="material-symbols-outlined text-[18px]">payments</span>
                    {route.price}
                  </div>
                </div>
              </div>
            ) :
            <div className="col-span-full text-center py-10 text-on-surface-variant font-medium">
                Chưa có dữ liệu tuyến đường phổ biến.
              </div>
            }
          </div>
        </div>
      </section>


      {}
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

          {}
          {companiesLoading &&
          <div className="flex justify-center items-center py-16">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                <p className="text-on-surface-variant font-medium">Đang tải danh sách nhà xe...</p>
              </div>
            </div>
          }

          {}
          {companiesError && !companiesLoading &&
          <div className="flex justify-center items-center py-16">
              <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center max-w-md">
                <span className="material-symbols-outlined text-red-500 text-4xl mb-3 block">error</span>
                <p className="text-red-600 font-medium mb-4">{companiesError}</p>
                <button
                onClick={() => window.location.reload()}
                className="bg-primary text-on-primary px-6 py-2 rounded-xl font-bold hover:bg-primary/90 transition-colors">
                
                  Thử lại
                </button>
              </div>
            </div>
          }

          {}
          {!companiesLoading && !companiesError && companies.length === 0 &&
          <div className="flex justify-center items-center py-16">
              <div className="text-center">
                <span className="material-symbols-outlined text-on-surface-variant text-5xl mb-3 block">directions_bus</span>
                <p className="text-on-surface-variant font-medium">Chưa có nhà xe nào.</p>
              </div>
            </div>
          }

          {}
          {!companiesLoading && !companiesError && companies.length > 0 &&
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {companies.map((company) =>
            <div
              key={company.id || company._id}
              onClick={() => {
                const today = new Date().toISOString().split('T')[0];
                navigate("/routes", { state: { companyId: company.id || company._id, companyName: company.name || company.company_name, date: today } });
              }}
              className="bg-white p-6 rounded-3xl shadow-editorial hover:-translate-y-1 hover:shadow-lg transition-all duration-300 flex items-center gap-4 cursor-pointer">
              
                  {}
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                    {company.logo || company.logoUrl ?
                <img
                  src={company.logo || company.logoUrl}
                  alt={company.name || company.company_name}
                  className="w-12 h-12 object-contain rounded-lg" /> :


                <span className="material-symbols-outlined text-primary text-3xl">
                        directions_bus
                      </span>
                }
                  </div>

                  {}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-on-surface truncate">
                      {company.name || company.company_name || "Nhà xe"}
                    </h3>
                    {(company.phone || company.phone_number) &&
                <p className="text-on-surface-variant text-sm flex items-center gap-1 mt-1">
                        <span className="material-symbols-outlined text-sm">call</span>
                        {company.phone || company.phone_number}
                      </p>
                }
                    {company.email &&
                <p className="text-on-surface-variant text-sm flex items-center gap-1 mt-0.5 truncate">
                        <span className="material-symbols-outlined text-sm">mail</span>
                        {company.email}
                      </p>
                }
                    {company.address &&
                <p className="text-on-surface-variant text-sm flex items-center gap-1 mt-0.5 truncate">
                        <span className="material-symbols-outlined text-sm">location_on</span>
                        {company.address}
                      </p>
                }
                  </div>
                </div>
            )}
            </div>
          }
        </div>
      </section>

      {}
      <section className="py-24 bg-surface">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-black text-on-surface mb-2">
                Top Nhà Xe Được Đánh Giá Cao
              </h2>
              <p className="text-on-surface-variant">
                Chất lượng dịch vụ hàng đầu dựa trên hàng ngàn đánh giá thực tế từ hành khách
              </p>
              <div className="w-20 h-1.5 bg-primary-container rounded-full mt-2"></div>
            </div>
            <Link to="/companies" className="text-primary font-bold hover:underline shrink-0 flex items-center gap-1">
              Xem tất cả <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>

          {companiesLoading &&
          <div className="flex justify-center items-center py-10">
              <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            </div>
          }

          {!companiesLoading && !companiesError && companies.length > 0 &&
          <div className="flex overflow-x-auto snap-x snap-mandatory gap-6 pb-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {[...companies].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 8).map((company) => {
              const rating = company.rating ? company.rating.toFixed(1) : "0.0";
              const totalReviews = company.totalReviews || company.reviewCount || 0;

              return (
                <div
                  key={`top-${company.id || company._id}`}
                  onClick={() => {
                    const today = new Date().toISOString().split('T')[0];
                    navigate("/routes", { state: { companyId: company.id || company._id, companyName: company.name || company.company_name, date: today } });
                  }}
                  className="min-w-[300px] md:min-w-[350px] snap-start bg-white p-6 rounded-3xl shadow-sm border border-outline-variant/20 hover:-translate-y-2 hover:shadow-xl transition-all duration-300 flex flex-col cursor-pointer group">
                  
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-16 h-16 bg-primary/5 rounded-2xl flex items-center justify-center flex-shrink-0 border border-primary/10">
                        {company.logo || company.logoUrl ?
                      <img
                        src={company.logo || company.logoUrl}
                        alt={company.name || company.company_name}
                        className="w-12 h-12 object-contain rounded-lg" /> :


                      <span className="material-symbols-outlined text-primary text-3xl">directions_bus</span>
                      }
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-on-surface truncate group-hover:text-primary transition-colors">
                          {company.name || company.company_name || "Nhà xe"}
                        </h3>
                        {}
                        <div
                        onClick={(e) => openReviewModal(company, e)}
                        className="inline-flex items-center gap-1.5 mt-1 px-2.5 py-1 -ml-2.5 rounded-lg hover:bg-yellow-50 transition-colors">
                        
                          <span className="material-symbols-outlined text-yellow-400 text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                          <span className="font-extrabold text-sm text-on-surface">{rating}</span>
                          <span className="text-on-surface-variant text-xs underline decoration-dotted underline-offset-2 hover:text-primary transition-colors">
                            ({totalReviews} đánh giá)
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-auto pt-4 border-t border-outline-variant/20 flex items-center justify-between">
                      <div className="text-sm text-on-surface-variant flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[18px] text-green-600">verified</span>
                        <span className="text-green-700 font-medium">Đối tác uy tín</span>
                      </div>
                      <button className="text-primary font-bold text-sm bg-primary/10 px-4 py-2 rounded-xl group-hover:bg-primary group-hover:text-white transition-colors">
                        Tìm vé
                      </button>
                    </div>
                  </div>);

            })}
            </div>
          }
        </div>
      </section>
      {}
      <section className="bg-surface py-16">
        <div className="max-w-7xl mx-auto px-6">

          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-black text-on-surface">Chương trình khuyến mãi</h3>
              <button className="text-primary font-bold hover:underline text-sm flex items-center gap-1">
                Xem tất cả <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>

            {promotionsLoading &&
            <div className="flex justify-center items-center py-10">
                <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
              </div>
            }

            {promotionsError && !promotionsLoading &&
            <div className="text-center text-red-500 py-6 font-medium bg-red-50 rounded-xl">{promotionsError}</div>
            }

            {!promotionsLoading && !promotionsError && promotions.length === 0 &&
            <div className="text-center py-10 text-on-surface-variant bg-surface-container rounded-2xl">
                <span className="material-symbols-outlined text-4xl mb-2 opacity-50">local_offer</span>
                <p>Hiện chưa có chương trình khuyến mãi nào.</p>
              </div>
            }

            {!promotionsLoading && !promotionsError && promotions.length > 0 &&
            <div className="flex overflow-x-auto snap-x snap-mandatory gap-6 pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {promotions.map((item, index) =>
              <div
                key={item.id}
                onClick={() => {
                  setSelectedPromotion({
                    ...item,
                    imageUrl: item.imageUrl || fallbackPromoImages[index % fallbackPromoImages.length]
                  });
                }}
                className="min-w-[280px] md:min-w-[320px] bg-white rounded-2xl shadow-sm border border-outline-variant/30 overflow-hidden snap-start cursor-pointer hover:-translate-y-1 hover:shadow-md transition-all">
                
                    <div className="h-40 w-full overflow-hidden relative bg-surface-container-low">
                      <img
                    src={item.imageUrl || fallbackPromoImages[index % fallbackPromoImages.length]}
                    alt={item.title}
                    className="w-full h-full object-contain hover:scale-105 transition-transform duration-500"
                    onError={(e) => {e.target.src = fallbackPromoImages[index % fallbackPromoImages.length];}} />
                  
                      {}
                      {new Date() - new Date(item.startDate) < 3 * 24 * 60 * 60 * 1000 &&
                  <div className="absolute top-2 left-2 bg-secondary text-white text-xs font-bold px-2 py-1 rounded-md shadow-sm">
                          Mới
                        </div>
                  }
                    </div>
                    <div className="p-4 flex flex-col h-[100px]">
                      <h4 className="font-bold text-sm text-on-surface line-clamp-2 leading-relaxed mb-2" title={item.title}>{item.title}</h4>
                      <div className="mt-auto text-xs text-on-surface-variant flex items-center justify-between">
                        <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">calendar_today</span> {new Date(item.endDate).toLocaleDateString('vi-VN')}</span>
                        <span className="text-primary font-bold">Xem chi tiết</span>
                      </div>
                    </div>
                  </div>
              )}
              </div>
            }
          </div>

        </div>
      </section>

      {}
      <CompanyReviewsModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        companyId={selectedCompanyForReview?.id}
        companyName={selectedCompanyForReview?.name} />
      

      <PromotionModal
        isOpen={!!selectedPromotion}
        onClose={() => setSelectedPromotion(null)}
        promotion={selectedPromotion} />
      
    </div>);

};

export default Home;