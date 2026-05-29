import React, { useState, useEffect } from "react";
import { useToast } from "../../context/ToastContext";

export default function BookingCheckoutStep({ bookingData, returnBookingData, isRoundTrip, setBookingData, onBack, onConfirm }) {
  const { addToast } = useToast();


  const [timeLeft, setTimeLeft] = useState(10 * 60);

  useEffect(() => {
    if (timeLeft <= 0) {
      addToast("Đã hết thời gian giữ chỗ! Vui lòng chọn lại ghế.", "error");
      onBack();
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, onBack]);

  return (
    <>
      {}
      <div className="mb-12">
        <div className="flex items-center justify-between max-w-2xl mx-auto relative cursor-pointer" onClick={onBack}>
           <div className="flex flex-col items-center z-10">
              <div className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold mb-2">
                 <span className="material-symbols-outlined text-sm">check</span>
              </div>
              <span className="text-sm font-medium text-primary">Chọn chuyến & Ghế</span>
           </div>
           
           <div className="absolute top-5 left-0 w-full h-[2px] bg-surface-container -z-0">
              <div className="h-full bg-primary w-1/2"></div>
           </div>
           
           <div className="flex flex-col items-center z-10 disabled">
              <div className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold mb-2">2</div>
              <span className="text-sm font-medium text-primary">Thanh toán</span>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-24">
        {}
        <div className="lg:col-span-7 space-y-8">
          


          <section className="bg-surface-container-lowest p-8 rounded-xl shadow-sm">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">account_balance_wallet</span>
              Phương thức thanh toán
            </h2>
            <div className="space-y-4">
              <label className={`flex items-center p-4 rounded-xl border cursor-pointer transition-all ${bookingData.paymentMethod === 'vnpay' ? 'border-primary bg-primary/5' : 'border-surface-container hover:border-primary'}`}>
                <input checked={bookingData.paymentMethod === 'vnpay'} onChange={() => setBookingData((p) => ({ ...p, paymentMethod: 'vnpay' }))} className="w-5 h-5 text-primary focus:ring-primary mr-4" name="payment" type="radio" />
                <div className="flex-1 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-secondary">qr_code_2</span>
                    <span className="font-semibold text-on-surface">Cổng VNPay</span>
                  </div>
                </div>
              </label>

              <label className={`flex items-center p-4 rounded-xl border cursor-pointer transition-all ${bookingData.paymentMethod === 'stripe' ? 'border-primary bg-primary/5' : 'border-surface-container hover:border-primary'}`}>
                <input checked={bookingData.paymentMethod === 'stripe'} onChange={() => setBookingData((p) => ({ ...p, paymentMethod: 'stripe' }))} className="w-5 h-5 text-primary focus:ring-primary mr-4" name="payment" type="radio" />
                <div className="flex-1 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary">credit_card</span>
                    <span className="font-semibold text-on-surface">Thanh toán bằng thẻ</span>
                  </div>
                </div>
              </label>
              
              <label className={`flex items-center p-4 rounded-xl border cursor-pointer transition-all ${bookingData.paymentMethod === 'cash' ? 'border-primary bg-primary/5' : 'border-surface-container hover:border-primary'}`}>
                <input checked={bookingData.paymentMethod === 'cash'} onChange={() => setBookingData((p) => ({ ...p, paymentMethod: 'cash' }))} className="w-5 h-5 text-primary focus:ring-primary mr-4" name="payment" type="radio" />
                <div className="flex-1 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-zinc-600">payments</span>
                    <span className="font-semibold text-on-surface">Thanh toán khi lên xe </span>
                  </div>
                </div>
              </label>
            </div>
          </section>
        </div>

        {}
        <div className="lg:col-span-5 sticky top-24">
          <div className="bg-surface-container-lowest rounded-xl shadow-md overflow-hidden border border-surface-container">
            <div className="bg-gradient-to-r from-primary to-primary-container p-6 text-white flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold mb-1">Chi tiết hóa đơn</h3>
                {isRoundTrip && <p className="text-sm opacity-90">Vé khứ hồi</p>}
              </div>
              <div className="text-right">
                <p className="text-xs font-medium opacity-90 uppercase tracking-widest mb-1">Thời gian giữ chỗ</p>
                <div className="flex items-center gap-1 text-2xl font-bold font-mono bg-white/20 px-3 py-1 rounded-lg">
                  <span className="material-symbols-outlined text-[20px]">timer</span>
                  {Math.floor(timeLeft / 60)}:{timeLeft % 60 < 10 ? '0' : ''}{timeLeft % 60}
                </div>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 text-xs font-bold text-primary uppercase tracking-wider mb-[-8px]">
                  Chiều đi: {bookingData.schedule?.fromLocation || "Từ"} ➔ {bookingData.schedule?.toLocation || "Đến"}
                </div>
                <div>
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Ghế đã chọn</p>
                  <p className="font-bold text-sm text-secondary">{bookingData.selectedSeats.length > 0 ? bookingData.selectedSeats.map((s) => s.seatNumber).join(", ") : "Chưa chọn ghế"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Số lượng</p>
                  <p className="font-semibold text-sm">{bookingData.selectedSeats.length} Vé</p>
                </div>
              </div>

              {}
              {isRoundTrip && returnBookingData &&
              <>
                  <div className="h-px bg-surface-container border-t border-dashed"></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 text-xs font-bold text-secondary uppercase tracking-wider mb-[-8px]">
                      Chiều về: {returnBookingData.schedule?.fromLocation || "Từ"} ➔ {returnBookingData.schedule?.toLocation || "Đến"}
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Ghế đã chọn</p>
                      <p className="font-bold text-sm text-secondary">{returnBookingData.selectedSeats.length > 0 ? returnBookingData.selectedSeats.map((s) => s.seatNumber).join(", ") : "Chưa chọn ghế"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Số lượng</p>
                      <p className="font-semibold text-sm">{returnBookingData.selectedSeats.length} Vé</p>
                    </div>
                  </div>
                </>
              }

              <div className="h-px bg-surface-container"></div>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-on-surface-variant">Giá vé cơ bản</span>
                  <span className="font-medium">
                    {((bookingData.totalPrice || 0) + (isRoundTrip && returnBookingData ? returnBookingData.totalPrice || 0 : 0)).toLocaleString()}đ
                  </span>
                </div>
                <div className="pt-4 flex justify-between items-end border-t border-dashed border-outline-variant">
                  <span className="font-bold text-lg">Tổng thanh toán</span>
                  <span className="text-3xl font-extrabold text-[#FF6D00]">
                    {((bookingData.totalPrice || 0) + (isRoundTrip && returnBookingData ? returnBookingData.totalPrice || 0 : 0)).toLocaleString()}đ
                  </span>
                </div>
              </div>
              
              <button onClick={onConfirm} className="w-full bg-primary text-white py-4 rounded-xl font-bold text-lg disabled:opacity-50 hover:bg-primary/90 mt-4 transition-all">
                Thanh toán ngay
              </button>
            </div>
          </div>
        </div>
      </div>
    </>);

}