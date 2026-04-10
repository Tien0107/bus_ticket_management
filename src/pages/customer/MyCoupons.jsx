import React, { useEffect, useState } from "react";
import { getMyCoupons } from "../../api/customer";
import { useNavigate } from "react-router-dom";

export default function MyCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        setLoading(true);
        const res = await getMyCoupons();
        setCoupons(res.data?.coupons || res.data || []);
      } catch (err) {
        console.error(err);
        if (err.response?.status === 401) navigate("/login");
      } finally {
        setLoading(false);
      }
    };
    fetchCoupons();
  }, [navigate]);

  return (
    <div className="bg-surface min-h-screen pt-24 pb-12 px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-primary mb-8 border-b-2 border-primary inline-block pb-2">Hồ Sơ Của Tôi</h1>
        
        <div className="flex gap-4 mb-8">
           <button onClick={() => navigate("/my-tickets")} className="bg-surface-container-low text-on-surface hover:bg-surface-container hover:text-primary transition-colors px-6 py-2 rounded-full font-bold shadow-sm">Vé đã đặt</button>
           <button className="bg-primary text-white px-6 py-2 rounded-full font-bold shadow-md">Ví Khuyến Mãi</button>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {coupons.map((c, idx) => (
               <div key={idx} className="bg-gradient-to-r from-primary to-primary-container text-white rounded-2xl p-6 shadow-md relative overflow-hidden flex flex-col justify-between">
                 <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
                 <div className="absolute -left-4 -bottom-4 w-16 h-16 bg-white/10 rounded-full blur-xl"></div>
                 
                 <div className="z-10 bg-white/20 inline-block px-3 py-1 rounded-full text-xs font-bold w-fit mb-4 backdrop-blur-sm">Khuyến mãi</div>
                 
                 <div className="z-10 space-y-2">
                    <h3 className="font-black text-3xl tracking-tight leading-none">{c.discountAmount || c.value ? `${(c.discountAmount || c.value).toLocaleString()}đ` : `Giảm ${c.percentage}%`}</h3>
                    <p className="font-medium text-white/90 text-sm">Cho đơn tối thiểu {(c.minOrderValue || 0).toLocaleString()}đ</p>
                 </div>
                 
                 <div className="z-10 mt-6 pt-4 border-t border-white/20 flex justify-between items-center">
                    <div>
                       <p className="text-xs text-white/70">Mã code</p>
                       <p className="font-bold tracking-widest">{c.code || "N/A"}</p>
                    </div>
                    {c.expiredAt && (
                       <div className="text-right">
                          <p className="text-xs text-white/70">Hết hạn</p>
                          <p className="font-medium text-sm">{new Date(c.expiredAt).toLocaleDateString()}</p>
                       </div>
                    )}
                 </div>
               </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
