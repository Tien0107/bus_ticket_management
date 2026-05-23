import { useCallback, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signIn } from "../api/auth";
import { useToast } from "../context/ToastContext";
import LoginForm from "./login/LoginForm";
import SocialLoginButtons from "./login/SocialLoginButtons";
import { buildAuthenticatedUser, getRedirectUrl } from "./login/authUtils";

function Login() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [loginMethod, setLoginMethod] = useState("email");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const completeLogin = useCallback(
    async (data, successMessage = "Đăng nhập thành công") => {
      const { token, user } = buildAuthenticatedUser(data);

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      addToast(successMessage, "success");

      const redirectUrl = getRedirectUrl(user);
      setTimeout(() => {
        navigate(redirectUrl);
      }, 500);
    },
    [addToast, navigate]
  );

  const handleLoginMethodChange = (method) => {
    setLoginMethod(method);
    setIdentifier("");
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const account = identifier.trim();
      const payload = loginMethod === "email" ? { email: account, password } : { phone: account, password };
      const res = await signIn(payload);
      await completeLogin(res.data);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || "Đăng nhập thất bại";
      setError(errorMsg);
      addToast("Đăng nhập thất bại", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f7f4] text-on-surface font-body">
      <header className="border-b border-outline-variant/30 bg-white/90 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          <Link to="/" className="inline-flex items-center gap-3 text-xl font-extrabold tracking-tight text-on-surface">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white">
              <span className="material-symbols-outlined text-[22px]">directions_bus</span>
            </span>
            BusGo
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/" className="hidden rounded-lg px-4 py-2 text-sm font-semibold text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-on-surface sm:inline-flex">
              Trang chủ
            </Link>
            <Link to="/register" className="rounded-lg border border-outline-variant/50 px-4 py-2 text-sm font-bold text-primary transition-colors hover:bg-primary/5">
              Tạo tài khoản
            </Link>
          </div>
        </nav>
      </header>

      <main className="mx-auto grid min-h-[calc(100vh-73px)] max-w-7xl grid-cols-1 px-5 py-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:px-8 lg:py-10">
        <section className="relative hidden min-h-[720px] overflow-hidden rounded-2xl lg:block">
          <img
            alt="Xe khách BusGo trên đường dài"
            className="absolute inset-0 h-full w-full object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBh6xiGedZC9xntBCAWe7zwTDcHZMH6ymh1WFMmKyqNCgWc_YfoiSsC6pdQvXp9C82_b7ZhtlHF7anPgmKL7gzQDuLfd5SSycz2V-KJhZN5LoQSOe5uH2J23jaPYvph8muF-LMpz6zoHJUG8Ob04xVWxzHamOTmTNr7t5DZvMT1AvUJEmtf4bOErcQavd0lHZgFyj7oV8ua_WbCgbAAtXJdoik7qbtFC1r-9d0Qg9J_tcoz8mgj5DEmCzOUp0Tsx3pFWhy6LeDWifQ"
          />
          <div className="absolute inset-0 bg-slate-950/55" />
          <div className="absolute inset-x-0 bottom-0 p-10 text-white">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold backdrop-blur">
              <span className="material-symbols-outlined text-[18px]">verified</span>
              Đặt vé nhanh, quản lý chuyến rõ ràng
            </div>
            <h1 className="max-w-xl text-5xl font-extrabold leading-tight tracking-tight">
              Một tài khoản cho mọi hành trình.
            </h1>
            <p className="mt-4 max-w-lg text-base leading-7 text-white/85">
              Theo dõi vé, thanh toán, lịch trình và hồ sơ cá nhân trong cùng một không gian làm việc gọn gàng.
            </p>
            <div className="mt-8 grid max-w-xl grid-cols-3 gap-3">
              {[
                ["task_alt", "Vé điện tử"],
                ["payments", "Thanh toán an toàn"],
                ["support_agent", "Hỗ trợ nhanh"],
              ].map(([icon, label]) => (
                <div key={label} className="rounded-xl bg-white/12 p-4 backdrop-blur">
                  <span className="material-symbols-outlined text-[22px]">{icon}</span>
                  <p className="mt-3 text-sm font-semibold">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center">
          <div className="w-full max-w-[520px] rounded-2xl border border-outline-variant/30 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] sm:p-8 lg:p-10">
            <div className="mb-8">
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-700 ring-1 ring-emerald-100">
                <span className="material-symbols-outlined text-[17px]">lock_open</span>
                Đăng nhập tài khoản
              </span>
              <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-on-surface sm:text-4xl">
                Chào mừng trở lại
              </h2>
              <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                Dùng email, số điện thoại, Google hoặc Facebook để tiếp tục vào BusGo.
              </p>
            </div>

            {error && (
              <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
                <span className="material-symbols-outlined text-[22px]">error</span>
                <span className="text-sm font-medium leading-6">{error}</span>
              </div>
            )}

            <LoginForm
              loginMethod={loginMethod}
              onLoginMethodChange={handleLoginMethodChange}
              identifier={identifier}
              onIdentifierChange={setIdentifier}
              password={password}
              onPasswordChange={setPassword}
              showPassword={showPassword}
              onTogglePassword={() => setShowPassword((current) => !current)}
              loading={loading}
              onSubmit={handleSubmit}
            />

            <SocialLoginButtons disabled={loading} onLoginSuccess={completeLogin} setError={setError} />

            <p className="mt-8 text-center text-sm text-on-surface-variant">
              Chưa có tài khoản?{" "}
              <Link to="/register" className="font-extrabold text-primary hover:underline">
                Đăng ký ngay
              </Link>
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Login;
