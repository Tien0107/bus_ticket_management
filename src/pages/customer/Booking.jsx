import React, { useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { createBooking } from "../../api/customer";
import BookingSeatStep from "./BookingSeatStep";
import BookingCheckoutStep from "./BookingCheckoutStep";

export default function Booking() {
  const { tripId } = useParams(); // Note: This is actually scheduleId
  const navigate = useNavigate();
  const location = useLocation();
  
  const today = new Date().toISOString().split('T')[0];
  
  // Trạng thái quản lý luồng Booking
  const [step, setStep] = useState(1);
  const [bookingData, setBookingData] = useState({
    scheduleId: tripId,
    companyId: location.state?.companyId || location.state?.schedule?.companyId,
    date: location.state?.date || today,
    tripId: null, // Sẽ được lấy sau khi Prepare
    selectedSeats: [],
    pickupId: null,
    dropoffId: null,
    passengerInfo: { name: "", phone: "", email: "", note: "" },
    coupon: null,
    paymentMethod: "vnpay",
    totalPrice: 0
  });

  const handleConfirmBooking = async () => {
    try {
      if (bookingData.selectedSeats.length === 0) {
        alert("Vui lòng chọn ít nhất 1 ghế.");
        return;
      }

      // Backend API booking thiết kế outBound chỉ nhận 1 seatId mỗi order.
      // Cần lặp từng ghế để giữ chỗ thành công đồng loạt
      const bookingPromises = bookingData.selectedSeats.map((seat) => {
        const payload = {
            type: "one_way",
            outBound: {
               tripId: Number(bookingData.tripId),
               seatId: Number(seat.id),
               fromStationId: Number(bookingData.pickupId),
               toStationId: Number(bookingData.dropoffId),
               companyId: Number(bookingData.companyId)
            }
        };
        
        if (bookingData.coupon?.id) {
            payload.couponId = Number(bookingData.coupon.id);
        }

        return createBooking(payload);
      });

      await Promise.all(bookingPromises);

      alert("Đặt vé thành công! Bạn sẽ được chuyển sang trang quản lý vé.");
      navigate("/my-tickets"); // Chuyển sang trang quản lý vé
    } catch (err) {
      console.error("Booking Error:", err);
      // Hiển thị mảng validation lỗi của backend nếu có
      if (err.response?.data?.issues) {
         const msgs = err.response.data.issues.map(i => `${i.field}: ${i.reason}`).join(" | ");
         alert("Đặt vé thất bại! Lỗi cấu trúc: " + msgs);
      } else {
         alert("Đặt vé thất bại! " + (err.response?.data?.message || err.message));
      }
    }
  };

  return (
    <div className="bg-surface min-h-screen text-on-surface">
      {/* Top Navigation Bar from Stitch Design */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md shadow-sm border-b border-surface-container">
        <div className="flex justify-between items-center max-w-7xl mx-auto px-6 h-16">
          <div className="text-2xl font-bold tracking-tighter text-primary cursor-pointer hover:opacity-80" onClick={() => navigate("/")}>BusGo</div>
          <div className="hidden md:flex space-x-8 items-center cursor-pointer">
              <span onClick={() => navigate("/")} className="text-on-surface-variant hover:text-primary transition-colors font-medium">Trang chủ</span>
              <span className="font-bold text-primary border-b-2 border-primary pb-1">Đặt vé</span>
              <span className="text-on-surface-variant hover:text-primary transition-colors font-medium">Khuyến mãi</span>
          </div>
          <button onClick={() => navigate("/")} className="text-on-surface-variant hover:bg-surface-container px-4 py-2 rounded-xl transition-all material-symbols-outlined">close</button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="pt-24 pb-20 max-w-7xl mx-auto px-6">
          {step === 1 && (
            <BookingSeatStep 
              bookingData={bookingData} 
              setBookingData={setBookingData} 
              onNext={() => setStep(2)} 
            />
          )}

          {step === 2 && (
            <BookingCheckoutStep 
              bookingData={bookingData} 
              setBookingData={setBookingData} 
              onBack={() => setStep(1)}
              onConfirm={handleConfirmBooking}
            />
          )}
      </main>
    </div>
  );
}
