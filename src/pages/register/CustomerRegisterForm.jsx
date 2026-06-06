import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { customerSignUp, sendEmail, contactCheck, sendOtp, contactVerify } from "../../api/auth";
import { useToast } from "../../context/ToastContext";
import { buildAuthenticatedUser, getRedirectUrl } from "../login/authUtils";
import { setAuthSession } from "../../utils/authStorage";
import VerifiedContactField from "../../components/common/VerifiedContactField";

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[#@$%&!*?^_])[^\s]+$/;

export default function CustomerRegisterForm() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Verification state for email and phone (new flow: check -> send -> verify)
  const [emailVer, setEmailVer] = useState({ checked: false, sent: false, verified: false, checking: false, sending: false, verifying: false, otp: "", error: "" });
  const [phoneVer, setPhoneVer] = useState({ checked: false, sent: false, verified: false, checking: false, sending: false, verifying: false, otp: "", error: "" });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  // Wrappers for VerifiedContactField so that editing resets verification state (same behavior as before)
  const handleEmailChange = (val) => {
    setForm((current) => ({ ...current, email: val }));
    setEmailVer((v) => (v.checked || v.sent || v.verified ? { checked: false, sent: false, verified: false, checking: false, sending: false, verifying: false, otp: "", error: "" } : v));
  };

  const handlePhoneChange = (val) => {
    setForm((current) => ({ ...current, phone: val }));
    setPhoneVer((v) => (v.checked || v.sent || v.verified ? { checked: false, sent: false, verified: false, checking: false, sending: false, verifying: false, otp: "", error: "" } : v));
  };

  const validate = () => {
    if (form.password !== form.confirmPassword) return "Mật khẩu xác nhận không khớp.";
    if (!passwordRegex.test(form.password)) {
      return "Mật khẩu phải có chữ hoa, chữ thường, số và ký tự đặc biệt (#@$%&!*?^_), không có dấu cách.";
    }
    if (form.password.length < 6) return "Mật khẩu phải có ít nhất 6 ký tự.";
    return "";
  };

  // ---- New verification flow helpers (check -> send -> verify) ----
  const getVerState = (field) => (field === "email" ? emailVer : phoneVer);
  const setVerState = (field) => (field === "email" ? setEmailVer : setPhoneVer);
  const currentFormValue = (field) => (field === "email" ? form.email : form.phone);

  const handleCheck = async (field) => {
    const value = currentFormValue(field).trim();
    if (!value) {
      const setter = setVerState(field);
      setter((s) => ({ ...s, error: `Vui lòng nhập ${field === "email" ? "email" : "số điện thoại"}.` }));
      return;
    }
    const setter = setVerState(field);
    setter((s) => ({ ...s, checking: true, error: "", checked: false, sent: false, verified: false }));

    try {
      await contactCheck({ field, value });
      // 200 = available
      setter((s) => ({ ...s, checked: true, checking: false, error: "" }));
    } catch (err) {
      const msg = err.response?.data?.message || `${field === "email" ? "Email" : "Số điện thoại"} không khả dụng hoặc đã được sử dụng.`;
      setter((s) => ({ ...s, checking: false, error: msg }));
    }
  };

  const handleSendVerification = async (field) => {
    const value = currentFormValue(field).trim();
    const setter = setVerState(field);
    const state = getVerState(field);

    if (!state.checked) {
      setter((s) => ({ ...s, error: "Vui lòng kiểm tra khả dụng trước khi gửi mã." }));
      return;
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
    if (!state.sent) {
      setter((s) => ({ ...s, error: "Vui lòng gửi mã OTP trước." }));
      return;
    }

    setter((s) => ({ ...s, verifying: true, error: "" }));

    try {
      await contactVerify({ field, value, otp });
      // success - store the value that passed verification
      setter((s) => ({ ...s, verified: true, verifying: false, error: "", _verifiedValue: value }));
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


  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    // Require both email and phone to be verified via the new flow
    const emailOk = emailVer.verified && form.email.trim() === (emailVer._verifiedValue || form.email).trim();
    const phoneOk = phoneVer.verified && form.phone.trim() === (phoneVer._verifiedValue || form.phone).trim();

    if (!emailOk || !phoneOk) {
      setError("Vui lòng xác thực email và số điện thoại trước khi đăng ký (nhấn nút kiểm tra và hoàn tất xác thực OTP).");
      return;
    }

    const payload = {
      fullName: form.fullName,
      contactInfo: {
        email: form.email,
        phone: form.phone,
      },
      password: form.password,
    };

    try {
      setLoading(true);
      const res = await customerSignUp(payload);

      if (res.data?.token) {
        const { token, user } = buildAuthenticatedUser(res.data);
        setAuthSession({ token, user, remember: true });

        if (form.email) {
          sendEmail({
            to: form.email,
            subject: "[BusGo] Chào mừng bạn đến với ứng dụng đặt vé xe BusGo!",
            text: `Chào ${form.fullName || "bạn"},\n\nChúc mừng bạn đã đăng ký tài khoản khách hàng thành công tại BusGo!\n\nTài khoản của bạn:\n- Email đăng nhập: ${form.email}\n- Số điện thoại: ${form.phone}\n\nTừ bây giờ bạn có thể trải nghiệm các dịch vụ tiện lợi của BusGo:\n- Tìm kiếm và đặt vé xe trực tuyến nhanh chóng.\n- Chọn chỗ ngồi yêu thích.\n- Quản lý lịch trình dễ dàng.\n- Tích điểm và nhận các ưu đãi hấp dẫn.\n\nChúc bạn có những trải nghiệm tuyệt vời cùng BusGo!\n\nTrân trọng,\nĐội ngũ BusGo`,
            template: "default",
            params: {}
          }).catch((err) => console.error("Lỗi gửi email chào mừng:", err));
        }

        const successMessage = res.data?.message || "Đăng ký thành công! Chào mừng bạn đến với BusGo.";
        addToast(successMessage, "success");
        const redirectUrl = getRedirectUrl(user);
        setTimeout(() => navigate(redirectUrl, { replace: true }), 500);
      } else {
        const successMessage = res.data?.message || "Đăng ký khách hàng thành công";
        addToast(successMessage, "success");
        setTimeout(() => navigate("/login"), 500);
      }
    } catch (err) {
      const data = err.response?.data;
      const errorMessage = Array.isArray(data?.issues)
        ? data.issues.map((item) => item.reason || item.field).join(". ")
        : data?.message || "Đăng ký thất bại";
      setError(errorMessage);
      addToast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-on-surface mb-2">Đăng ký Khách hàng</h3>
        <p className="text-on-surface-variant">Tạo tài khoản để đặt vé dễ dàng hơn</p>
      </div>

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

      <p className="text-xs text-on-surface-variant bg-surface-container-low rounded-lg px-3 py-2 flex items-start gap-2">
        <span className="material-symbols-outlined text-sm text-primary mt-0.5">info</span>
        Mật khẩu phải có chữ hoa, chữ thường, số và ký tự đặc biệt (#@$%&!*?^_)
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        <div className="space-y-2">
          <label className="block text-sm font-medium text-on-surface-variant ml-1">Xác nhận mật khẩu</label>
          <input
            name="confirmPassword"
            className="w-full bg-white border-0 rounded-xl p-4 text-on-surface ring-1 ring-outline-variant/30 focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-gray-400"
            placeholder="••••••••"
            type={showPassword ? "text" : "password"}
            value={form.confirmPassword}
            onChange={handleChange}
            required
          />
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
          <span>Đăng ký khách hàng</span>
        )}
      </button>
    </form>
  );
}
