import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { sendOtp, resetPassword } from "../api/auth";
import { useToast } from "../context/ToastContext";

function ForgotPassword() {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [step, setStep] = useState(1); // 1: email/phone, 2: OTP, 3: reset password
  const [method, setMethod] = useState("email"); // email or phone
  const [contact, setContact] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Step 1: Gửi OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError("");

    if (!contact.trim()) {
      setError("Vui lòng nhập " + (method === "email" ? "email" : "số điện thoại"));
      return;
    }

    // Validate email or phone
    if (method === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(contact)) {
        setError("Email không hợp lệ");
        return;
      }
    } else {
      const phoneRegex = /^\d{10,11}$/;
      if (!phoneRegex.test(contact)) {
        setError("Số điện thoại phải từ 10-11 chữ số");
        return;
      }
    }

    setLoading(true);
    try {
      await sendOtp({
        field: method,
        value: contact,
      });

      addToast("OTP đã được gửi đến " + (method === "email" ? "email" : "số điện thoại") + " của bạn", "success");
      setStep(2);
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Gửi OTP thất bại";
      setError(errorMsg);
      addToast(errorMsg, "error");
    } finally {
      setLoading(false);
    }
  };

  // Step 2 -> 3: Xác nhận OTP và chuyển sang nhập mật khẩu mới
  const handleVerifyOtp = (e) => {
    e.preventDefault();
    setError("");

    if (!otp.trim()) {
      setError("Vui lòng nhập OTP");
      return;
    }

    if (otp.length !== 6) {
      setError("OTP phải là 6 ký tự");
      return;
    }

    setStep(3);
  };

  // Step 3: Reset mật khẩu
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");

    if (!newPassword || !confirmPassword) {
      setError("Vui lòng nhập mật khẩu");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[#@$%&!*?^_])[^\s]+$/;
    if (!passwordRegex.test(newPassword)) {
      setError("Mật khẩu phải có chữ hoa, chữ thường, số và ký tự đặc biệt (#@$%&!*?^_), không có dấu cách.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        otp: otp,
        password: newPassword,
      };

      if (method === "email") {
        payload.email = contact;
      } else {
        payload.phone = contact;
      }

      await resetPassword(payload);

      addToast("Đặt lại mật khẩu thành công!", "success");
      
      setTimeout(() => {
        navigate("/login");
      }, 1000);
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Đặt lại mật khẩu thất bại";
      setError(errorMsg);
      addToast(errorMsg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface text-on-surface font-body flex flex-col">
      {/* Header */}
      <header className="w-full sticky top-0 z-50 bg-white/80 backdrop-blur-xl shadow-sm">
        <nav className="flex justify-between items-center px-6 py-4 max-w-7xl mx-auto">
          <Link to="/" className="text-2xl font-bold tracking-tight text-primary">
            BusGo
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-gray-600 text-sm font-medium hover:text-primary transition-colors">
              Quay lại đăng nhập
            </Link>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-editorial hover:-translate-y-1 transition-transform duration-300 p-8 sm:p-12">
          {/* Title */}
          <div className="mb-10">
            <h1 className="text-4xl font-extrabold text-on-surface tracking-tight mb-2">
              Quên mật khẩu?
            </h1>
            <p className="text-on-surface-variant text-lg">
              {step === 1 && "Nhập email hoặc số điện thoại để nhận OTP"}
              {step === 2 && "Nhập mã OTP 6 chữ số"}
              {step === 3 && "Nhập mật khẩu mới"}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl mb-6">
              <span className="material-symbols-outlined text-red-500">error</span>
              <span className="text-sm font-medium">{error}</span>
            </div>
          )}

          {/* STEP 1: Enter Email/Phone */}
          {step === 1 && (
            <form onSubmit={handleSendOtp} className="space-y-6">
              {/* Method Selection */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setMethod("email")}
                  className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
                    method === "email"
                      ? "bg-primary text-on-primary"
                      : "bg-surface-container-low text-on-surface border border-outline-variant"
                  }`}
                >
                  Email
                </button>
                <button
                  type="button"
                  onClick={() => setMethod("phone")}
                  className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
                    method === "phone"
                      ? "bg-primary text-on-primary"
                      : "bg-surface-container-low text-on-surface border border-outline-variant"
                  }`}
                >
                  Số điện thoại
                </button>
              </div>

              {/* Input Field */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-on-surface-variant ml-1">
                  {method === "email" ? "Email" : "Số điện thoại"}
                </label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">
                    {method === "email" ? "mail" : "phone"}
                  </span>
                  <input
                    className="w-full pl-12 pr-4 py-4 bg-surface-container-low border border-transparent rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:text-gray-400 font-medium"
                    placeholder={method === "email" ? "your@email.com" : "0123456789"}
                    type={method === "email" ? "email" : "tel"}
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-primary text-on-primary font-bold text-lg rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Đang gửi...</span>
                  </>
                ) : (
                  <span>Gửi OTP</span>
                )}
              </button>
            </form>
          )}

          {/* STEP 2: Enter OTP */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-on-surface-variant ml-1">
                  Mã OTP (6 chữ số)
                </label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">
                    pin
                  </span>
                  <input
                    className="w-full pl-12 pr-4 py-4 bg-surface-container-low border border-transparent rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:text-gray-400 font-medium text-center text-2xl tracking-widest"
                    placeholder="000000"
                    type="text"
                    maxLength="6"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-primary text-on-primary font-bold text-lg rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 active:scale-[0.98] transition-all"
              >
                Tiếp tục
              </button>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full py-2 text-primary font-semibold hover:underline"
              >
                Quay lại
              </button>
            </form>
          )}

          {/* STEP 3: Reset Password */}
          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-6">
              {/* New Password */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-on-surface-variant ml-1">
                  Mật khẩu mới
                </label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">
                    lock
                  </span>
                  <input
                    className="w-full pl-12 pr-12 py-4 bg-surface-container-low border border-transparent rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:text-gray-400 font-medium"
                    placeholder="Nhập mật khẩu mới"
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-primary transition-colors"
                  >
                    <span className="material-symbols-outlined text-xl">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-on-surface-variant ml-1">
                  Xác nhận mật khẩu
                </label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">
                    lock_check
                  </span>
                  <input
                    className="w-full pl-12 pr-12 py-4 bg-surface-container-low border border-transparent rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:text-gray-400 font-medium"
                    placeholder="Xác nhận mật khẩu"
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-primary transition-colors"
                  >
                    <span className="material-symbols-outlined text-xl">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>

              {/* Password Requirements */}
              <div className="bg-surface-container-low p-4 rounded-xl">
                <p className="text-xs font-semibold text-on-surface-variant mb-2">Mật khẩu phải chứa:</p>
                <ul className="text-xs space-y-1 text-on-surface-variant">
                  <li>✓ Ít nhất 6 ký tự</li>
                  <li>✓ Chữ hoa (A-Z)</li>
                  <li>✓ Chữ thường (a-z)</li>
                  <li>✓ Số (0-9)</li>
                  <li>✓ Ký tự đặc biệt (#@$%&!*?^_)</li>
                </ul>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-primary text-on-primary font-bold text-lg rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Đang đặt lại...</span>
                  </>
                ) : (
                  <span>Đặt lại mật khẩu</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full py-2 text-primary font-semibold hover:underline"
              >
                Quay lại
              </button>
            </form>
          )}

          {/* Footer Links */}
          <div className="mt-8 text-center">
            <p className="text-sm text-on-surface-variant">
              Bạn đã nhớ mật khẩu?{" "}
              <Link to="/login" className="text-primary font-semibold hover:underline">
                Đăng nhập
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default ForgotPassword;
