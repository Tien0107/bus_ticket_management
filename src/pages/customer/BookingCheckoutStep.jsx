import React, { useState, useEffect } from "react";
import { checkCoupon, getCoupons } from "../../api/customer";

const couponListKeys = ["items", "coupons", "records", "content", "results", "list", "data"];

const getCouponCode = (coupon) => {
  if (typeof coupon === "string") return coupon.trim();
  return String(coupon?.code || coupon?.couponCode || coupon?.coupon?.code || "").trim();
};

const extractCouponList = (response) => {
  const root = response?.data ?? response;
  const visited = new Set();

  const findList = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) return value.filter(Boolean);
    if (typeof value !== "object" || visited.has(value)) return [];

    visited.add(value);
    for (const key of couponListKeys) {
      const list = findList(value[key]);
      if (list.length > 0) return list;
    }

    return [];
  };

  return findList(root).filter((coupon) => getCouponCode(coupon));
};

const formatCouponDiscount = (coupon) => {
  if (typeof coupon === "string") return "";

  const rawValue = coupon?.discountValue ?? coupon?.discountAmount ?? coupon?.discount ?? coupon?.amount ?? coupon?.value;
  const discountValue = Number(rawValue);
  if (!Number.isFinite(discountValue) || discountValue <= 0) return "";

  const discountType = String(coupon?.discountType || coupon?.type || "").toLowerCase();
  if (discountType.includes("percent") || discountType.includes("percentage")) {
    return `${discountValue}%`;
  }

  return `${discountValue.toLocaleString("vi-VN")}đ`;
};

const formatVnd = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return "";
  return `${amount.toLocaleString("vi-VN")}đ`;
};

const getCouponCompanyId = (bookingData) => {
  const candidates = [
    bookingData?.preparedCompanyId,
    bookingData?.companyId,
    bookingData?.schedule?.companyId,
    bookingData?.schedule?.company?.id,
  ];

  return candidates.find((value) => Number.isFinite(Number(value)) && Number(value) > 0) || null;
};

const getCouponQuantityLabel = (coupon) => {
  if (typeof coupon === "string") return "";
  const total = Number(coupon?.totalQuantity);
  const used = Number(coupon?.usedQuantity || 0);
  if (!Number.isFinite(total) || total <= 0) return "";
  return `Còn ${Math.max(0, total - used)}/${total}`;
};

const getCouponDateLabel = (coupon) => {
  if (typeof coupon === "string" || !coupon?.endDate) return "";
  const endDate = new Date(coupon.endDate);
  if (Number.isNaN(endDate.getTime())) return "";
  return `HSD ${endDate.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}`;
};

export default function BookingCheckoutStep({ bookingData, returnBookingData, isRoundTrip, setBookingData, onBack, onConfirm }) {
  const [couponCode, setCouponCode] = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [appliedCouponInfo, setAppliedCouponInfo] = useState(null);

  // Danh sách mã giảm giá từ API
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);

  const currentTotal = Number(bookingData.totalPrice || 0) + Number(isRoundTrip && returnBookingData ? (returnBookingData.totalPrice || 0) : 0);
  const couponCompanyId = getCouponCompanyId(bookingData);

  // Sync coupon from parent (in case it was pre-filled or came from previous step)
  useEffect(() => {
    const code = getCouponCode(bookingData.coupon);
    if (!code) return;

    const discountAmount = Number(bookingData.discountAmount || 0);
    setAppliedCouponInfo((current) => {
      if (current?.code === code && Number(current?.discountAmount || 0) === discountAmount) {
        return current;
      }
      return { code, discountAmount };
    });
  }, [bookingData.coupon, bookingData.discountAmount]);

  // Fetch danh sách coupon cho customer: GET /customer/coupon?orderTotal=xxx&next=yyy (orderTotal bắt buộc, next optional cho pagination cursor)
  // Sử dụng companyId từ prepare API (từ bookingData)
  useEffect(() => {
    const loadAvailableCoupons = async () => {
      if (!currentTotal || currentTotal <= 0) {
        setAvailableCoupons([]);
        return;
      }
      if (!couponCompanyId) {
        setAvailableCoupons([]);
        return;
      }
      try {
        setLoadingCoupons(true);
        const params = {
          companyId: couponCompanyId,
          orderTotal: currentTotal,
        };
        const res = await getCoupons(params);
        setAvailableCoupons(extractCouponList(res));
      } catch (err) {
        console.warn("Không thể tải danh sách mã giảm giá:", err);
        setAvailableCoupons([]);
      } finally {
        setLoadingCoupons(false);
      }
    };
    loadAvailableCoupons();
  }, [currentTotal, couponCompanyId]);

  const discountAmount = bookingData.discountAmount || (appliedCouponInfo?.discountAmount || 0);
  const finalTotal = Math.max(0, currentTotal - discountAmount);
  const activeCouponCode = String(appliedCouponInfo?.code || getCouponCode(bookingData.coupon)).toUpperCase();

  const handleApplyCoupon = async (codeOverride) => {
    const code = (codeOverride || couponCode || "").trim().toUpperCase();
    if (!code) return;

    if (!currentTotal || currentTotal <= 0) {
      setCouponError("Chưa có giá vé để áp dụng mã giảm giá.");
      return;
    }

    if (!couponCompanyId) {
      setCouponError("Thiếu companyId từ prepare để kiểm tra mã giảm giá.");
      return;
    }

    setApplyingCoupon(true);
    setCouponError("");

    try {
      const res = await checkCoupon({ 
        code, 
        orderTotal: currentTotal,
        companyId: couponCompanyId
      });
      const data = res?.data || res || {};
      const payload = data?.data && typeof data.data === "object" ? data.data : data;

      if (data.valid === false || data.success === false || payload.valid === false || payload.success === false) {
        throw new Error(data.message || payload.message || "Mã giảm giá không hợp lệ.");
      }

      const coupon = payload.coupon || payload;
      const discount = Number(payload.discountAmount ?? payload.discount ?? coupon.discountAmount ?? coupon.discountValue ?? 0);

      setBookingData(prev => ({
        ...prev,
        coupon: coupon?.id ? coupon : { ...coupon, code },
        discountAmount: discount
      }));

      setAppliedCouponInfo({ code: coupon?.code || code, discountAmount: discount });
      setCouponCode("");
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Mã giảm giá không hợp lệ hoặc đã hết hạn.";
      setCouponError(msg);
    } finally {
      setApplyingCoupon(false);
    }
  };

  // Helper cho click từ danh sách coupon
  const handleClickCoupon = (coupon) => {
    const code = getCouponCode(coupon);
    if (code) {
      handleApplyCoupon(code);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCouponInfo(null);
    setCouponError("");
    setBookingData(prev => {
      const { coupon, discountAmount, ...rest } = prev;
      return rest;
    });
  };

  return (
    <>
      {}
      <div className="mb-6">
        <div className="flex items-center justify-between max-w-2xl mx-auto relative cursor-pointer" onClick={onBack}>
           <div className="flex flex-col items-center z-10">
              <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold mb-1">
                 <span className="material-symbols-outlined text-xs">check</span>
              </div>
              <span className="text-xs font-medium text-primary">Chọn chuyến & Ghế</span>
           </div>
           
           <div className="absolute top-4 left-0 w-full h-[2px] bg-surface-container -z-0">
              <div className="h-full bg-primary w-1/2"></div>
           </div>
           
           <div className="flex flex-col items-center z-10 disabled">
              <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold mb-1">2</div>
              <span className="text-xs font-medium text-primary">Thanh toán</span>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start mb-8">
        {}
        <div className="lg:col-span-7 space-y-4">
          


          <section className="bg-surface-container-lowest p-4 rounded-xl shadow-sm">
            <h2 className="text-base font-bold mb-3 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary">account_balance_wallet</span>
              Phương thức thanh toán
            </h2>
            <div className="space-y-3">
              <label className={`flex min-h-[48px] items-center p-3 rounded-lg border cursor-pointer transition-all ${bookingData.paymentMethod === 'vnpay' ? 'border-primary bg-primary/5' : 'border-surface-container hover:border-primary'}`}>
                <input checked={bookingData.paymentMethod === 'vnpay'} onChange={() => setBookingData((p) => ({ ...p, paymentMethod: 'vnpay' }))} className="w-4 h-4 text-primary focus:ring-primary mr-3" name="payment" type="radio" />
                <div className="flex-1 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary text-sm">qr_code_2</span>
                    <span className="font-semibold text-on-surface text-sm">Cổng VNPay</span>
                  </div>
                </div>
              </label>

              <label className={`flex min-h-[48px] items-center p-3 rounded-lg border cursor-pointer transition-all ${bookingData.paymentMethod === 'stripe' ? 'border-primary bg-primary/5' : 'border-surface-container hover:border-primary'}`}>
                <input checked={bookingData.paymentMethod === 'stripe'} onChange={() => setBookingData((p) => ({ ...p, paymentMethod: 'stripe' }))} className="w-4 h-4 text-primary focus:ring-primary mr-3" name="payment" type="radio" />
                <div className="flex-1 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-sm">credit_card</span>
                    <span className="font-semibold text-on-surface text-sm">Thanh toán bằng thẻ</span>
                  </div>
                </div>
              </label>
              
              <label className={`flex min-h-[48px] items-center p-3 rounded-lg border cursor-pointer transition-all ${bookingData.paymentMethod === 'cash' ? 'border-primary bg-primary/5' : 'border-surface-container hover:border-primary'}`}>
                <input checked={bookingData.paymentMethod === 'cash'} onChange={() => setBookingData((p) => ({ ...p, paymentMethod: 'cash' }))} className="w-4 h-4 text-primary focus:ring-primary mr-3" name="payment" type="radio" />
                <div className="flex-1 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-zinc-600 text-sm">payments</span>
                    <span className="font-semibold text-on-surface text-sm">Thanh toán khi lên xe</span>
                  </div>
                </div>
              </label>

              <div className="mt-4 space-y-3 border-t border-outline-variant/30 pt-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <span className="material-symbols-outlined text-[18px]">sell</span>
                    </span>
                    <div>
                      <p className="text-sm font-black text-on-surface">Mã giảm giá</p>
                      <p className="text-[11px] font-semibold text-on-surface-variant">
                        Tổng đơn {currentTotal.toLocaleString("vi-VN")}đ
                      </p>
                    </div>
                  </div>
                  {availableCoupons.length > 0 ? (
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-black text-primary">
                      {availableCoupons.length} mã khả dụng
                    </span>
                  ) : null}
                </div>

                {appliedCouponInfo || bookingData.coupon ? (
                  <div className="overflow-hidden rounded-xl border border-primary/25 bg-primary/5">
                    <div className="flex items-center justify-between gap-3 px-3 py-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-white">
                          <span className="material-symbols-outlined text-xl">check_circle</span>
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-mono text-base font-black tracking-wide text-primary">
                            {appliedCouponInfo?.code || bookingData.coupon?.code || "Đã áp dụng"}
                          </p>
                          {discountAmount > 0 ? (
                            <p className="text-xs font-bold text-primary">Đã giảm {discountAmount.toLocaleString("vi-VN")}đ</p>
                          ) : (
                            <p className="text-xs font-semibold text-on-surface-variant">Mã đang được áp dụng cho đơn này</p>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        className="shrink-0 rounded-lg border border-primary/20 bg-white px-3 py-1.5 text-xs font-black text-primary transition hover:border-red-200 hover:text-red-600"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-outline-variant/25 bg-white p-2.5 shadow-sm">
                    <div className="flex gap-2">
                      <div className="relative min-w-0 flex-1">
                        <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-primary/70">
                          confirmation_number
                        </span>
                        <input
                          type="text"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
                          placeholder="Nhập mã ưu đãi"
                          className="h-11 w-full rounded-lg border border-outline-variant/40 bg-surface-container-low/60 pl-10 pr-3 text-sm font-bold uppercase tracking-wide text-on-surface outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        disabled={applyingCoupon || !couponCode.trim()}
                        className="inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-black text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <span className={`material-symbols-outlined text-[17px] ${applyingCoupon ? "animate-spin" : ""}`}>
                          {applyingCoupon ? "progress_activity" : "add_task"}
                        </span>
                        Áp dụng
                      </button>
                    </div>
                  </div>
                )}

                {couponError && (
                  <div className="flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs font-bold text-red-600">
                    <span className="material-symbols-outlined text-[16px]">error</span>
                    <span>{couponError}</span>
                  </div>
                )}

                {(availableCoupons.length > 0 || loadingCoupons) && (
                  <div className="rounded-xl border border-primary/10 bg-primary/5 p-3">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="text-xs font-black uppercase tracking-wide text-primary">Ưu đãi khả dụng</p>
                      <p className="text-[11px] font-bold text-on-surface-variant">
                        {activeCouponCode ? "Có thể đổi sang mã khác" : "Bấm “Áp dụng mã” để dùng ngay"}
                      </p>
                    </div>
                    <div className="grid max-h-[360px] grid-cols-1 gap-2 overflow-auto pr-1 sm:grid-cols-2">
                      {availableCoupons.length === 0 && loadingCoupons ? (
                        Array.from({ length: 2 }).map((_, idx) => (
                          <div key={idx} className="h-28 animate-pulse rounded-xl bg-white/80 ring-1 ring-outline-variant/20" />
                        ))
                      ) : (
                        availableCoupons.map((c, idx) => {
                          const code = getCouponCode(c);
                          if (!code) return null;
                          const discountInfo = formatCouponDiscount(c);
                          const minOrderLabel = formatVnd(c?.minOrderAmount);
                          const maxDiscountLabel = formatVnd(c?.maxDiscountAmount);
                          const quantityLabel = getCouponQuantityLabel(c);
                          const dateLabel = getCouponDateLabel(c);
                          const isCurrentCoupon = code.toUpperCase() === activeCouponCode;
                          return (
                            <button
                              key={c?.id || code || idx}
                              type="button"
                              onClick={() => {
                                if (!isCurrentCoupon) handleClickCoupon(c);
                              }}
                              disabled={applyingCoupon}
                              aria-current={isCurrentCoupon ? "true" : undefined}
                              className={`group relative overflow-hidden rounded-xl border p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_12px_28px_rgba(0,110,28,0.10)] disabled:cursor-not-allowed disabled:opacity-60 ${
                                isCurrentCoupon
                                  ? "border-primary/50 bg-primary/5 ring-1 ring-primary/20"
                                  : "border-outline-variant/25 bg-white"
                              }`}
                            >
                              <span className="absolute bottom-0 left-0 top-0 w-1 bg-primary" />
                              <span className="absolute -left-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-primary/5 ring-1 ring-primary/10" />
                              <span className="absolute -right-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-primary/5 ring-1 ring-primary/10" />
                              <span className="flex items-start justify-between gap-3">
                                <span className="min-w-0">
                                  <span className="block truncate font-mono text-base font-black tracking-wide text-primary">{code}</span>
                                  <span className="mt-1 block text-[11px] font-bold text-on-surface-variant">
                                    {minOrderLabel ? `Đơn từ ${minOrderLabel}` : "Áp dụng cho đơn hiện tại"}
                                  </span>
                                </span>
                                {discountInfo ? (
                                  <span className="shrink-0 rounded-lg bg-primary/10 px-2.5 py-1 text-sm font-black text-primary">
                                    {discountInfo}
                                  </span>
                                ) : null}
                              </span>
                              <span className="mt-3 flex flex-wrap items-center gap-1.5">
                                {maxDiscountLabel ? (
                                  <span className="rounded-md bg-surface-container-low px-2 py-1 text-[10px] font-bold text-on-surface-variant">
                                    Tối đa {maxDiscountLabel}
                                  </span>
                                ) : null}
                                {quantityLabel ? (
                                  <span className="rounded-md bg-surface-container-low px-2 py-1 text-[10px] font-bold text-on-surface-variant">
                                    {quantityLabel}
                                  </span>
                                ) : null}
                                {dateLabel ? (
                                  <span className="rounded-md bg-surface-container-low px-2 py-1 text-[10px] font-bold text-on-surface-variant">
                                    {dateLabel}
                                  </span>
                                ) : null}
                              </span>
                              <span
                                className={`mt-3 flex h-8 items-center justify-center rounded-lg border text-xs font-black transition ${
                                  isCurrentCoupon
                                    ? "border-primary bg-primary text-white"
                                    : "border-primary/20 bg-primary/5 text-primary group-hover:bg-primary group-hover:text-white"
                                }`}
                              >
                                {isCurrentCoupon ? "Đang áp dụng" : "Áp dụng mã"}
                              </span>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
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
                <div className="flex items-center gap-1.5 text-sm font-bold bg-white/20 px-3 py-1.5 rounded-lg">
                  <span className="material-symbols-outlined text-[18px]">timer</span>
                  <span>Vé sẽ tự hủy sau 10 phút</span>
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
              
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-on-surface-variant">Giá vé cơ bản</span>
                  <span className="font-medium">{currentTotal.toLocaleString()}đ</span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-xs text-green-600">
                    <span>Giảm giá</span>
                    <span className="font-medium">–{discountAmount.toLocaleString()}đ</span>
                  </div>
                )}

                <div className="pt-2 flex justify-between items-end border-t border-dashed border-outline-variant">
                  <span className="font-bold text-sm">Tổng thanh toán</span>
                  <span className="text-2xl font-extrabold text-[#FF6D00]">
                    {finalTotal.toLocaleString()}đ
                  </span>
                </div>
              </div>
              
              <button onClick={onConfirm} className="w-full bg-primary text-white py-3 rounded-lg font-bold text-sm disabled:opacity-50 hover:bg-primary/90 mt-3 transition-all">
                Thanh toán ngay
              </button>
            </div>
          </div>
        </div>
      </div>
    </>);

}
