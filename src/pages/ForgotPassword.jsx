import { useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { sendOtp, resetPassword } from "../api/auth";
import { useToast } from "../context/ToastContext";

const getContactMeta = (contactValue) => {
  const rawValue = contactValue.trim();

  if (rawValue.includes("@")) {
    return {
      field: "email",
      icon: "mail",
      label: "email",
      value: rawValue.toLowerCase()
    };
  }

  return {
    field: "phone",
    icon: "call",
    label: "số điện thoại",
    value: rawValue.replace(/[\s.-]/g, "")
  };
};

const passwordRules = [
["length", "Tối thiểu 6 ký tự", (value) => value.length >= 6],
["uppercase", "Có chữ hoa", (value) => /[A-Z]/.test(value)],
["lowercase", "Có chữ thường", (value) => /[a-z]/.test(value)],
["number", "Có chữ số", (value) => /\d/.test(value)],
["symbol", "Có ký tự đặc biệt", (value) => /[#@$%&!*?^_]/.test(value)]];


const getApiErrorMessage = (err, fallback) => {
  if (err.response?.status >= 500) {
    return "Máy chủ đang lỗi khi đặt lại mật khẩu. Vui lòng thử lại sau hoặc báo backend kiểm tra /auth/reset-password.";
  }

  const data = err.response?.data;

  if (Array.isArray(data?.issues) && data.issues.length > 0) {
    return data.issues.
    map((issue) => issue.reason || issue.message || issue.field).
    filter(Boolean).
    join(". ");
  }

  return data?.message || data?.error || fallback;
};

function ForgotPassword() {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [step, setStep] = useState(1);
  const [contact, setContact] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const contactMeta = useMemo(() => getContactMeta(contact), [contact]);
  const completedRules = useMemo(
    () => passwordRules.filter(([,, validate]) => validate(newPassword)).length,
    [newPassword]
  );

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError("");

    if (!contact.trim()) {
      setError("Vui lòng nhập email hoặc số điện thoại");
      return;
    }

    if (contactMeta.field === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(contactMeta.value)) {
        setError("Email không hợp lệ");
        return;
      }
    } else {
      const phoneRegex = /^\d{10,13}$/;
      if (!phoneRegex.test(contactMeta.value)) {
        setError("Số điện thoại phải từ 10-13 chữ số");
        return;
      }
    }

    setLoading(true);
    try {
      await sendOtp({
        field: contactMeta.field,
        value: contactMeta.value
      });

      setContact(contactMeta.value);
      addToast("OTP đã được gửi đến " + contactMeta.label + " của bạn", "success");
      setStep(2);
    } catch (err) {
      const errorMsg = getApiErrorMessage(err, "Gửi OTP thất bại");
      setError(errorMsg);
      addToast(errorMsg, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");

    const normalizedOtp = otp.trim();

    if (!normalizedOtp) {
      setError("Vui lòng nhập OTP");
      return;
    }

    if (normalizedOtp.length !== 6) {
      setError("OTP phải là 6 ký tự");
      return;
    }

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

    setLoading(true);
    try {
      const payload = {
        otp: normalizedOtp,
        password: newPassword
      };

      if (contactMeta.field === "email") {
        payload.email = contactMeta.value;
      } else {
        payload.phone = contactMeta.value;
      }

      await resetPassword(payload);

      addToast("Đặt lại mật khẩu thành công!", "success");

      setTimeout(() => {
        navigate("/login");
      }, 1000);
    } catch (err) {
      const errorMsg = getApiErrorMessage(err, "Đặt lại mật khẩu thất bại");
      setError(errorMsg);
      addToast(errorMsg, "error");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setOtp("");
    setNewPassword("");
    setConfirmPassword("");
    setError("");
  };

  return (
    <div className="min-h-screen bg-[#f6f8f5] text-on-surface font-body">
      <header className="sticky top-0 z-50 border-b border-outline-variant/20 bg-white/90 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          <Link to="/" className="inline-flex items-center gap-2 text-2xl font-extrabold tracking-tight text-primary">
            <span className="material-symbols-outlined text-[28px]">directions_bus</span>
            BusGo
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-primary">
            
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Đăng nhập
          </Link>
        </nav>
      </header>

      <main className="mx-auto grid min-h-[calc(100vh-73px)] max-w-7xl grid-cols-1 px-5 py-8 lg:grid-cols-[1fr_0.95fr] lg:gap-10 lg:px-8 lg:py-10">
        <section className="relative hidden min-h-[680px] overflow-hidden rounded-2xl lg:block">
          <img
            alt="Xe khách BusGo"
            className="absolute inset-0 h-full w-full object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBh6xiGedZC9xntBCAWe7zwTDcHZMH6ymh1WFMmKyqNCgWc_YfoiSsC6pdQvXp9C82_b7ZhtlHF7anPgmKL7gzQDuLfd5SSycz2V-KJhZN5LoQSOe5uH2J23jaPYvph8muF-LMpz6zoHJUG8Ob04xVWxzHamOTmTNr7t5DZvMT1AvUJEmtf4bOErcQavd0lHZgFyj7oV8ua_WbCgbAAtXJdoik7qbtFC1r-9d0Qg9J_tcoz8mgj5DEmCzOUp0Tsx3pFWhy6LeDWifQ" />
          
          <div className="absolute inset-0 bg-slate-950/55" />
          <div className="absolute inset-x-0 bottom-0 p-10 text-white">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold backdrop-blur">
              <span className="material-symbols-outlined text-[18px]">shield_lock</span>
              Khôi phục tài khoản
            </div>
            <h1 className="max-w-xl text-5xl font-extrabold leading-tight tracking-tight">
              Đặt lại mật khẩu trong một luồng gọn gàng.
            </h1>
            <p className="mt-4 max-w-lg text-base leading-7 text-white/85">
              Xác nhận OTP và tạo mật khẩu mới trên cùng một màn hình sau khi nhận mã.
            </p>
          </div>
        </section>

        <section className="flex items-center justify-center">
          <div className="w-full max-w-[540px] rounded-2xl border border-outline-variant/30 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] sm:p-8 lg:p-10">
            <div className="mb-7">
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-700 ring-1 ring-emerald-100">
                <span className="material-symbols-outlined text-[17px]">lock_reset</span>
                Quên mật khẩu
              </span>
              <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-on-surface sm:text-4xl">
                {step === 1 ? "Nhận mã xác thực" : "Tạo mật khẩu mới"}
              </h2>
              <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                {step === 1 ?
                "Nhập email hoặc số điện thoại để nhận mã OTP." :
                "Nhập OTP đã nhận và mật khẩu mới để hoàn tất."}
              </p>
            </div>

            <div className="mb-7 grid grid-cols-2 gap-2 rounded-xl bg-surface-container-low p-1">
              {[
              [1, "Tài khoản", "person_search"],
              [2, "Xác nhận", "verified_user"]].
              map(([value, label, icon]) =>
              <div
                key={value}
                className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-bold transition-colors ${
                step === value ? "bg-white text-primary shadow-sm" : "text-on-surface-variant"}`
                }>
                
                  <span className="material-symbols-outlined text-[18px]">{icon}</span>
                  {label}
                </div>
              )}
            </div>

            {error &&
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
                <span className="material-symbols-outlined text-[22px]">error</span>
                <span className="text-sm font-medium leading-6">{error}</span>
              </div>
            }

            {step === 1 &&
            <form onSubmit={handleSendOtp} className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-bold text-on-surface">Email hoặc số điện thoại</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">
                      alternate_email
                    </span>
                    <input
                    className="w-full rounded-xl border border-outline-variant/40 bg-white py-3.5 pl-12 pr-4 text-sm font-medium outline-none transition-all placeholder:text-outline focus:border-primary focus:ring-4 focus:ring-primary/10"
                    placeholder="email@example.com hoặc 0123456789"
                    type="text"
                    inputMode="text"
                    autoComplete="username"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)} />
                  
                  </div>
                </div>

                <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-base font-extrabold text-white shadow-[0_12px_24px_rgba(0,110,28,0.18)] transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60">
                
                  {loading ?
                <>
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Đang gửi OTP...
                    </> :

                <>
                      <span className="material-symbols-outlined text-[20px]">send</span>
                      Gửi OTP
                    </>
                }
                </button>
              </form>
            }

            {step === 2 &&
            <form onSubmit={handleResetPassword} className="space-y-5">
                <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Đã gửi OTP đến</p>
                  <div className="mt-1 flex items-center gap-2 text-sm font-bold text-on-surface">
                    <span className="material-symbols-outlined text-[18px] text-emerald-700">{contactMeta.icon}</span>
                    {contact}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-on-surface">Mã OTP</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">
                      pin
                    </span>
                    <input
                    className="w-full rounded-xl border border-outline-variant/40 bg-white py-3.5 pl-12 pr-4 text-center text-xl font-extrabold tracking-[0.45em] outline-none transition-all placeholder:text-outline focus:border-primary focus:ring-4 focus:ring-primary/10"
                    placeholder="000000"
                    type="text"
                    inputMode="text"
                    maxLength="6"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.trimStart().slice(0, 6))} />
                  
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-on-surface">Mật khẩu mới</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">
                      lock
                    </span>
                    <input
                    className="w-full rounded-xl border border-outline-variant/40 bg-white py-3.5 pl-12 pr-12 text-sm font-medium outline-none transition-all placeholder:text-outline focus:border-primary focus:ring-4 focus:ring-primary/10"
                    placeholder="Nhập mật khẩu mới"
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)} />
                  
                    <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-outline transition-colors hover:bg-surface-container-low hover:text-primary"
                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}>
                    
                      <span className="material-symbols-outlined text-xl">
                        {showPassword ? "visibility_off" : "visibility"}
                      </span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-on-surface">Xác nhận mật khẩu</label>
                  <div className="relative">
                    <span className="material-symbols-outlined pointer-events-none absolute left-4 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center overflow-hidden text-outline">
                      lock
                    </span>
                    <input
                    className="w-full rounded-xl border border-outline-variant/40 bg-white py-3.5 pl-12 pr-12 text-sm font-medium outline-none transition-all placeholder:text-outline focus:border-primary focus:ring-4 focus:ring-primary/10"
                    placeholder="Nhập lại mật khẩu mới"
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)} />
                  
                    <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-outline transition-colors hover:bg-surface-container-low hover:text-primary"
                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}>
                    
                      <span className="material-symbols-outlined text-xl">
                        {showPassword ? "visibility_off" : "visibility"}
                      </span>
                    </button>
                  </div>
                </div>

                <div className="rounded-xl border border-outline-variant/30 bg-surface-container-low p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-sm font-bold text-on-surface">Độ mạnh mật khẩu</p>
                    <span className="text-xs font-bold text-primary">{completedRules}/{passwordRules.length}</span>
                  </div>
                  <div className="mb-4 h-2 overflow-hidden rounded-full bg-white">
                    <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${completedRules / passwordRules.length * 100}%` }} />
                  
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {passwordRules.map(([key, label, validate]) => {
                    const done = validate(newPassword);
                    return (
                      <div
                        key={key}
                        className={`flex items-center gap-2 text-xs font-semibold ${
                        done ? "text-emerald-700" : "text-on-surface-variant"}`
                        }>
                        
                          <span className="material-symbols-outlined text-[16px]">
                            {done ? "check_circle" : "radio_button_unchecked"}
                          </span>
                          {label}
                        </div>);

                  })}
                  </div>
                </div>

                <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-base font-extrabold text-white shadow-[0_12px_24px_rgba(0,110,28,0.18)] transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60">
                
                  {loading ?
                <>
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Đang đặt lại...
                    </> :

                <>
                      <span className="material-symbols-outlined text-[20px]">lock_reset</span>
                      Đặt lại mật khẩu
                    </>
                }
                </button>

                <button
                type="button"
                onClick={resetForm}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-outline-variant/40 py-3 text-sm font-bold text-on-surface transition-colors hover:bg-surface-container-low">
                
                  <span className="material-symbols-outlined text-[18px]">edit</span>
                  Đổi email hoặc số điện thoại
                </button>
              </form>
            }

            <div className="mt-8 text-center">
              <p className="text-sm text-on-surface-variant">
                Bạn đã nhớ mật khẩu?{" "}
                <Link to="/login" className="font-bold text-primary hover:underline">
                  Đăng nhập
                </Link>
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>);

}

export default ForgotPassword;