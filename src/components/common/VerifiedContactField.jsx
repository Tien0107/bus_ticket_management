import { useState, useEffect } from "react";
import OtpInput from "./OtpInput";

export default function VerifiedContactField({
  field, // "email" | "phone"
  label,
  value,
  onChange, // (newValue: string) => void
  verification,
  setVerification,
  onCheck,
  onSendVerification,
  onVerifyOtp,
  onResend,
  placeholder = "",
  inputType,
}) {
  const ver = verification || {};
  const isVerified = !!ver.verified;
  const type = inputType || (field === "email" ? "email" : "tel");
  const [showOtpModal, setShowOtpModal] = useState(false);

  const handleValueChange = (e) => {
    onChange(e.target.value);
  };

  // Auto open modal when OTP is sent
  useEffect(() => {
    if (ver.sent && !ver.verified) {
      setShowOtpModal(true);
    }
    if (ver.verified) {
      setShowOtpModal(false);
    }
  }, [ver.sent, ver.verified]);

  // Determine right-side action icon and handler
  const getRightAction = () => {
    if (isVerified) {
      return {
        icon: <span className="material-symbols-outlined text-emerald-600 text-[18px]">verified</span>,
        onClick: null,
        title: `${label} đã được xác thực`,
        disabled: true,
      };
    }
    if (ver.checking) {
      return {
        icon: <span className="inline-block w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />,
        onClick: null,
        title: "Đang kiểm tra...",
        disabled: true,
      };
    }
    if (ver.sent && !ver.verified) {
      return {
        icon: <span className="material-symbols-outlined text-primary text-[18px]">key</span>,
        onClick: () => setShowOtpModal(true),
        title: "Nhập mã OTP",
        disabled: false,
      };
    }
    if (ver.checked) {
      return {
        icon: <span className="material-symbols-outlined text-emerald-600 text-[18px]">send</span>,
        onClick: () => {
          onSendVerification();
        },
        title: "Gửi mã OTP",
        disabled: ver.sending,
      };
    }
    // Default: check availability
    return {
      icon: <span className="material-symbols-outlined text-[18px]">fact_check</span>,
      onClick: onCheck,
      title: `Kiểm tra ${label.toLowerCase()} khả dụng`,
      disabled: ver.sending || ver.verifying || !value.trim(),
    };
  };

  const rightAction = getRightAction();

  const closeModal = () => setShowOtpModal(false);

  const handleResendInModal = async () => {
    await onResend();
    // Modal stays open
  };

  const handleVerifyInModal = () => {
    onVerifyOtp();
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-on-surface-variant ml-1">{label}</label>
      <div className="relative">
        <input
          className={`w-full bg-white border-0 rounded-xl p-4 pr-12 text-on-surface ring-1 ring-outline-variant/30 focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-gray-400 ${ver.checked && !isVerified ? 'ring-emerald-500/40' : ''}`}
          placeholder={placeholder}
          type={type}
          value={value}
          onChange={handleValueChange}
          required
          disabled={isVerified}
        />
        <button
          type="button"
          onClick={rightAction.onClick}
          disabled={rightAction.disabled}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-primary hover:bg-primary/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title={rightAction.title}
        >
          {rightAction.icon}
        </button>
      </div>

      {ver.error && <p className="text-xs text-red-600">{ver.error}</p>}

      {/* Minimal status - no big stacked blocks */}
      {ver.checked && !ver.verified && !ver.sent && (
        <div className="text-emerald-600 text-[11px] font-medium flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">check_circle</span>
          <span>Đã kiểm tra - sẵn sàng gửi mã</span>
        </div>
      )}

      {ver.verified && (
        <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-semibold">
          <span className="material-symbols-outlined text-base">verified</span>
          <span>{label} đã xác thực</span>
        </div>
      )}

      {/* Centered OTP Modal */}
      {showOtpModal && ver.sent && !ver.verified && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[360px] overflow-hidden">
            <div className="px-5 pt-5 pb-3">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-base font-bold text-on-surface">Xác thực {label}</div>
                  <div className="text-xs text-on-surface-variant mt-0.5 truncate max-w-[240px]">
                    Mã đã gửi đến: {value}
                  </div>
                </div>
                <button
                  onClick={closeModal}
                  className="text-on-surface-variant hover:text-on-surface p-1"
                  aria-label="Đóng"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="flex justify-center py-3">
                <OtpInput
                  value={ver.otp || ""}
                  onChange={(val) => setVerification((s) => ({ ...s, otp: val, error: "" }))}
                  disabled={ver.verifying}
                  length={6}
                />
              </div>

              {ver.error && (
                <p className="text-center text-xs text-red-600 font-medium mb-2">{ver.error}</p>
              )}
            </div>

            <div className="bg-surface-container-lowest px-5 py-4 flex items-center gap-3 border-t">
              <button
                type="button"
                onClick={handleVerifyInModal}
                disabled={ver.verifying || !(ver.otp || "").trim()}
                className="flex-1 px-4 py-2.5 text-sm font-bold rounded-xl bg-primary text-white disabled:opacity-60 active:scale-[0.985] transition"
              >
                {ver.verifying ? "Đang xác thực..." : "Xác thực"}
              </button>
              <button
                type="button"
                onClick={handleResendInModal}
                disabled={ver.sending}
                className="px-4 py-2.5 text-sm font-medium text-primary hover:bg-primary/5 rounded-xl disabled:opacity-60"
              >
                Gửi lại
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
