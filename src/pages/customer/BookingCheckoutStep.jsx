import React, { useState, useEffect } from "react";
import { checkCoupon, getMyCoupons } from "../../api/customer";

export default function BookingCheckoutStep({ bookingData, setBookingData, onBack, onConfirm }) {
  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState("");
  const [discountVal, setDiscountVal] = useState(0);
  const [availableCoupons, setAvailableCoupons] = useState([]);

  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const res = await getMyCoupons({ orderTotal: bookingData.totalPrice || 0 });
        setAvailableCoupons(res.data?.coupons || res.data || []);
      } catch (err) {
        console.error("Lấy danh sách mã giảm giá thất bại", err);
      }
    };
    fetchCoupons();
  }, [bookingData.totalPrice]);

  const applyCoupon = async (overrideCode) => {
    const codeToSubmit = typeof overrideCode === 'string' ? overrideCode : couponInput;
    if (!codeToSubmit.trim()) {
       setCouponError("Vui lòng nhập mã!");
       return;
    }
    setCouponInput(codeToSubmit);
    setCouponError("");
    try {
      const res = await checkCoupon({ code: codeToSubmit.trim(), orderTotal: bookingData.totalPrice });
      const data = res.data;
      if (data && data.discountAmount) {
         setDiscountVal(data.discountAmount);
         setBookingData(p => ({
            ...p,
            coupon: { id: data.id || null, detailId: data.detailId || null, code: codeToSubmit }
         }));
      } else {
         setCouponError("Mã không hợp lệ hoặc không có giảm giá.");
      }
    } catch (err) {
      setCouponError(err.response?.data?.message || "Mã không hợp lệ hoặc đã hết hạn.");
      setDiscountVal(0);
      setBookingData(p => ({ ...p, coupon: null }));
    }
  };

  const handleChangeInfo = (e) => {
    const { name, value } = e.target;
    setBookingData(prev => ({
      ...prev,
      passengerInfo: { ...prev.passengerInfo, [name]: value }
    }));
  };

  return (
    <>
      {/* Progress Steps Header */}
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
        {/* Left Column: Forms */}
        <div className="lg:col-span-7 space-y-8">
          


          <section className="bg-surface-container-lowest p-8 rounded-xl shadow-sm">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">sell</span>
              Mã giảm giá
            </h2>
            <div className="flex gap-4">
              <input value={couponInput} onChange={(e) => setCouponInput(e.target.value)} className="flex-1 bg-surface-container-low border-none rounded-xl p-3 focus:ring-2 focus:ring-primary/20 outline-none" placeholder="Nhập mã ưu đãi" type="text" />
              <button onClick={applyCoupon} className="bg-surface-container-highest text-on-surface px-8 py-3 rounded-xl font-bold hover:bg-outline-variant transition-colors">Áp dụng</button>
            </div>
            {couponError && <p className="text-red-500 text-sm mt-2">{couponError}</p>}
            {discountVal > 0 && <p className="text-green-600 font-semibold text-sm mt-2">Đã áp dụng mã: Giảm {discountVal.toLocaleString()}đ</p>}
            
            {availableCoupons.length > 0 && (
              <div className="mt-6 border-t border-surface-container pt-4">
                <p className="text-sm font-semibold text-on-surface-variant mb-3">Mã ưu đãi có sẵn trong Ví:</p>
                <div className="flex flex-wrap gap-2">
                  {availableCoupons.map(c => {
                    const discountLabel = String(c.discountType).toLowerCase() === 'percent'
                      ? `Giảm ${c.discountValue}%`
                      : `Giảm ${Number(c.discountValue || 0).toLocaleString()}đ`;
                    return (
                      <button key={c.id || c.code} onClick={() => applyCoupon(c.code)} className="flex items-center gap-2 bg-primary/5 hover:bg-primary/20 text-primary border border-primary/20 transition-all px-4 py-2 rounded-xl text-sm font-bold shadow-sm">
                        <span className="material-symbols-outlined text-[16px]">confirmation_number</span>
                        <span>{c.code}</span>
                        <span className="text-xs bg-primary/10 px-2 py-0.5 rounded-full text-primary/80">{discountLabel}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </section>

          <section className="bg-surface-container-lowest p-8 rounded-xl shadow-sm">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">account_balance_wallet</span>
              Phương thức thanh toán
            </h2>
            <div className="space-y-4">
              <label className="flex items-center p-4 rounded-xl border border-primary bg-primary/5 cursor-pointer transition-all">
                <input checked={bookingData.paymentMethod === 'vnpay'} onChange={() => setBookingData(p => ({...p, paymentMethod: 'vnpay'}))} className="w-5 h-5 text-primary focus:ring-primary mr-4" name="payment" type="radio" />
                <div className="flex-1 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-secondary">qr_code_2</span>
                    <span className="font-semibold text-on-surface">Cổng VNPay</span>
                  </div>
                </div>
              </label>
              
              <label className="flex items-center p-4 rounded-xl border border-surface-container hover:border-primary cursor-pointer transition-all">
                <input checked={bookingData.paymentMethod === 'offline'} onChange={() => setBookingData(p => ({...p, paymentMethod: 'offline'}))} className="w-5 h-5 text-primary focus:ring-primary mr-4" name="payment" type="radio" />
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

        {/* Right Column: Checkout Summary */}
        <div className="lg:col-span-5 sticky top-24">
          <div className="bg-surface-container-lowest rounded-xl shadow-md overflow-hidden border border-surface-container">
            <div className="bg-gradient-to-r from-primary to-primary-container p-6 text-white">
              <h3 className="text-xl font-bold mb-1">Chi tiết hóa đơn</h3>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Ghế đã chọn</p>
                  <p className="font-bold text-sm text-secondary">{bookingData.selectedSeats.length > 0 ? bookingData.selectedSeats.map(s => s.seatNumber).join(", ") : "Chưa chọn ghế"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Số lượng</p>
                  <p className="font-semibold text-sm">{bookingData.selectedSeats.length} Vé</p>
                </div>
              </div>
              <div className="h-px bg-surface-container"></div>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-on-surface-variant">Giá vé cơ bản</span>
                  <span className="font-medium">{bookingData.totalPrice.toLocaleString()}đ</span>
                </div>
                {discountVal > 0 && (
                   <div className="flex justify-between text-sm text-green-600">
                     <span className="font-medium">Giảm giá voucher</span>
                     <span className="font-bold">-{discountVal.toLocaleString()}đ</span>
                   </div>
                )}
                <div className="pt-4 flex justify-between items-end border-t border-dashed border-outline-variant">
                  <span className="font-bold text-lg">Tổng thanh toán</span>
                  <span className="text-3xl font-extrabold text-[#FF6D00]">{(bookingData.totalPrice - discountVal > 0 ? bookingData.totalPrice - discountVal : 0).toLocaleString()}đ</span>
                </div>
              </div>
              
              <button onClick={onConfirm} className="w-full bg-primary text-white py-4 rounded-xl font-bold text-lg disabled:opacity-50 hover:bg-primary/90 mt-4 transition-all">
                Xác nhận & Giữ chỗ
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
