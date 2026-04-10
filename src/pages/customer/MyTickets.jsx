import React, { useEffect, useState } from "react";
import { getMyTickets, cancelTicket, createPaymentMethod } from "../../api/customer";
import { useNavigate } from "react-router-dom";

export default function MyTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await getMyTickets();
      setTickets(res.data?.tickets || res.data || []);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) {
         navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleCancel = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn hủy vé này?")) return;
    try {
      await cancelTicket(id);
      alert("Hủy vé thành công!");
      fetchTickets();
    } catch (err) {
      alert("Hủy vé thất bại: " + (err.response?.data?.message || err.message));
    }
  };

  const handlePayVNPay = async (id) => {
    try {
      const res = await createPaymentMethod(id, "vnpay");
      const url = res.data?.paymentUrl || res.data?.url || (typeof res.data === 'string' ? res.data : null);
      if (url) {
         window.location.href = url;
      } else {
         alert("Lỗi: Không nhận được URL thanh toán từ Backend. " + JSON.stringify(res.data));
      }
    } catch (err) {
      alert("Lỗi gọi thanh toán VNPay: " + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="bg-surface min-h-screen pt-24 pb-12 px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-primary mb-8 border-b-2 border-primary inline-block pb-2">Hồ Sơ Của Tôi</h1>
        
        <div className="flex gap-4 mb-8">
           <button className="bg-primary text-white px-6 py-2 rounded-full font-bold shadow-md">Vé đã đặt</button>
           <button onClick={() => navigate("/my-coupons")} className="bg-surface-container-low text-on-surface hover:bg-surface-container hover:text-primary transition-colors px-6 py-2 rounded-full font-bold shadow-sm">Ví Khuyến Mãi</button>
        </div>

        {loading ? (
          <p className="text-on-surface-variant animate-pulse">Đang tải danh sách vé...</p>
        ) : tickets.length === 0 ? (
          <div className="bg-surface-container-lowest p-12 text-center rounded-2xl shadow-sm border border-surface-container">
             <span className="material-symbols-outlined text-6xl text-on-surface-variant mb-4">confirmation_number</span>
             <h2 className="text-xl font-bold text-on-surface mb-2">Chưa có vé nào</h2>
             <p className="text-on-surface-variant mb-6">Bạn chưa đặt chuyến xe nào cùng BusGo.</p>
             <button onClick={() => navigate("/")} className="bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-primary/90 transition-colors">Tìm chuyến ngay</button>
          </div>
        ) : (
          <div className="space-y-6">
            {tickets.map((t, idx) => {
               const isPending = t.status === "PENDING" || !t.status; // Giả sử status default
               return (
                 <div key={idx} className="bg-white border rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                   <div className="space-y-2">
                      <div className="flex items-center gap-3">
                         <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold border border-primary/20">Mã vé: #{t.id}</span>
                         <span className={`px-3 py-1 rounded-full text-xs font-bold ${t.status === 'COMPLETED' || t.status === 'PAID' ? 'bg-green-100 text-green-700' : t.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                           {t.status || 'PENDING'}
                         </span>
                      </div>
                      <h3 className="font-bold text-lg">Chuyến xe ID: {t.tripId}</h3>
                      <p className="text-sm text-on-surface-variant"><span className="material-symbols-outlined text-[16px] align-text-bottom mr-1">chair</span>Ghế: {t.seatId || t.selectedSeats?.map(s => s.seatNumber).join(", ") || 'N/A'}</p>
                      
                      {t.expiredAt && isPending && (
                         <p className="text-xs text-red-500 font-medium">Hết hạn thanh toán: {new Date(t.expiredAt).toLocaleString()}</p>
                      )}
                   </div>
                   
                   <div className="flex gap-3 w-full md:w-auto">
                      {isPending && (
                         <>
                           <button onClick={() => handlePayVNPay(t.id)} className="flex-1 md:flex-none border border-primary text-primary hover:bg-primary hover:text-white transition-colors px-6 py-2 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm">
                             <span className="material-symbols-outlined text-[18px]">account_balance</span>
                             Thanh toán VNPay
                           </button>
                           <button onClick={() => handleCancel(t.id)} className="flex-1 md:flex-none bg-red-50 hover:bg-red-100 text-red-600 px-6 py-2 rounded-xl font-bold transition-colors">
                             Hủy
                           </button>
                         </>
                      )}
                   </div>
                 </div>
               )
            })}
          </div>
        )}
      </div>
    </div>
  );
}
