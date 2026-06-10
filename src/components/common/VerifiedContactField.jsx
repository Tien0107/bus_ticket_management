import { useState, useEffect } from "react";
import OtpInput from "./OtpInput";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^(?:\+84|0)\d{9}$/;

function isValidFormat(field, val) {
  const v = (val || "").trim();
  if (!v) return false;
  if (field === "email") return EMAIL_REGEX.test(v);
  if (field === "phone") return PHONE_REGEX.test(v);
  return true;
}

function getFormatError(field, val) {
  const v = (val || "").trim();
  if (!v) return `Vui lòng nhập ${field === "email" ? "email" : "số điện thoại"}.`;
  if (field === "email") return "Email không hợp lệ. Vui lòng nhập đúng định dạng (ví dụ: ten@email.com).";
  if (field === "phone") return "Số điện thoại không hợp lệ. Vui lòng nhập số Việt Nam (10 chữ số, bắt đầu bằng 0 hoặc +84).";
  return "";
}

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
  requireOtpVerification = true,
  inputDisabled = false,
}) {
  const ver = verification || {};
  const isVerified = !!ver.verified;
  const isCheckOnlyReady = !requireOtpVerification && !!ver.checked && !isVerified;
  const isReady = isVerified || isCheckOnlyReady;
  const type = inputType || (field === "email" ? "email" : "tel");
  const shouldDisableInput = isVerified || inputDisabled;
  const [showOtpModal, setShowOtpModal] = useState(false);

  const handleValueChange = (e) => {
    onChange(e.target.value);
    // Clear previous error (format or availability) as soon as user edits the field
    if (ver.error) {
      setVerification?.((s) => ({ ...s, error: "" }));
    }
  };

  // Auto open modal when OTP is sent
  useEffect(() => {
    if (requireOtpVerification && ver.sent && !ver.verified) {
      setShowOtpModal(true);
    }
    if (ver.verified) {
      setShowOtpModal(false);
    }
  }, [ver.sent, ver.verified, requireOtpVerification]);

  // Compact suffix button/badge rendered *inside* the input on the right
  const renderSuffixAction = () => {
    const compact =
      "px-2.5 py-1 text-xs font-semibold rounded-md transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-1";

    if (isReady) {
      return (
        <span className="flex items-center gap-1 text-emerald-600" title={`${label} đã kiểm tra`}>
          <span className="material-symbols-outlined text-base">check_circle</span>
        </span>
      );
    }

    if (requireOtpVerification && ver.sent && !ver.verified) {
      return (
        <button
          type="button"
          onClick={() => setShowOtpModal(true)}
          disabled={ver.verifying}
          className={`${compact} bg-primary/10 text-primary hover:bg-primary/15 border border-primary/30`}
          title="Nhập mã xác minh"
        >
          <span className="material-symbols-outlined text-sm">key</span>
          Nhập mã
        </button>
      );
    }

    if (requireOtpVerification && ver.checked) {
      return (
        <button
          type="button"
          onClick={() => onSendVerification && onSendVerification()}
          disabled={ver.sending || ver.verifying}
          className={`${compact} bg-primary text-white hover:bg-primary/90`}
          title="Gửi mã xác minh"
        >
          {ver.sending ? (
            <span className="inline-block w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : (
            "Xác minh"
          )}
        </button>
      );
    }

    // Default: Kiểm tra (inside the input)
    const handleCheckClick = () => {
      const val = value?.trim() || "";
      if (!val) {
        setVerification?.((s) => ({ ...s, error: getFormatError(field, val) }));
        return;
      }
      if (!isValidFormat(field, val)) {
        setVerification?.((s) => ({ ...s, error: getFormatError(field, val) }));
        return;
      }
      onCheck && onCheck();
    };

    return (
      <button
        type="button"
        onClick={handleCheckClick}
        disabled={ver.checking || ver.sending || ver.verifying || !isValidFormat(field, value)}
        className={`${compact} bg-primary/10 text-primary hover:bg-primary/15 border border-primary/30`}
        title={`Kiểm tra ${label.toLowerCase()} khả dụng`}
      >
        {ver.checking ? (
          <span className="inline-block w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        ) : (
          "Kiểm tra"
        )}
      </button>
    );
  };

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
          className={`w-full bg-white border-0 rounded-xl p-4 pr-28 text-on-surface ring-1 ring-outline-variant/30 focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-gray-400 ${ver.checked && !isVerified ? 'ring-emerald-500/40' : ''}`}
          placeholder={placeholder}
          type={type}
          value={value}
          onChange={handleValueChange}
          required
          disabled={shouldDisableInput}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          {renderSuffixAction()}
        </div>
      </div>

      {ver.error && <p className="text-xs text-red-600">{ver.error}</p>}

      {/* Minimal status - no big stacked blocks */}
      {ver.checked && requireOtpVerification && !ver.verified && !ver.sent && (
        <div className="text-emerald-600 text-[11px] font-medium flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">check_circle</span>
          <span>Đã kiểm tra - sẵn sàng gửi mã</span>
        </div>
      )}
      {ver.checked && !requireOtpVerification && (
        <div className="text-emerald-600 text-[11px] font-medium flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">check_circle</span>
          <span>Đã kiểm tra khả dụng</span>
        </div>
      )}

      {/* verified state is shown inline next to input via renderActionButton */}

      {/* Centered OTP Modal */}
      {showOtpModal && requireOtpVerification && ver.sent && !ver.verified && (
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
