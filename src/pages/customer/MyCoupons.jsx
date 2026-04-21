import React, { useEffect, useState } from "react";
import { getMyCoupons } from "../../api/customer";
import { useNavigate } from "react-router-dom";

export default function MyCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const navigate = useNavigate();

  const fetchCoupons = async (append = false) => {
    try {
      setLoading(true);
      const params = { orderTotal: 0 }; // Lấy tất cả ví dụ cho wallet
      if (append && nextCursor) params.next = nextCursor;
      
      const res = await getMyCoupons(params);
      const data = res.data?.coupons || res.data || [];
      const cursor = res.data?.next || null;
      
      setNextCursor(cursor);
      if (append) {
        setCoupons(prev => [...prev, ...data]);
      } else {
        setCoupons(data);
      }
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) navigate("/login");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, [navigate]);

  return (
    <div className="bg-surface min-h-screen pt-24 pb-12 px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-primary mb-8 border-b-2 border-primary inline-block pb-2">Hồ Sơ Của Tôi</h1>
        
        <div className="flex flex-wrap gap-4 mb-8">
           <button onClick={() => navigate("/my-tickets")} className="bg-surface-container-low text-on-surface hover:bg-surface-container hover:text-primary transition-colors px-6 py-2 rounded-full font-bold shadow-sm">Vé đã đặt</button>
           <button className="bg-primary text-white px-6 py-2 rounded-full font-bold shadow-md">Ví Khuyến Mãi</button>
           <button onClick={() => navigate("/my-payment-methods")} className="bg-surface-container-low text-on-surface hover:bg-surface-container hover:text-primary transition-colors px-6 py-2 rounded-full font-bold shadow-sm">Thanh Toán</button>
        </div>

        {loading ? (
          <p className="text-on-surface-variant animate-pulse">Đang tải danh sách ưu đãi...</p>
        ) : coupons.length === 0 ? (
          <div className="bg-surface-container-lowest p-12 text-center rounded-2xl shadow-sm border border-surface-container">
             <span className="material-symbols-outlined text-6xl text-on-surface-variant mb-4">loyalty</span>
             <h2 className="text-xl font-bold text-on-surface mb-2">Chưa có mã giảm giá</h2>
             <p className="text-on-surface-variant mb-6">Bạn chưa sở hữu mã giảm giá nào. Hãy săn thêm ưu đãi nhé!</p>
             <button onClick={() => navigate("/")} className="bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-primary/90 transition-colors">Về trang chủ</button>
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {coupons.map((c, idx) => (
                 <div key={idx} className="bg-gradient-to-r from-primary to-primary-container text-white rounded-2xl p-6 shadow-md relative overflow-hidden flex flex-col justify-between">
                   <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
                   <div className="absolute -left-4 -bottom-4 w-16 h-16 bg-white/10 rounded-full blur-xl"></div>
                   
                   <div className="z-10 flex space-x-2 w-fit mb-4">
                     <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm">
                       Khuyến mãi
                     </span>
                     {!c.isActive && (
                       <span className="bg-red-500/80 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm">
                         Đã khóa
                       </span>
                     )}
                   </div>
                   
                   <div className="z-10 space-y-2">
                      <h3 className="font-black text-3xl tracking-tight leading-none">
                        {String(c.discountType).toLowerCase() === "percent" 
                          ? `Giảm ${c.discountValue}%` 
                          : `${Number(c.discountValue).toLocaleString()}đ`}
                      </h3>
                      <p className="font-medium text-white/90 text-sm">Cho đơn tối thiểu {Number(c.minOrderAmount || 0).toLocaleString()}đ</p>
                   </div>
                   
                   <div className="z-10 mt-6 pt-4 border-t border-white/20 flex justify-between items-center">
                      <div>
                         <p className="text-xs text-white/70">Mã code</p>
                         <p className="font-bold tracking-widest">{c.code || "N/A"}</p>
                      </div>
                      {c.endDate && (
                         <div className="text-right">
                            <p className="text-xs text-white/70">Hết hạn</p>
                            <p className="font-medium text-sm">{new Date(c.endDate).toLocaleDateString("vi-VN")}</p>
                         </div>
                      )}
                   </div>
                 </div>
              ))}
            </div>

            {nextCursor && (
              <div className="text-center mt-8">
                <button 
                  onClick={() => fetchCoupons(true)} 
                  disabled={loading}
                  className="bg-surface-container hover:bg-surface-container-high transition-colors text-primary font-bold px-8 py-3 rounded-xl inline-flex items-center gap-2"
                >
                  <span className="material-symbols-outlined">{loading ? 'hourglass_top' : 'expand_more'}</span>
                  {loading ? 'Đang tải...' : 'Xem thêm khuyến mãi'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
