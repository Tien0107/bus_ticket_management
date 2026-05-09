import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getTicketDetail, cancelTicket } from "../../api/customer";
import ConfirmModal from "../../components/common/ConfirmModal";
import { useToast } from "../../context/ToastContext";

export default function TicketDetail() {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    fetchDetail();
  }, [ticketId]);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const res = await getTicketDetail(ticketId);
      setTicket(res.data?.ticket || res.data || null);
    } catch (err) {
      addToast("Lỗi tải thông tin vé: " + (err.response?.data?.message || err.message), "error");
    } finally {
      setLoading(false);
    }
  };

  const executeCancel = async () => {
    try {
      await cancelTicket(ticketId);
      addToast("Hủy vé thành công!", "success");
      navigate("/profile/tickets");
    } catch (err) {
      addToast("Hủy vé thất bại: " + (err.response?.data?.message || err.message), "error");
    } finally {
      setShowConfirm(false);
    }
  };

  const handleCancel = () => {
    setShowConfirm(true);
  };

  if (loading) {
    return <div className="min-h-screen bg-surface flex items-center justify-center p-6"><p className="text-on-surface-variant animate-pulse font-medium">Đang tải Boarding Pass...</p></div>;
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6">
        <span className="material-symbols-outlined text-6xl text-error mb-4">error</span>
        <p className="text-on-surface text-lg font-bold mb-6">Không tìm thấy mã vé này.</p>
        <button onClick={() => navigate(-1)} className="px-6 py-3 bg-primary text-white rounded-xl font-bold shadow-md hover:bg-primary/90">Quay lại</button>
      </div>
    );
  }

  // Gióng các biến hiển thị theo đúng định nghĩa Swagger của Backend API
  const departureCity = ticket.fromLocation || ticket.startCity || "Đang cập nhật...";
  const arrivalCity = ticket.toLocation || ticket.endCity || "Đang cập nhật...";
  const departureStation = ticket.startStation || "Bến xe đi"; // Không có trong schema chuẩn, phòng hờ
  const arrivalStation = ticket.endStation || "Bến xe đến";   
  const date = ticket.departureDate ? new Date(ticket.departureDate).toLocaleDateString('vi-VN') : "Chưa có ngày";
  const time = ticket.departureTime || "--:--";
  
  // Swagger trả về biến seatNumber dạng chuỗi
  const seatNumbers = ticket.seatNumber || ticket.seatId || "N/A";
  
  // Những biến này mở rông có thể API gửi thêm
  const driverPhone = ticket.driverPhone || "Chưa cập nhật";
  const busCompany = ticket.companyName || "BusGo Company";
  
  // Swagger trả về plateNumber thay vì licensePlate
  const busPlate = ticket.plateNumber || ticket.licensePlate || "Chưa cấp biển";
  
  // Swagger trả về totalAmount
  const price = (ticket.totalAmount || ticket.totalPrice || 0).toLocaleString('vi-VN') + 'đ';
  
  // Swagger trả về code dùng cho mã Barcode/QR
  const qrCodeData = ticket.code || ticket.qrCode || `BG-${ticketId}`;
  
  const isCancelled = ticket.status === 'CANCELLED' || ticket.status === 'cancelled';

  return (
    <div className="bg-surface text-on-surface min-h-[max(884px,100dvh)] font-body">
      <ConfirmModal 
        isOpen={showConfirm} 
        title="Xác nhận hủy vé" 
        message={`Bạn có chắc chắn muốn hủy vé số #${ticketId} không?`} 
        confirmText="Có, hủy vé"
        cancelText="Đóng"
        onConfirm={executeCancel} 
        onCancel={() => setShowConfirm(false)} 
      />
      <style>{`
        .pass-cutout-l, .pass-cutout-r {
          position: absolute;
          width: 24px;
          height: 24px;
          background: #f9f9f9;
          border-radius: 50%;
          bottom: 232px;
        }
        .pass-cutout-l { left: -12px; }
        .pass-cutout-r { right: -12px; }
      `}</style>
      
      {/* TopAppBar */}
      <header className="w-full sticky top-0 z-50 bg-[#f9f9f9]/80 backdrop-blur-md flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="material-symbols-outlined text-primary hover:bg-surface-container transition-colors rounded-full p-2 active:scale-95 duration-200">arrow_back</button>
          <h1 className="font-bold text-lg tracking-tight text-primary">Chi tiết Vé</h1>
        </div>
        <button className="material-symbols-outlined text-primary hover:bg-surface-container transition-colors rounded-full p-2 active:scale-95 duration-200">share</button>
      </header>

      <main className="max-w-md mx-auto px-6 pt-4 pb-32">
        {/* Main Boarding Pass Container */}
        <div className="relative bg-surface-container-lowest rounded-2xl overflow-hidden shadow-[0_12px_32px_rgba(26,28,28,0.06)] border border-surface-container/50">
          
          {/* Company & Vehicle Info */}
          <div className="p-6 flex justify-between items-center bg-surface-container-low">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white">
                <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>directions_bus</span>
              </div>
              <div>
                <p className="font-bold text-primary text-[13px] uppercase tracking-wider">{busCompany}</p>
                <p className="text-[10px] text-on-surface-variant font-medium tracking-widest uppercase">BUS LINES</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-on-surface-variant font-medium uppercase tracking-widest">Biển số</p>
              <p className="font-bold text-on-surface text-sm">{busPlate}</p>
            </div>
          </div>

          {/* Route Details */}
          <div className="p-8">
            <div className="flex justify-between items-center mb-8">
              <div className="flex-1">
                <p className="text-[11px] font-bold text-primary uppercase tracking-[0.1em] mb-1">Xuất phát</p>
                <h2 className="text-2xl font-extrabold tracking-tight leading-none">{departureCity}</h2>
                <p className="text-[13px] text-on-surface-variant mt-1 font-medium">{departureStation}</p>
              </div>
              <div className="flex flex-col items-center px-4">
                <span className="material-symbols-outlined text-primary text-2xl" style={{fontVariationSettings: "'FILL' 1"}}>trending_flat</span>
              </div>
              <div className="flex-1 text-right">
                <p className="text-[11px] font-bold text-primary uppercase tracking-[0.1em] mb-1">Đến</p>
                <h2 className="text-2xl font-extrabold tracking-tight leading-none">{arrivalCity}</h2>
                <p className="text-[13px] text-on-surface-variant mt-1 font-medium">{arrivalStation}</p>
              </div>
            </div>

            {/* Grid Detail Info */}
            <div className="grid grid-cols-2 gap-y-6 bg-surface-container-low rounded-xl p-6">
              <div>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Ngày đi</p>
                <p className="font-bold text-on-surface">{date}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Giờ đi</p>
                <p className="font-bold text-on-surface text-lg">{time}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Ghế ngồi</p>
                <p className="font-extrabold text-secondary text-2xl tracking-tighter">{seatNumbers}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">SĐT Tài xế</p>
                <p className="font-bold text-on-surface text-sm">{driverPhone}</p>
              </div>
            </div>
          </div>

          {/* Visual Separation (Ticket Cutout) */}
          <div className="relative h-px bg-surface-container-high mx-8"></div>
          <div className="pass-cutout-l"></div>
          <div className="pass-cutout-r"></div>

          {/* QR Code Section */}
          <div className="p-8 flex flex-col items-center">
            <div className={`bg-white p-4 rounded-2xl shadow-sm mb-4 ${isCancelled ? 'opacity-30' : ''}`}>
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${qrCodeData}`} alt="QR Code" className="w-[150px] h-[150px]" />
            </div>
            {isCancelled ? (
               <p className="text-lg font-bold text-error uppercase tracking-widest mb-1">VÉ ĐÃ HỦY</p>
            ) : (
               <p className="text-[11px] font-medium text-on-surface-variant tracking-widest uppercase mb-1">Quét khi lên xe</p>
            )}
            <p className="font-mono text-sm font-bold text-primary">{qrCodeData}</p>
            
            <div className="mt-6 w-full pt-6 bg-surface-container-low rounded-xl flex justify-between items-center px-6 pb-6 border-t border-white/50">
              <div>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Thanh toán</p>
                <p className={`text-xl font-extrabold tracking-tight ${isCancelled ? 'text-on-surface-variant line-through' : 'text-secondary'}`}>{price}</p>
              </div>
              {(() => {
                const st = String(ticket.status || '').toLowerCase();
                const cfg = {
                  paid: { label: 'Đã thanh toán', color: 'text-primary', icon: 'verified' },
                  reserved: { label: 'Đã giữ chỗ', color: 'text-secondary', icon: 'schedule' },
                  pending: { label: 'Chờ thanh toán', color: 'text-secondary', icon: 'schedule' },
                  cancelled: { label: 'Đã hủy', color: 'text-error', icon: 'cancel' },
                  expired: { label: 'Hết hạn', color: 'text-on-surface-variant', icon: 'timer_off' },
                  checked_in: { label: 'Đã lên xe', color: 'text-primary', icon: 'directions_bus' },
                  completed: { label: 'Hoàn thành', color: 'text-primary', icon: 'check_circle' },
                }[st] || { label: ticket.status, color: 'text-on-surface-variant', icon: 'info' };
                return (
                  <div className={`flex items-center gap-2 ${cfg.color}`}>
                    <span className="material-symbols-outlined text-lg" style={{fontVariationSettings: "'FILL' 1"}}>
                      {cfg.icon}
                    </span>
                    <span className="text-[11px] font-bold uppercase tracking-widest">
                      {cfg.label}
                    </span>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col gap-4">
          <button className="w-full bg-secondary-container text-on-secondary-container font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity active:scale-[0.98] duration-200 text-sm">
            <span className="material-symbols-outlined">download</span>
            Tải vé dạng PDF
          </button>
          {!isCancelled && ticket.status !== 'COMPLETED' && (
            <button onClick={handleCancel} className="w-full bg-transparent text-error border border-error/20 font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-error-container/30 transition-colors active:scale-[0.98] duration-200 text-sm">
              <span className="material-symbols-outlined">cancel</span>
              Hủy vé này
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
