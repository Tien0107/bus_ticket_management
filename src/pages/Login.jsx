import { useState } from "react";
import { signIn } from "../api/auth";
import { useNavigate, Link } from "react-router-dom";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await signIn({ email, password });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      navigate("/home");
    } catch (err) {
      setError(err.response?.data?.message || "Đăng nhập thất bại. Vui lòng thử lại.");
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
          <div className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-gray-500 hover:text-primary transition-colors font-medium">
              Trang chủ
            </Link>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center p-6 sm:p-12">
        <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-2 bg-white rounded-3xl overflow-hidden shadow-editorial hover:-translate-y-1 transition-transform duration-300">
          {/* Hero Illustration Side */}
          <div className="hidden lg:block relative overflow-hidden bg-primary-container/10">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent z-10"></div>
            <img
              alt="Xe khách hiện đại"
              className="absolute inset-0 w-full h-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBh6xiGedZC9xntBCAWe7zwTDcHZMH6ymh1WFMmKyqNCgWc_YfoiSsC6pdQvXp9C82_b7ZhtlHF7anPgmKL7gzQDuLfd5SSycz2V-KJhZN5LoQSOe5uH2J23jaPYvph8muF-LMpz6zoHJUG8Ob04xVWxzHamOTmTNr7t5DZvMT1AvUJEmtf4bOErcQavd0lHZgFyj7oV8ua_WbCgbAAtXJdoik7qbtFC1r-9d0Qg9J_tcoz8mgj5DEmCzOUp0Tsx3pFWhy6LeDWifQ"
            />
            <div className="absolute bottom-12 left-12 right-12 z-20">
              <h2 className="text-4xl font-extrabold text-white drop-shadow-md leading-tight mb-4">
                Hành trình mới,<br />Trải nghiệm mới
              </h2>
              <p className="text-white/90 text-lg font-medium">
                Khám phá Việt Nam cùng hệ thống đặt vé xe khách hiện đại hàng đầu.
              </p>
            </div>
          </div>

          {/* Login Form Side */}
          <div className="p-8 sm:p-12 lg:p-16 flex flex-col justify-center">
            <div className="mb-10">
              <h1 className="text-4xl font-extrabold text-on-surface tracking-tight mb-2">
                Đăng nhập
              </h1>
              <p className="text-on-surface-variant text-lg">Chào mừng bạn trở lại!</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl mb-6">
                <span className="material-symbols-outlined text-red-500">error</span>
                <span className="text-sm font-medium">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-on-surface-variant ml-1">
                  Email
                </label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">
                    mail
                  </span>
                  <input
                    className="w-full pl-12 pr-4 py-4 bg-surface-container-low border border-transparent rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:text-gray-400 font-medium"
                    placeholder="Nhập email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-on-surface-variant ml-1">
                  Mật khẩu
                </label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">
                    lock
                  </span>
                  <input
                    className="w-full pl-12 pr-12 py-4 bg-surface-container-low border border-transparent rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:text-gray-400 font-medium"
                    placeholder="Nhập mật khẩu"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
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

              {/* Remember & Forgot */}
              <div className="flex items-center justify-between py-1">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    className="w-5 h-5 border-2 border-outline rounded-md text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-on-surface-variant group-hover:text-on-surface transition-colors">
                    Ghi nhớ đăng nhập
                  </span>
                </label>
                <button
                  type="button"
                  className="text-sm font-semibold text-primary hover:underline"
                >
                  Quên mật khẩu?
                </button>
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
                    <span>Đang đăng nhập...</span>
                  </>
                ) : (
                  <span>Đăng nhập</span>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-10 flex items-center">
              <div className="flex-grow border-t border-outline-variant/30"></div>
              <span className="flex-shrink mx-4 text-sm font-medium text-outline">hoặc</span>
              <div className="flex-grow border-t border-outline-variant/30"></div>
            </div>

            {/* Social Login */}
            <div className="grid grid-cols-2 gap-4">
              <button className="flex items-center justify-center gap-3 py-3 px-4 border border-outline-variant/50 rounded-xl hover:bg-surface-container-low transition-colors active:scale-95">
                <img
                  alt="Google"
                  className="w-5 h-5"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBYJGiPb7OyQi-ieX2U-GoqnGW7Jk96pa-TD4kyB-0ck_sI8iNpe2jQ95iZhpZuCZNLTdsK0JVRoSu5en5AudwZ99yZGwHGmkHIg74Ptm_nB7DmPV2Fd8QqS3dWg0ZbvN_F5IOFmmbTRlL33zA78XddRVCthYSvw-jDE7_zuU6rAk_ZT1433bMBkqC0znq2kjkdIomvo5e-s-hgg7W1Y-xkr_rofXM9hjpi9qOwVEbM6tXAQxWXJ3eH9EHOh5R3cbokWtCPuZ9Gjig"
                />
                <span className="text-sm font-semibold">Google</span>
              </button>
              <button className="flex items-center justify-center gap-3 py-3 px-4 border border-outline-variant/50 rounded-xl hover:bg-surface-container-low transition-colors active:scale-95">
                <img
                  alt="Facebook"
                  className="w-5 h-5"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDWcGcYV7otjE8GNnuIL2x13B1SbCZ0PFn6k3IYR5hG6Opxh159OF5CA3JvXdu7I-q4-kQs_IYRf-dR2RQMUJq2LdtwXU0lklcpwxU5fnpzDv06DSoNZ8w3DuayLZyKmyE2utedguMO7X6V66oajIVTojhzHwv5c5elXusSxh6bsvw36h47WOG7LGH9wi4hZJ0GZPBIn2fXv2jlQMbOSBJNvwYHkFqTvFDDt7ziaCm_W3QWOKaozCrSzcJSK-Jrd4jYw88F6m6SeJQ"
                />
                <span className="text-sm font-semibold">Facebook</span>
              </button>
            </div>

            {/* Register Link */}
            <div className="mt-10 text-center">
              <p className="text-on-surface-variant">
                Chưa có tài khoản?{" "}
                <Link to="/register" className="text-secondary font-bold hover:underline ml-1">
                  Đăng ký ngay
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-8 bg-white flex justify-center items-center px-6 border-t border-gray-100">
        <div className="flex flex-col items-center gap-2">
          <div className="text-lg font-bold text-primary">BusGo</div>
          <p className="text-sm text-gray-500">© 2024 BusGo. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default Login;
