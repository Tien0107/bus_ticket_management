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

  const handlePayment = async (id, method) => {
    try {
      const res = await createPaymentMethod(id, method);
      
      if (method === "vnpay") {
        const url = res.data?.paymentUrl || res.data?.url || (typeof res.data === 'string' ? res.data : null);
        if (url) {
           window.location.href = url;
        } else {
           alert("Lỗi: Không nhận được URL thanh toán từ Backend. " + JSON.stringify(res.data));
        }
      } else if (method === "cash") {
        alert(res.data?.message || "Đã ghi nhận yêu cầu thanh toán Tiền mặt! Vui lòng thanh toán tại quầy trước giờ xuất bến.");
        fetchTickets();
      }
      
    } catch (err) {
      alert("Lỗi gọi thanh toán: " + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="bg-surface min-h-screen pt-24 pb-12 px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-primary mb-8 border-b-2 border-primary inline-block pb-2">Hồ Sơ Của Tôi</h1>
        
        <div className="flex flex-wrap gap-4 mb-8">
           <button className="bg-primary text-white hover:bg-primary/90 transition-colors px-6 py-2 rounded-full font-bold shadow-md">Vé đã đặt</button>
           <button onClick={() => navigate("/my-coupons")} className="bg-surface-container-low text-on-surface hover:bg-surface-container hover:text-primary transition-colors px-6 py-2 rounded-full font-bold shadow-sm">Ví Khuyến Mãi</button>
           <button onClick={() => navigate("/my-payment-methods")} className="bg-surface-container-low text-on-surface hover:bg-surface-container hover:text-primary transition-colors px-6 py-2 rounded-full font-bold shadow-sm">Thanh Toán</button>
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
               const currentStatus = String(t.status || 'pending').toUpperCase();
               const isPending = currentStatus === "PENDING" || currentStatus === "RESERVED";
               
               const statusLabelMap = {
                 'PENDING': 'Chờ thanh toán', 'RESERVED': 'Đã giữ chỗ',
                 'PAID': 'Đã thanh toán', 'COMPLETED': 'Hoàn thành',
                 'CANCELLED': 'Đã hủy', 'EXPIRED': 'Hết hạn',
                 'CHECKED_IN': 'Đã lên xe'
               };
               const statusLabel = statusLabelMap[currentStatus] || currentStatus;
               
               return (
                 <div key={idx} className="bg-white border rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                   <div className="space-y-2">
                      <div className="flex items-center gap-3">
                         <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold border border-primary/20">Mã vé: #{t.id} {t.bookingId ? `(Order #${t.bookingId})` : ''}</span>
                         <span className={`px-3 py-1 rounded-full text-xs font-bold ${currentStatus === 'COMPLETED' || currentStatus === 'PAID' ? 'bg-green-100 text-green-700' : currentStatus === 'CANCELLED' ? 'bg-red-100 text-red-700' : currentStatus === 'EXPIRED' ? 'bg-gray-200 text-gray-600' : 'bg-orange-100 text-orange-700'}`}>
                           {statusLabel}
                         </span>
                      </div>
                      <h3 className="font-bold text-lg">Loại hành trình: {t.bookingType === 'round_trip' ? 'Khứ hồi' : 'Một chiều'}</h3>
                      <p className="text-sm text-on-surface-variant"><span className="material-symbols-outlined text-[16px] align-text-bottom mr-1">calendar_month</span>Khởi hành: {t.departureDate ? new Date(t.departureDate).toLocaleString('vi-VN') : 'N/A'}</p>
                      
                      <p className="text-sm font-bold text-secondary">
                        Tổng tiền: {(t.totalAmount || 0).toLocaleString()}đ
                      </p>
                      
                      {t.expiredAt && isPending && (
                         <p className="text-xs text-red-500 font-medium">Hết hạn thanh toán: {new Date(t.expiredAt).toLocaleString('vi-VN')}</p>
                      )}
                   </div>
                   
                   <div className="flex gap-3 w-full md:w-auto">
                      {isPending ? (
                         <>
                           <div className="flex md:flex-col gap-2 flex-1 md:flex-none">
                             <button onClick={() => handlePayment(t.bookingId || t.id, "vnpay")} className="w-full border border-primary text-primary hover:bg-primary hover:text-white transition-colors px-4 py-2 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm text-sm">
                               <span className="material-symbols-outlined text-[16px]">qr_code_scanner</span>
                               VNPay
                             </button>
                             <button onClick={() => handlePayment(t.bookingId || t.id, "cash")} className="w-full border border-secondary text-secondary hover:bg-secondary hover:text-white transition-colors px-4 py-2 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm text-sm">
                               <span className="material-symbols-outlined text-[16px]">payments</span>
                               Tiền mặt
                             </button>
                           </div>
                           <button onClick={() => navigate(`/my-tickets/${t.id}`)} className="flex-1 md:flex-none border border-primary text-primary hover:bg-primary hover:text-white transition-colors px-6 py-2 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm">
                             Xem chi tiết
                           </button>
                           <button onClick={() => handleCancel(t.id)} className="flex-1 md:flex-none bg-red-50 hover:bg-red-100 text-red-600 px-6 py-2 rounded-xl font-bold transition-colors">
                             Hủy
                           </button>
                         </>
                      ) : (
                         <button onClick={() => navigate(`/my-tickets/${t.id}`)} className="flex-1 md:flex-none border border-primary text-primary hover:bg-primary hover:text-white transition-colors px-6 py-2 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm">
                           Xem vé
                         </button>
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
