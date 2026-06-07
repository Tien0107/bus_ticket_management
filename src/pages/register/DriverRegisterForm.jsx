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

  const [emailVer, setEmailVer] = useState({ checked: false, sent: false, verified: false, checking: false, sending: false, verifying: false, otp: "", error: "" });
  const [phoneVer, setPhoneVer] = useState({ checked: false, sent: false, verified: false, checking: false, sending: false, verifying: false, otp: "", error: "" });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleEmailChange = (val) => {
    setForm((current) => ({ ...current, email: val }));
    setEmailVer((v) => (v.checked || v.sent || v.verified ? { checked: false, sent: false, verified: false, checking: false, sending: false, verifying: false, otp: "", error: "" } : v));
  };

  const handlePhoneChange = (val) => {
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

  // Verification helpers
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

  const handleSendVerification = async (field) => {
    const value = currentFormValue(field).trim();
    const setter = setVerState(field);
    const state = getVerState(field);
    if (!state.checked) { setter((s) => ({ ...s, error: "Kiểm tra trước." })); return; }
    setter((s) => ({ ...s, sending: true, error: "" }));
    try {
      await sendOtp({ field, value });
      setter((s) => ({ ...s, sent: true, sending: false, otp: "", error: "" }));
    } catch (err) {
      setter((s) => ({ ...s, sending: false, error: "Gửi mã thất bại." }));
    }
  };

  const handleVerifyOtp = async (field) => {
    const value = currentFormValue(field).trim();
    const state = getVerState(field);
    const setter = setVerState(field);
    const otp = (state.otp || "").trim();
    if (!otp || !state.sent) { setter((s) => ({ ...s, error: "OTP không hợp lệ." })); return; }
    setter((s) => ({ ...s, verifying: true, error: "" }));
    try {
      await contactVerify({ field, value, otp });
      setter((s) => ({ ...s, verified: true, verifying: false, error: "", _verifiedValue: value }));
    } catch (err) {
      setter((s) => ({ ...s, verifying: false, error: "OTP sai hoặc hết hạn." }));
    }
  };

  const handleResend = async (field) => {
    setVerState(field)((s) => ({ ...s, sent: false, otp: "", error: "" }));
    await handleSendVerification(field);
  };


  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    const emailOk = emailVer.verified && form.email.trim() === (emailVer._verifiedValue || form.email).trim();
    const phoneOk = phoneVer.verified && form.phone.trim() === (phoneVer._verifiedValue || form.phone).trim();
    if (!emailOk || !phoneOk) {
      setError("Vui lòng xác thực email và số điện thoại trước khi đăng ký.");
      return;
    }

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
          placeholder="09xx xxx xxx"
        />
      </div>

      <CompanySelect
        value={form.companyId}
        onChange={(id) => setForm((c) => ({ ...c, companyId: id }))}
        label="Chọn công ty"
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

      <button
        type="submit"
        disabled={loading || !emailVer.verified || !phoneVer.verified}
        className="w-full bg-gradient-to-r from-primary to-primary-container text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            <span>Đang đăng ký...</span>
          </>
        ) : (
          <>
            <span className="material-symbols-outlined">directions_car</span>
            <span>Đăng ký tài xế</span>
          </>
        )}
      </button>
    </form>
  );
}