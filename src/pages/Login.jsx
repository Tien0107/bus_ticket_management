import { useCallback, useEffect, useRef, useState } from "react";
import { signIn, verifyAuthFacebookToken, verifyAuthGoogleToken } from "../api/auth";
import { useNavigate, Link } from "react-router-dom";
import { useToast } from "../context/ToastContext";
import { jwtDecode } from "jwt-decode";

const GOOGLE_CLIENT_ID = "335430946794-8mkv3iqd0dvgq208ep9gf6t9hj07lsqc.apps.googleusercontent.com";
const FACEBOOK_APP_ID = process.env.REACT_APP_FACEBOOK_APP_ID || "802102469446209";
const FACEBOOK_GRAPH_VERSION = process.env.REACT_APP_FACEBOOK_GRAPH_VERSION || "v25.0";
const isHttpsPage = () => window.location.protocol === "https:";

const loadScript = (src, id) => {
  return new Promise((resolve, reject) => {
    const existingScript = document.getElementById(id);

    if (existingScript) {
      if (existingScript.dataset.loaded === "true") {
        resolve(existingScript);
      } else {
        existingScript.addEventListener("load", () => resolve(existingScript), { once: true });
        existingScript.addEventListener("error", reject, { once: true });
      }
      return;
    }

    const script = document.createElement("script");
    script.id = id;
    script.src = src;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      script.dataset.loaded = "true";
      resolve(script);
    };
    script.onerror = reject;
    document.body.appendChild(script);
  });
};

const getRedirectUrl = (user) => {
  const role = normalizeRole(user?.role);
  const staffRole = normalizeStaffProfileRole(user?.staffProfileRole);
  const companyAdminRoles = new Set(["company_admin", "operator_admin", "admin"]);
  const dispatcherRoles = new Set(["dispatcher", "operator_dispatcher"]);
  const supportRoles = new Set(["support", "company_support", "operator_support"]);

  if (role === "driver") {
    return "/driver/dashboard";
  }

  if (role === "operator") {
    if (companyAdminRoles.has(staffRole)) {
      return "/company/dashboard";
    }

    if (supportRoles.has(staffRole)) {
      return "/company-support/tickets";
    }

    if (dispatcherRoles.has(staffRole)) {
      return "/operator/dashboard";
    }

    return "/company/dashboard";
  }

  if (role === "admin") {
    return staffRole === "support" ? "/company-support/tickets" : "/company/dashboard";
  }

  if (role === "super_admin" || role === "superadmin") {
    return "/super-admin/dashboard";
  }

  return "/";
};

const firstValue = (...values) => values.find((value) => value !== undefined && value !== null && value !== "");

const getField = (source, keys) => {
  if (!source || typeof source !== "object") return undefined;

  for (const key of keys) {
    if (source[key] !== undefined && source[key] !== null && source[key] !== "") {
      return source[key];
    }
  }

  const entries = Object.entries(source);
  for (const key of keys) {
    const matchedEntry = entries.find(([entryKey, entryValue]) => (
      entryKey.toLowerCase() === key.toLowerCase()
      && entryValue !== undefined
      && entryValue !== null
      && entryValue !== ""
    ));

    if (matchedEntry) {
      return matchedEntry[1];
    }
  }

  return undefined;
};

const toAuthString = (value) => {
  if (value && typeof value === "object") {
    return toAuthString(firstValue(value.name, value.code, value.value, value.role));
  }

  return value === undefined || value === null ? "" : String(value).trim();
};

const normalizeRole = (value) => toAuthString(value).replace(/[\s-]+/g, "_").toLowerCase();

const normalizeStaffProfileRole = (value) => {
  const normalized = normalizeRole(value);

  const aliases = {
    admin: "company_admin",
    companyadmin: "company_admin",
    company_admin: "company_admin",
    operator_admin: "company_admin",
    operatoradmin: "company_admin",
    dispatcher: "dispatcher",
    operator_dispatcher: "dispatcher",
    operatordispatcher: "dispatcher",
    support: "support",
    company_support: "support",
    operator_support: "support",
    company_admin_support: "support",
  };

  return aliases[normalized] || normalized;
};

const getRoleValue = (source) =>
  firstValue(
    getField(source, ["role", "userRole", "accountRole"]),
    getField(source?.user, ["role", "userRole", "accountRole"]),
    getField(source?.data, ["role", "userRole", "accountRole"]),
    getField(source?.account, ["role", "userRole", "accountRole"])
  );

const getStaffProfileRoleValue = (source) =>
  firstValue(
    getField(source, [
      "staffProfileRole",
      "staff_profile_role",
      "staffRole",
      "profileRole",
      "roleProfile",
      "operatorRole",
      "operatorProfileRole",
    ]),
    getField(source?.staffProfile, ["role", "staffProfileRole", "staff_profile_role", "staffRole"]),
    getField(source?.staff_profile, ["role", "staffProfileRole", "staff_profile_role", "staffRole"]),
    getField(source?.operatorProfile, ["role", "staffProfileRole", "staff_profile_role", "staffRole"]),
    getField(source?.operator_profile, ["role", "staffProfileRole", "staff_profile_role", "staffRole"]),
    getField(source?.user, ["staffProfileRole", "staff_profile_role", "staffRole", "profileRole", "roleProfile"]),
    getField(source?.user?.staffProfile, ["role", "staffProfileRole", "staff_profile_role", "staffRole"]),
    getField(source?.user?.staff_profile, ["role", "staffProfileRole", "staff_profile_role", "staffRole"]),
    getField(source?.data, ["staffProfileRole", "staff_profile_role", "staffRole", "profileRole", "roleProfile"]),
    getField(source?.data?.user, ["staffProfileRole", "staff_profile_role", "staffRole", "profileRole", "roleProfile"]),
    getField(source?.data?.user?.staffProfile, ["role", "staffProfileRole", "staff_profile_role", "staffRole"]),
    getField(source?.data?.user?.staff_profile, ["role", "staffProfileRole", "staff_profile_role", "staffRole"])
  );

const mergeAuthClaims = (user, source) => {
  if (!source || typeof source !== "object") return user;

  const role = getRoleValue(source);
  const staffProfileRole = getStaffProfileRoleValue(source);

  if (role) user.role = normalizeRole(role);
  if (staffProfileRole) user.staffProfileRole = normalizeStaffProfileRole(staffProfileRole);
  if (source.companyId !== undefined) user.companyId = source.companyId;
  if (source.company_id !== undefined) user.companyId = source.company_id;
  if (source.email && !user.email) user.email = source.email;
  if (source.phone && !user.phone) user.phone = source.phone;
  if (source.fullName && !user.fullName) user.fullName = source.fullName;
  if (source.full_name && !user.fullName) user.fullName = source.full_name;

  return user;
};

function Login() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const googleButtonRef = useRef(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState("");
  const [googleReady, setGoogleReady] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    console.log("Facebook App ID:", FACEBOOK_APP_ID);
  }, []);

  const completeLogin = useCallback(async (data, successMessage = "Đăng nhập thành công") => {
    const token = firstValue(data?.token, data?.accessToken, data?.data?.token, data?.data?.accessToken);
    const userPayload = firstValue(data?.user, data?.data?.user, data?.profile, data?.data?.profile);
    let user = userPayload && typeof userPayload === "object" ? { ...userPayload } : {};

    if (!token) {
      throw new Error("Backend không trả về token. Kiểm tra API.");
    }

    if (!user || typeof user !== "object") {
      user = {};
    }

    try {
      const decoded = jwtDecode(token);
      [
        decoded,
        decoded?.user,
        decoded?.data,
        decoded?.data?.user,
        decoded?.staffProfile,
        decoded?.staff_profile,
      ].forEach((source) => {
        user = mergeAuthClaims(user, source);
      });
      user = mergeAuthClaims(user, decoded);
    } catch (decodeError) {
      console.warn("Không thể decode token:", decodeError);
    }

    [
      user,
      data,
      data?.user,
      data?.data,
      data?.data?.user,
      data?.profile,
      data?.data?.profile,
    ].forEach((source) => {
      user = mergeAuthClaims(user, source);
    });

    if (!user.role) {
      user.role = "customer";
    }

    if (normalizeRole(user.role) === "operator" && !user.staffProfileRole) {
      throw new Error("Backend chưa trả staffProfileRole cho tài khoản operator.");
    }

    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));

    addToast(successMessage, "success");

    const redirectUrl = getRedirectUrl(user);
    setTimeout(() => {
      navigate(redirectUrl);
    }, 500);
  }, [addToast, navigate]);

  const handleGoogleCredential = useCallback(async (response) => {
    if (!response?.credential) {
      setError("Không nhận được Google ID token.");
      addToast("Đăng nhập Google thất bại", "error");
      return;
    }

    setError("");
    setSocialLoading("google");

    try {
      const res = await verifyAuthGoogleToken({ idToken: response.credential });
      await completeLogin(res.data, "Đăng nhập Google thành công");
    } catch (err) {
      console.error("Google login error:", err);
      const errorMsg = err.response?.data?.message || err.message || "Đăng nhập Google thất bại";
      setError(errorMsg);
      addToast("Đăng nhập Google thất bại", "error");
    } finally {
      setSocialLoading("");
    }
  }, [addToast, completeLogin]);

  useEffect(() => {
    let mounted = true;

    const initGoogleLogin = async () => {
      try {
        await loadScript("https://accounts.google.com/gsi/client?hl=vi", "google-identity-services");

        if (!mounted || !window.google?.accounts?.id || !googleButtonRef.current) {
          return;
        }

        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleCredential,
          ux_mode: "popup",
        });

        googleButtonRef.current.innerHTML = "";
        window.google.accounts.id.renderButton(googleButtonRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "signin_with",
          shape: "rectangular",
          logo_alignment: "left",
          width: Math.min(400, Math.max(220, Math.round(googleButtonRef.current.clientWidth || 220))),
          locale: "vi",
        });

        setGoogleReady(true);
      } catch (err) {
        console.error("Google SDK load error:", err);
        setGoogleReady(false);
      }
    };

    initGoogleLogin();

    return () => {
      mounted = false;
    };
  }, [handleGoogleCredential]);

  const loadFacebookSdk = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!FACEBOOK_APP_ID) {
        reject(new Error("Chưa cấu hình Facebook App ID."));
        return;
      }

      if (window.FB) {
        window.FB.init({
          appId: FACEBOOK_APP_ID,
          cookie: true,
          xfbml: false,
          version: FACEBOOK_GRAPH_VERSION,
        });
        resolve(window.FB);
        return;
      }

      window.fbAsyncInit = () => {
        window.FB.init({
          appId: FACEBOOK_APP_ID,
          cookie: true,
          xfbml: false,
          version: FACEBOOK_GRAPH_VERSION,
        });
        resolve(window.FB);
      };

      loadScript("https://connect.facebook.net/vi_VN/sdk.js", "facebook-jssdk").catch(reject);
    });
  }, []);

  const handleFacebookLogin = async () => {
    setError("");

    if (!isHttpsPage()) {
      const errorMsg = "Facebook Login cần chạy trên HTTPS. Hãy mở trang bằng https://localhost:3000/login.";
      setError(errorMsg);
      addToast("Facebook Login cần HTTPS", "error");
      return;
    }

    setSocialLoading("facebook");

    try {
      const FB = await loadFacebookSdk();
      const loginResponse = await new Promise((resolve) => {
        FB.login(resolve, { scope: "public_profile,email", return_scopes: true });
      });

      console.log("Facebook login response:", loginResponse);

      if (loginResponse.status !== "connected" || !loginResponse.authResponse?.accessToken) {
        throw new Error(
          loginResponse.status === "unknown"
            ? "Facebook chưa xác thực được domain hiện tại. Kiểm tra App Domains, Allowed Domains for JavaScript SDK và Valid OAuth Redirect URIs trên Meta."
            : "Bạn đã hủy hoặc chưa cấp quyền đăng nhập Facebook."
        );
      }

      const { accessToken, signedRequest } = loginResponse.authResponse;
      const res = await verifyAuthFacebookToken({
        accessToken,
        idToken: loginResponse.authResponse.idToken || signedRequest || "",
      });

      await completeLogin(res.data, "Đăng nhập Facebook thành công");
    } catch (err) {
      console.error("Facebook login error:", err);
      const errorMsg = err.response?.data?.message || err.message || "Đăng nhập Facebook thất bại";
      setError(errorMsg);
      addToast("Đăng nhập Facebook thất bại", "error");
    } finally {
      setSocialLoading("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await signIn({ email, password });
      console.log("Login response:", res.data); // Debug
      console.log("User object:", res.data?.user); // Debug user
      await completeLogin(res.data);
    } catch (err) {
      console.error("Login error:", err); // Debug
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
                Dùng email, Google hoặc Facebook để tiếp tục vào BusGo.
              </p>
            </div>

            {error && (
              <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
                <span className="material-symbols-outlined text-[22px]">error</span>
                <span className="text-sm font-medium leading-6">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-bold text-on-surface">Email</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">
                    mail
                  </span>
                  <input
                    className="w-full rounded-xl border border-outline-variant/40 bg-white py-3.5 pl-12 pr-4 text-sm font-medium outline-none transition-all placeholder:text-outline focus:border-primary focus:ring-4 focus:ring-primary/10"
                    placeholder="you@example.com"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-bold text-on-surface">Mật khẩu</label>
                  <Link to="/forgot-password" className="text-sm font-bold text-primary hover:underline">
                    Quên mật khẩu?
                  </Link>
                </div>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">
                    lock
                  </span>
                  <input
                    className="w-full rounded-xl border border-outline-variant/40 bg-white py-3.5 pl-12 pr-12 text-sm font-medium outline-none transition-all placeholder:text-outline focus:border-primary focus:ring-4 focus:ring-primary/10"
                    placeholder="Nhập mật khẩu"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-outline transition-colors hover:bg-surface-container-low hover:text-primary"
                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    <span className="material-symbols-outlined text-xl">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>

              <label className="flex cursor-pointer items-center gap-3 rounded-xl bg-surface-container-low px-4 py-3">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-outline text-primary focus:ring-primary"
                />
                <span className="text-sm font-medium text-on-surface-variant">Ghi nhớ đăng nhập</span>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-base font-extrabold text-white shadow-[0_12px_24px_rgba(0,110,28,0.18)] transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Đang đăng nhập...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[20px]">login</span>
                    Đăng nhập
                  </>
                )}
              </button>
            </form>

            <div className="my-7 flex items-center gap-4">
              <div className="h-px flex-1 bg-outline-variant/40" />
              <span className="text-xs font-bold uppercase tracking-wide text-outline">hoặc tiếp tục với</span>
              <div className="h-px flex-1 bg-outline-variant/40" />
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div className={`relative h-14 overflow-hidden rounded-xl ${googleReady ? "cursor-pointer" : "cursor-wait opacity-70"}`}>
                <div className="pointer-events-none absolute inset-0 z-0 flex h-14 items-center justify-center gap-3 rounded-xl border border-outline-variant/50 bg-white px-4 text-[15px] font-bold text-on-surface shadow-sm transition-colors">
                  {socialLoading === "google" ? (
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
                  ) : (
                    <img
                      alt=""
                      className="h-5 w-5 shrink-0"
                      src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                    />
                  )}
                  <span className="truncate">
                    {socialLoading === "google" ? "Đang đăng nhập..." : "Đăng nhập bằng Google"}
                  </span>
                </div>
                <div
                  ref={googleButtonRef}
                  className={`auth-google-render absolute inset-0 z-10 h-14 w-full overflow-hidden rounded-xl ${googleReady ? "opacity-0" : "pointer-events-none opacity-0"}`}
                />
                {!googleReady && (
                  <div className="absolute inset-0 z-20 rounded-xl" />
                )}
              </div>

              <button
                type="button"
                onClick={handleFacebookLogin}
                disabled={loading || socialLoading === "facebook"}
                className="flex h-14 w-full items-center justify-center gap-3 rounded-xl border border-outline-variant/50 bg-white px-4 text-[15px] font-bold text-on-surface shadow-sm transition-colors hover:bg-surface-container-low disabled:cursor-not-allowed disabled:opacity-60"
              >
                {socialLoading === "facebook" ? (
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
                ) : (
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#1877F2] text-sm font-extrabold text-white">f</span>
                )}
                <span className="truncate">
                  {socialLoading === "facebook" ? "Đang đăng nhập..." : "Đăng nhập bằng Facebook"}
                </span>
              </button>
            </div>

            {!FACEBOOK_APP_ID && (
              <p className="mt-3 text-xs text-on-surface-variant">
                Facebook cần cấu hình <span className="font-semibold">REACT_APP_FACEBOOK_APP_ID</span> để hoạt động.
              </p>
            )}

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
