import React from "react";

const CARD_PAYMENT_STAGES = {
  starting: {
    title: "Đang chuẩn bị thanh toán",
    description: "Chúng tôi đang kiểm tra thông tin thẻ và đơn hàng của bạn.",
    activeStep: 0,
  },
  session: {
    title: "Đang kết nối an toàn",
    description: "Thiết lập kết nối bảo mật với cổng thanh toán của bạn.",
    activeStep: 0,
  },
  confirm: {
    title: "Đang xác thực với ngân hàng",
    description: "Ngân hàng đang xác nhận giao dịch. Vui lòng không đóng trang này.",
    activeStep: 1,
  },
  finalizing: {
    title: "Hoàn tất thanh toán",
    description: "Đang cập nhật vé của bạn. Bạn sẽ được chuyển ngay sau khi xong.",
    activeStep: 2,
  },
};

const CARD_PAYMENT_STEPS = 3;

export default function CardPaymentProcessingOverlay({ stage }) {
  const currentStage = CARD_PAYMENT_STAGES[stage] || CARD_PAYMENT_STAGES.starting;
  const step = Math.min(currentStage.activeStep + 1, CARD_PAYMENT_STEPS);

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/35 backdrop-blur-md px-4">
      <div className="w-full max-w-[380px] bg-white rounded-[28px] shadow-2xl border border-outline-variant/10 overflow-hidden">
        <div className="px-8 pt-9 pb-8 text-center">
          {/* Beautiful calm loader visual */}
          <div className="mx-auto mb-7 relative flex h-20 w-20 items-center justify-center">
            {/* Soft outer ring */}
            <div className="absolute inset-0 rounded-full border-[6px] border-primary/10" />
            {/* Spinning accent ring - very subtle and elegant */}
            <div className="absolute inset-0 rounded-full border-[6px] border-transparent border-t-primary border-r-primary/70 animate-spin" style={{ animationDuration: '1.6s' }} />
            {/* Center icon */}
            <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-primary/8 text-primary">
              <span className="material-symbols-outlined text-[30px]">credit_card</span>
            </div>
          </div>

          {/* Main message - simple and warm */}
          <h2 className="text-[21px] font-extrabold tracking-[-0.3px] text-on-surface mb-2.5">
            {currentStage.title}
          </h2>
          <p className="text-[14.5px] leading-relaxed text-on-surface-variant max-w-[300px] mx-auto">
            {currentStage.description}
          </p>

          {/* Elegant minimal progress dots */}
          <div className="flex justify-center gap-2 mt-7">
            {Array.from({ length: CARD_PAYMENT_STEPS }).map((_, i) => {
              const isActive = i < step;
              return (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${isActive ? 'w-5 bg-primary' : 'w-1.5 bg-outline-variant/40'}`}
                />
              );
            })}
          </div>
        </div>

        {/* Very subtle security footer */}
        <div className="bg-surface-container-low/70 border-t border-outline-variant/10 px-6 py-3.5">
          <div className="flex items-center justify-center gap-2 text-[11px] text-on-surface-variant/70">
            <span className="material-symbols-outlined text-[15px] text-primary/70">verified_user</span>
            <span className="font-medium">Giao dịch được mã hóa và bảo mật</span>
          </div>
        </div>
      </div>
    </div>
  );
}
