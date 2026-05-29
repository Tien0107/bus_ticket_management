import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { getTripSchedules, getTripScheduleRatings } from "../../api/customer";
import CompanyReviewsModal from "../../components/reviews/CompanyReviewsModal";

export default function RoutesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const filterState = location.state || {};

  const [schedules, setSchedules] = useState([]);
  const [popularRoutes, setPopularRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);

  const openReviewModal = (schedule, e) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedCompany({
      id: schedule.company?.id || schedule.companyId,
      name: schedule.name || schedule.company?.name || "Nhà xe"
    });
    setIsReviewModalOpen(true);
  };

  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = { limit: 50, orderBy: "asc" };
        if (filterState.companyId) params.companyId = filterState.companyId;
        if (filterState.date) params.date = filterState.date;


        const response = await getTripSchedules(params);
        let data = response.data?.trip || [];

        if (Array.isArray(data) && filterState.companyId) {
          data = data.filter((t) => String(t.company?.id || t.companyId) === String(filterState.companyId));
        }


        if (Array.isArray(data) && data.length > 0) {
          const uniqueCompanyIds = [...new Set(data.map((t) => t.company?.id || t.companyId).filter(Boolean))];
          const companyRatings = {};
          await Promise.all(uniqueCompanyIds.map(async (cId) => {
            try {
              const res = await getTripScheduleRatings({ companyId: cId, limit: 100 });
              const comments = res.data?.comments || [];
              if (comments.length > 0) {
                let sum = 0;
                comments.forEach((c) => sum += c.rating || 5);
                companyRatings[cId] = { rating: sum / comments.length, reviewCount: comments.length };
              }
            } catch (e) {
              console.error("Lỗi tải rating", e);
            }
          }));

          data = data.map((t) => {
            const cId = t.company?.id || t.companyId;
            if (cId && companyRatings[cId]) {
              return {
                ...t,
                company: {
                  ...(t.company || {}),
                  rating: companyRatings[cId].rating,
                  reviewCount: companyRatings[cId].reviewCount
                }
              };
            }
            return t;
          });
        }

        setSchedules(Array.isArray(data) ? data : []);


        if (Array.isArray(data)) {
          const routesMap = new Map();
          data.forEach((trip) => {
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
        }

      } catch (err) {
        console.error("Lỗi lấy danh sách chuyến xe:", err);
        if (err.response?.status === 401) {
          setError("Vui lòng đăng nhập để xem danh sách chuyến xe và đặt vé.");
        } else {
          setError("Không thể tải danh sách chuyến xe. Vui lòng thử lại sau.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSchedules();
  }, []);

  const handleBookRoute = (from, to) => {
    navigate("/", { state: { from, to } });
  };

  return (
    <div className="bg-surface min-h-screen pb-20">
      {}
      <section className="relative pt-32 pb-24 overflow-hidden bg-primary">
        <div className="absolute inset-0 z-0">
          <img
            className="w-full h-full object-cover opacity-20"
            src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=80&w=2000"
            alt="Travel background" />
          
          <div className="absolute inset-0 bg-gradient-to-t from-primary to-transparent opacity-80"></div>
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight drop-shadow-md">
            Khám phá các hành trình <br className="hidden md:block" /> thú vị cùng BusGo
          </h1>
          <p className="text-white/90 text-lg md:text-xl font-medium max-w-2xl mx-auto drop-shadow">
            Hàng ngàn chuyến xe chất lượng cao mỗi ngày đang chờ đón bạn. 
            Chọn ngay một điểm đến và bắt đầu chuyến đi của mình!
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 -mt-10 relative z-20">
        {}
        <div className="bg-white rounded-3xl shadow-editorial p-8 mb-16">
          <div className="flex items-center gap-3 mb-8">
            <span className="material-symbols-outlined text-3xl text-secondary">local_fire_department</span>
            <h2 className="text-2xl font-black text-on-surface">Tuyến đường phổ biến</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {popularRoutes.length > 0 ? popularRoutes.map((route) =>
            <div
              key={route.id}
              className="group relative rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              onClick={() => handleBookRoute(route.from, route.to)}>
              
                <div className="aspect-[4/5] w-full">
                  <img
                  src={route.image}
                  alt={route.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                  <h3 className="text-xl font-bold mb-2">{route.title}</h3>
                  <div className="flex items-center gap-2 text-sm text-white/90 mb-1">
                    <span className="material-symbols-outlined text-[16px]">schedule</span>
                    {route.duration}
                  </div>
                  <div className="flex items-center gap-2 text-sm font-bold text-secondary-fixed">
                    <span className="material-symbols-outlined text-[16px]">payments</span>
                    {route.price}
                  </div>
                </div>
              </div>
            ) :
            <div className="col-span-full text-center py-10 text-on-surface-variant">
                Đang tải các tuyến đường phổ biến...
              </div>
            }
          </div>
        </div>

        {}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-8">
            <span className="material-symbols-outlined text-3xl text-primary">calendar_month</span>
            <h2 className="text-2xl font-black text-on-surface">
              {filterState.companyName ? `Các chuyến xe của ${filterState.companyName}` : "Các chuyến xe sắp tới"}
            </h2>
          </div>

          {loading ?
          <div className="flex justify-center items-center py-16">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                <p className="text-on-surface-variant font-medium">Đang tải danh sách chuyến xe...</p>
              </div>
            </div> :
          error ?
          <div className="bg-red-50 text-red-600 p-6 rounded-2xl text-center border border-red-100">
              <span className="material-symbols-outlined text-4xl mb-2">error</span>
              <p className="font-medium">{error}</p>
            </div> :
          schedules.length === 0 ?
          <div className="text-center py-16 bg-white rounded-3xl shadow-sm border border-surface-container">
              <span className="material-symbols-outlined text-5xl text-outline mb-4">sentiment_dissatisfied</span>
              <p className="text-lg font-medium text-on-surface-variant">Không có chuyến xe nào sắp tới.</p>
            </div> :

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
                          <div
                        onClick={(e) => openReviewModal(schedule, e)}
                        className="inline-flex items-center gap-1 mt-0.5 mb-1 px-2 py-0.5 -ml-2 rounded-lg hover:bg-surface-container transition-colors cursor-pointer">
                        
                            <span className="material-symbols-outlined text-yellow-400 text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                            <span className="font-bold text-xs text-on-surface">{schedule.company?.rating ? schedule.company.rating.toFixed(1) : schedule.rating ? schedule.rating.toFixed(1) : "0.0"}</span>
                            <span className="text-on-surface-variant text-[10px] underline decoration-dotted underline-offset-2">({schedule.company?.totalReviews || schedule.company?.reviewCount || schedule.totalReviews || schedule.reviewCount || 0} đánh giá)</span>
                          </div>
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
                        <p className="text-sm text-on-surface-variant font-medium mt-1">{schedule.fromLocation || "Điểm đi"}</p>
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
                        <p className="text-sm text-on-surface-variant font-medium mt-1">{schedule.toLocation || "Điểm đến"}</p>
                      </div>
                    </div>
                  </div>
                  
                  <Link
                to={`/booking/${schedule.id || ''}`}
                state={{
                  schedule: schedule,
                  companyId: schedule.company?.id || schedule.companyId
                }}
                className="w-full md:w-auto md:px-10 shrink-0 text-center bg-secondary-container text-on-secondary-container py-2.5 px-6 rounded-xl font-bold hover:bg-secondary hover:text-white transition-colors">
                    Chọn vé
                  </Link>
                </div>
            )}
            </div>
          }
        </div>
      </div>
      <CompanyReviewsModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        companyId={selectedCompany?.id}
        companyName={selectedCompany?.name} />
      
    </div>);

}