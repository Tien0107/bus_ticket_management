import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { driverSignUp } from "../../api/driver";
import { useToast } from "../../context/ToastContext";
import { contactCheck, sendOtp, contactVerify } from "../../api/auth";
import VerifiedContactField from "../../components/common/VerifiedContactField";
import CompanySelect from "../../components/common/CompanySelect";

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[#@$%&!*?^_])[^\s]+$/;

export default function DriverRegisterForm() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    companyId: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // When true: the contact fields switch to OTP verification mode (triggered on register click)
  const [verificationPhase, setVerificationPhase] = useState(false);

  const [emailVer, setEmailVer] = useState({ checked: false, sent: false, verified: false, checking: false, sending: false, verifying: false, otp: "", error: "" });
  const [phoneVer, setPhoneVer] = useState({ checked: false, sent: false, verified: false, checking: false, sending: false, verifying: false, otp: "", error: "" });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleEmailChange = (val) => {
    if (verificationPhase) return;
    setForm((current) => ({ ...current, email: val }));
    setEmailVer((v) => (v.checked || v.sent || v.verified ? { checked: false, sent: false, verified: false, checking: false, sending: false, verifying: false, otp: "", error: "" } : v));
  };

  const handlePhoneChange = (val) => {
    if (verificationPhase) return;
    setForm((current) => ({ ...current, phone: val }));
    setPhoneVer((v) => (v.checked || v.sent || v.verified ? { checked: false, sent: false, verified: false, checking: false, sending: false, verifying: false, otp: "", error: "" } : v));
  };

  const validate = () => {
    if (!passwordRegex.test(form.password)) {
      return "Mật khẩu phải có chữ hoa, chữ thường, số và ký tự đặc biệt (#@$%&!*?^_), không có dấu cách.";
    }
    if (form.password.length < 6) return "Mật khẩu phải có ít nhất 6 ký tự.";
    if (form.phone.length < 10) return "Số điện thoại phải có ít nhất 10 ký tự.";
    if (!form.companyId) return "Vui lòng chọn công ty.";
    if (!Number.isFinite(Number(form.companyId))) return "Công ty không hợp lệ.";
    return "";
  };

  // Helpers (used for both pre-check and the OTP verification phase)
  const getVerState = (field) => (field === "email" ? emailVer : phoneVer);
  const setVerState = (field) => (field === "email" ? setEmailVer : setPhoneVer);
  const currentFormValue = (field) => (field === "email" ? form.email : form.phone);

  const handleCheck = async (field) => {
    const value = currentFormValue(field).trim();
    const setter = setVerState(field);
    if (!value) { setter((s) => ({ ...s, error: "Vui lòng nhập giá trị." })); return; }
    // Client-side format validation
    if (field === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setter((s) => ({ ...s, error: "Email không hợp lệ. Vui lòng nhập đúng định dạng." }));
      return;
    }
    if (field === "phone" && !/^(?:\+84|0)\d{9}$/.test(value)) {
      setter((s) => ({ ...s, error: "Số điện thoại không hợp lệ (10 số, bắt đầu 0 hoặc +84)." }));
      return;
    }
    setter((s) => ({ ...s, checking: true, error: "", checked: false, sent: false, verified: false }));
    try {
      await contactCheck({ field, value });
      setter((s) => ({ ...s, checked: true, checking: false, error: "" }));
    } catch (err) {
      setter((s) => ({ ...s, checking: false, error: err.response?.data?.message || "Không khả dụng." }));
    }
  };

  // ---- OTP verification handlers (used after user clicks Đăng ký) ----
  const handleSendVerification = async (field) => {
    const value = currentFormValue(field).trim();
    const setter = setVerState(field);
    const state = getVerState(field);

    if (!state.checked) {
      // Auto check if not yet checked (defensive)
      setter((s) => ({ ...s, checking: true, error: "" }));
      try {
        await contactCheck({ field, value });
        setter((s) => ({ ...s, checked: true, checking: false }));
      } catch (err) {
        const msg = err.response?.data?.message || "Không kiểm tra được khả dụng.";
        setter((s) => ({ ...s, checking: false, error: msg }));
        return;
      }
    }

    setter((s) => ({ ...s, sending: true, error: "" }));

    try {
      await sendOtp({ field, value });
      setter((s) => ({ ...s, sent: true, sending: false, otp: "", error: "" }));
    } catch (err) {
      const msg = err.response?.data?.message || "Không thể gửi mã xác thực.";
      setter((s) => ({ ...s, sending: false, error: msg }));
    }
  };

  const handleVerifyOtp = async (field) => {
    const value = currentFormValue(field).trim();
    const state = getVerState(field);
    const setter = setVerState(field);
    const otp = (state.otp || "").trim();

    if (!otp) {
      setter((s) => ({ ...s, error: "Vui lòng nhập mã OTP." }));
      return;
    }

    setter((s) => ({ ...s, verifying: true, error: "" }));

    try {
      await contactVerify({ field, value, otp });
      setter((s) => ({ ...s, verified: true, verifying: false, error: "", _verifiedValue: value }));

      if (field === "email") {
        // Auto-advance: send OTP for phone now
        const phoneValue = currentFormValue("phone").trim();
        try {
          if (!phoneVer.checked) {
            await contactCheck({ field: "phone", value: phoneValue });
            setPhoneVer((s) => ({ ...s, checked: true, error: "" }));
          }
          await sendOtp({ field: "phone", value: phoneValue });
          setPhoneVer((s) => ({ ...s, sent: true, otp: "", error: "" }));
        } catch (advErr) {
          const msg = advErr.response?.data?.message || "Gửi mã cho số điện thoại thất bại.";
          setPhoneVer((s) => ({ ...s, error: msg }));
        }
      } else if (field === "phone") {
        // Both verified → perform the actual signup
        await performSignUp();
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Mã OTP không hợp lệ hoặc đã hết hạn.";
      setter((s) => ({ ...s, verifying: false, error: msg }));
    }
  };

  const handleResend = async (field) => {
    const setter = setVerState(field);
    setter((s) => ({ ...s, sent: false, otp: "", error: "" }));
    await handleSendVerification(field);
  };

  const performSignUp = async () => {
    const payload = {
      fullName: form.fullName,
      contactInfo: {
        email: form.email,
        phone: form.phone
      },
      password: form.password,
      companyId: Number(form.companyId)
    };

    try {
      setLoading(true);
      const res = await driverSignUp(payload);
      const successMessage = res.data?.message || "Đăng ký tài xế thành công";
      addToast(successMessage, "success");
      setTimeout(() => navigate("/login"), 500);
    } catch (err) {
      const data = err.response?.data;
      const errorMessage = Array.isArray(data?.issues) ?
      data.issues.map((item) => item.reason || item.field).join(". ") :
      data?.message || "Đăng ký thất bại";
      setError(errorMessage);
      addToast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const emailVal = form.email.trim();
      const phoneVal = form.phone.trim();

      // 1. Ensure availability right before sending OTPs (check button is optional helper)
      await contactCheck({ field: "email", value: emailVal });
      setEmailVer((s) => ({ ...s, checked: true, sent: false, verified: false, error: "" }));

      await contactCheck({ field: "phone", value: phoneVal });
      setPhoneVer((s) => ({ ...s, checked: true, sent: false, verified: false, error: "" }));

      // 2. Enter verification phase
      setVerificationPhase(true);

      // 3. Send OTP for email first (phone auto after email verified)
      await sendOtp({ field: "email", value: emailVal });
      setEmailVer((s) => ({ ...s, sent: true, otp: "", error: "" }));
    } catch (err) {
      const msg = err.response?.data?.message || "Email hoặc số điện thoại không khả dụng. Vui lòng kiểm tra lại.";
      setError(msg);
      setVerificationPhase(false);
      setEmailVer((s) => ({ ...s, checked: false }));
      setPhoneVer((s) => ({ ...s, checked: false }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-600">
          <span className="material-symbols-outlined text-red-500">error</span>
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      <div className="space-y-2">
        <label className="block text-sm font-medium text-on-surface-variant ml-1">Họ và tên</label>
        <input
          name="fullName"
          className="w-full bg-white border-0 rounded-xl p-4 text-on-surface ring-1 ring-outline-variant/30 focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-gray-400"
          placeholder="Nguyễn Văn A"
          type="text"
          value={form.fullName}
          onChange={handleChange}
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <VerifiedContactField
          field="email"
          label="Email"
          value={form.email}
          onChange={handleEmailChange}
          verification={emailVer}
          setVerification={setEmailVer}
          onCheck={() => handleCheck("email")}
          onSendVerification={() => handleSendVerification("email")}
          onVerifyOtp={() => handleVerifyOtp("email")}
          onResend={() => handleResend("email")}
          requireOtpVerification={verificationPhase}
          inputDisabled={verificationPhase}
          placeholder="example@email.com"
        />
        <VerifiedContactField
          field="phone"
          label="Số điện thoại"
          value={form.phone}
          onChange={handlePhoneChange}
          verification={phoneVer}
          setVerification={setPhoneVer}
          onCheck={() => handleCheck("phone")}
          onSendVerification={() => handleSendVerification("phone")}
          onVerifyOtp={() => handleVerifyOtp("phone")}
          onResend={() => handleResend("phone")}
          requireOtpVerification={verificationPhase}
          inputDisabled={verificationPhase}
          placeholder="09xx xxx xxx"
        />
      </div>

      <CompanySelect
        value={form.companyId}
        onChange={(id) => setForm((c) => ({ ...c, companyId: id }))}
        label="Chọn công ty"
        disabled={verificationPhase}
      />

      <p className="text-xs text-on-surface-variant bg-surface-container-low rounded-lg px-3 py-2 flex items-start gap-2">
        <span className="material-symbols-outlined text-sm text-primary mt-0.5">info</span>
        Mật khẩu phải có chữ hoa, chữ thường, số và ký tự đặc biệt (#@$%&!*?^_)
      </p>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-on-surface-variant ml-1">Mật khẩu</label>
        <div className="relative">
          <input
            name="password"
            className="w-full bg-white border-0 rounded-xl p-4 pr-12 text-on-surface ring-1 ring-outline-variant/30 focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-gray-400"
            placeholder="••••••••"
            type={showPassword ? "text" : "password"}
            value={form.password}
            onChange={handleChange}
            required
            disabled={verificationPhase}
          />
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined text-xl">
              {showPassword ? "visibility_off" : "visibility"}
            </span>
          </button>
        </div>
      </div>

      {/* During verificationPhase the real signup happens after both OTPs succeed */}
      <button
        type="submit"
        disabled={loading || verificationPhase}
        className="w-full bg-gradient-to-r from-primary to-primary-container text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            <span>{verificationPhase ? "Đang gửi mã xác thực..." : "Đang xử lý..."}</span>
          </>
        ) : verificationPhase ? (
          <span>Đang xác thực email &amp; số điện thoại...</span>
        ) : (
          <>
            <span className="material-symbols-outlined">directions_car</span>
            <span>Đăng ký tài xế</span>
          </>
        )}
      </button>

      {verificationPhase && (
        <p className="text-center text-xs text-on-surface-variant">
          Vui lòng nhập mã OTP đã gửi đến email và số điện thoại của bạn để hoàn tất đăng ký.
        </p>
      )}
    </form>
  );
}