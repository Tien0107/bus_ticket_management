import React from "react";

const CARD_PAYMENT_STAGES = {
  starting: {
    title: "Đang chuẩn bị thanh toán thẻ",
    description: "Hệ thống đang kiểm tra thẻ và đơn hàng của bạn.",
    activeStep: 0,
  },
  session: {
    title: "Đang tạo phiên thanh toán an toàn",
    description: "BusGo đang kết nối tới cổng thanh toán thẻ bảo mật.",
    activeStep: 0,
  },
  confirm: {
    title: "Đang chờ ngân hàng xác thực",
    description: "Giao dịch thẻ đang được xử lý. Vui lòng không đóng trình duyệt.",
    activeStep: 1,
  },
  finalizing: {
    title: "Thanh toán đã được ghi nhận",
    description: "Đang đồng bộ trạng thái vé và chuẩn bị chuyển bạn tới trang quản lý vé.",
    activeStep: 2,
  },
};

const CARD_PAYMENT_STEPS = ["Tạo phiên", "Xác thực", "Cập nhật vé"];

export default function CardPaymentProcessingOverlay({ stage }) {
  const currentStage = CARD_PAYMENT_STAGES[stage] || CARD_PAYMENT_STAGES.starting;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#07130b]/75 px-4 backdrop-blur-md">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-white/15 bg-white shadow-[0_28px_90px_rgba(0,0,0,0.35)]">
        <div className="bg-gradient-to-br from-[#101828] via-[#13391e] to-primary px-6 py-5 text-white">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/12 ring-1 ring-white/20">
                <span className="material-symbols-outlined text-[24px]">lock</span>
              </span>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-white/65">SECURE CARD CHECKOUT</p>
                <p className="text-sm font-bold text-white">BusGo Secure Pay</p>
              </div>
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              {["VISA", "MC", "AMEX"].map((brand) => (
                <span key={brand} className="rounded-md bg-white/12 px-2 py-1 text-[10px] font-black text-white ring-1 ring-white/15">
                  {brand}
                </span>
              ))}
            </div>
          </div>

          <div className="relative mx-auto mb-5 h-28 w-28">
            <div className="absolute inset-0 rounded-full border-[7px] border-white/10" />
            <div className="absolute inset-0 rounded-full border-[7px] border-transparent border-r-white border-t-white animate-spin" />
            <div className="absolute inset-4 flex items-center justify-center rounded-full bg-white text-primary shadow-[0_18px_40px_rgba(0,0,0,0.24)]">
              <span className="material-symbols-outlined text-[34px]">credit_card</span>
            </div>
          </div>

          <div className="text-center">
            <h2 className="text-xl font-black tracking-tight">{currentStage.title}</h2>
            <p className="mx-auto mt-2 max-w-xs text-sm font-medium leading-6 text-white/75">
              {currentStage.description}
            </p>
          </div>
        </div>

        <div className="px-6 py-5">
          <div className="mb-5 grid grid-cols-3 gap-2">
            {CARD_PAYMENT_STEPS.map((step, index) => {
              const isDone = index < currentStage.activeStep;
              const isActive = index === currentStage.activeStep;
              return (
                <div
                  key={step}
                  className={`rounded-xl border px-3 py-2 text-center text-[11px] font-black transition-colors ${
                    isDone
                      ? "border-primary bg-primary text-white"
                      : isActive
                        ? "border-primary/30 bg-primary/10 text-primary"
                        : "border-outline-variant/30 bg-surface-container-low text-on-surface-variant"
                  }`}
                >
                  <span className={`material-symbols-outlined mb-1 block text-[17px] ${isActive ? "animate-spin" : ""}`}>
                    {isDone ? "check" : isActive ? "progress_activity" : "radio_button_unchecked"}
                  </span>
                  {step}
                </div>
              );
            })}
          </div>

          <div className="rounded-2xl border border-outline-variant/25 bg-surface-container-low px-4 py-3">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined mt-0.5 text-[20px] text-primary">verified_user</span>
              <p className="text-sm font-semibold leading-6 text-on-surface-variant">
                Thông tin thẻ được xử lý qua cổng thanh toán đạt chuẩn bảo mật quốc tế. BusGo không lưu số thẻ đầy đủ hoặc mã CVC của bạn.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
