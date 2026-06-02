import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signIn } from "../api/auth";
import { getOperatorProfile } from "../api/operator";
import LoginForm from "./login/LoginForm";
import SocialLoginButtons from "./login/SocialLoginButtons";
import { buildAuthenticatedUser, getRedirectUrl, normalizeRole } from "./login/authUtils";
import { getStoredToken, getStoredUser, setAuthSession, setStoredUser } from "../utils/authStorage";

const getLoginIdentifierMeta = (value) => {
  const rawValue = value.trim();

  if (rawValue.includes("@")) {
    return {
      field: "email",
      value: rawValue.toLowerCase()
    };
  }

  return {
    field: "phone",
    value: rawValue.replace(/[\s.-]/g, "")
  };
};

const getLoginErrorState = (message, identifier) => {
  if (!message) return { fieldErrors: {}, formError: "" };

  const normalized = message.toLowerCase();
  const fieldErrors = {};
  const loginField = getLoginIdentifierMeta(identifier).field;

  if (normalized.includes("vui lòng nhập mật khẩu")) {
    fieldErrors.password = message;
  } else if (normalized.includes("định dạng") || normalized.includes("vui lòng nhập")) {
    fieldErrors.identifier = message;
  } else if (normalized.includes("mật khẩu") || normalized.includes("password")) {
    fieldErrors.password = message;
  } else if (
  normalized.includes("email") ||
  normalized.includes("phone") ||
  normalized.includes("số điện") ||
  normalized.includes("tài khoản") ||
  normalized.includes("account") ||
  normalized.includes("not found") ||
  normalized.includes("không tồn tại"))
  {
    fieldErrors.identifier =
    loginField === "email" ? "Email chưa đúng hoặc chưa được đăng ký." : "Số điện thoại chưa đúng hoặc chưa được đăng ký.";
  } else {
    return { fieldErrors, formError: message };
  }

  return { fieldErrors, formError: "" };
};

const getIdentifierValidationError = (value) => {
  const account = value.trim();
  const loginMeta = getLoginIdentifierMeta(value);

  if (!account) {
    return "Vui lòng nhập email hoặc số điện thoại.";
  }

  if (loginMeta.field === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginMeta.value)) {
    return "Email không đúng định dạng. Ví dụ: ten@gmail.com.";
  }

  if (loginMeta.field === "phone" && !/^\d{10,13}$/.test(loginMeta.value)) {
    return "Số điện thoại chỉ gồm 10-13 chữ số.";
  }

  return "";
};

const pickOperatorProfile = (data) => {
  if (data?.user) return data.user;
  if (data?.data?.user) return data.data.user;
  if (data?.profile) return data.profile;
  if (data?.data && !Array.isArray(data.data)) return data.data;
  return data || {};
};

const mergeOperatorProfileIntoUser = (user, profile) => {
  if (!profile || typeof profile !== "object") return user;

  const staffProfile = { ...(user.staffProfile || {}), ...profile };
  delete staffProfile.position;
  delete staffProfile.department;
  delete staffProfile.identityNumber;

  const nextUser = {
    ...user,
    staffProfile,
    fullName: profile.fullName || user.fullName,
    status: profile.status || user.status,
    companyId: profile.companyId ?? profile.company_id ?? user.companyId,
    staffCode: profile.staffCode ?? profile.staff_code ?? user.staffCode,
    hireDate: profile.hireDate ?? profile.hire_date ?? user.hireDate,
    accountStripeId:
    profile.accountStripeId ??
    profile.account_stripe_id ??
    profile.stripeAccountId ??
    user.accountStripeId
  };

  delete nextUser.position;
  delete nextUser.department;
  delete nextUser.identityNumber;

  return nextUser;
};

const shouldLoadOperatorProfile = (user) => normalizeRole(user?.role) === "operator";

function Login() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberLogin, setRememberLogin] = useState(true);

  const completeLogin = useCallback(
    async (data) => {
      const { token, user } = buildAuthenticatedUser(data);
      let nextUser = user;

      setAuthSession({ token, user: nextUser, remember: rememberLogin });

      if (shouldLoadOperatorProfile(nextUser)) {
        try {
          const profileResponse = await getOperatorProfile();
          nextUser = mergeOperatorProfileIntoUser(nextUser, pickOperatorProfile(profileResponse.data));
          setStoredUser(nextUser);
        } catch {

        }
      }

      const redirectUrl = getRedirectUrl(nextUser);
      navigate(redirectUrl, { replace: true });
    },
    [navigate, rememberLogin]
  );

  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;

    const storedUser = getStoredUser();

    navigate(getRedirectUrl(storedUser), { replace: true });
  }, [navigate]);

  const loginErrorState = getLoginErrorState(error, identifier);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (loading) return;

    const identifierError = getIdentifierValidationError(identifier);
    if (identifierError) {
      setError(identifierError);
      return;
    }

    if (!password.trim()) {
      setError("Vui lòng nhập mật khẩu.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const loginMeta = getLoginIdentifierMeta(identifier);
      const payload = { [loginMeta.field]: loginMeta.value, password };
      const res = await signIn(payload);
      await completeLogin(res.data);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || "Đăng nhập thất bại";
      setError(errorMsg);
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
        </nav>
      </header>

      <main className="mx-auto grid min-h-[calc(100vh-73px)] max-w-7xl grid-cols-1 px-5 py-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:px-8 lg:py-10">
        <section className="relative hidden min-h-[720px] overflow-hidden rounded-2xl lg:block">
          <img
            alt="Xe khách BusGo trên đường dài"
            className="absolute inset-0 h-full w-full object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBh6xiGedZC9xntBCAWe7zwTDcHZMH6ymh1WFMmKyqNCgWc_YfoiSsC6pdQvXp9C82_b7ZhtlHF7anPgmKL7gzQDuLfd5SSycz2V-KJhZN5LoQSOe5uH2J23jaPYvph8muF-LMpz6zoHJUG8Ob04xVWxzHamOTmTNr7t5DZvMT1AvUJEmtf4bOErcQavd0lHZgFyj7oV8ua_WbCgbAAtXJdoik7qbtFC1r-9d0Qg9J_tcoz8mgj5DEmCzOUp0Tsx3pFWhy6LeDWifQ" />
          
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
              ["support_agent", "Hỗ trợ nhanh"]].
              map(([icon, label]) =>
              <div key={label} className="rounded-xl bg-white/12 p-4 backdrop-blur">
                  <span className="material-symbols-outlined text-[22px]">{icon}</span>
                  <p className="mt-3 text-sm font-semibold">{label}</p>
                </div>
              )}
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
                Chào mừng bạn đến với BusGo!
              </h2>
            </div>

            <LoginForm
              identifier={identifier}
              onIdentifierChange={(value) => {
                setIdentifier(value);
                setError("");
              }}
              password={password}
              onPasswordChange={(value) => {
                setPassword(value);
                setError("");
              }}
              showPassword={showPassword}
              onTogglePassword={() => setShowPassword((current) => !current)}
              loading={loading}
              onSubmit={handleSubmit}
              rememberLogin={rememberLogin}
              onRememberLoginChange={setRememberLogin}
              fieldErrors={loginErrorState.fieldErrors}
              formError={loginErrorState.formError} />
            

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
    </div>);

}

export default Login;
