import { useState } from "react";
import { customerSignUp } from "../api/auth";
import { useNavigate, Link } from "react-router-dom";

function Register() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  const [form, setForm] = useState({
    fullName: "",
    username: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validate
    if (!agreeTerms) {
      setError("Vui lòng đồng ý với Điều khoản sử dụng và Chính sách bảo mật.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }
    // Validate password theo yêu cầu backend
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[#@$%&!*?^_])[^\s]+$/;
    if (!passwordRegex.test(form.password)) {
      setError("Mật khẩu phải có chữ hoa, chữ thường, số và ký tự đặc biệt (#@$%&!*?^_), không có dấu cách.");
      return;
    }
    if (form.password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }

    setLoading(true);

    const payload = {
      username: form.username,
      fullName: form.fullName,
      contactInfo: {
        email: form.email,
        phone: form.phone,
      },
      password: form.password,
    };

    try {
      const res = await customerSignUp(payload);
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      navigate("/home");
    } catch (err) {
      const data = err.response?.data;
      if (data?.issues && Array.isArray(data.issues)) {
        // Backend trả về mảng issues với field + reason
        const msgs = data.issues.map((i) => i.reason || i.field).join(". ");
        setError(msgs);
      } else {
        setError(data?.message || "Đăng ký thất bại. Vui lòng thử lại.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface text-on-surface font-body flex flex-col">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl shadow-sm">
        <div className="flex justify-between items-center px-6 py-4 max-w-7xl mx-auto">
          <Link to="/" className="text-2xl font-bold tracking-tight text-primary">
            BusGo
          </Link>
          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="text-gray-600 text-sm font-medium hover:text-primary transition-colors"
            >
              Đăng nhập
            </Link>
            <span className="material-symbols-outlined text-primary">account_circle</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex pt-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 w-full max-w-[1440px] mx-auto px-4 lg:px-0">
          {/* Side Decoration */}
          <div className="hidden lg:flex lg:col-span-5 relative overflow-hidden bg-surface-container-high p-12 flex-col justify-end">
            <div className="absolute inset-0 z-0">
              <img
                alt="Xe khách du lịch"
                className="w-full h-full object-cover opacity-80"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBobC3C5DJQKBldYhJuagSS9twisoy1uKKIv0C9y3KvYxaMRvaB4E_F6DkbCGYow0EX0PM0Jy1Ey5Dqm7y_6iF1xUstDRJ-ma7f9q978PkZjKJeHXAn3XjBjmIPbVsVn5_U4OGnUj-1OSY7c7k4IbLq60yQyDbpTHkQfh6qr6OM4KWuMZXQE1imOYryzDVqxM3485-egGzCSngoNz0bZ75wHN5w_7LEg7N_MUgI0wpDDlVUPqdb3y2lwy_3Gv2a7ixZ7b2P-0vp5V0"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/40 to-transparent"></div>
            </div>
            <div className="relative z-10 space-y-4 max-w-md">
              <h1 className="text-4xl font-extrabold text-white leading-tight drop-shadow-md">
                Hành trình xanh, <br />Trải nghiệm mới.
              </h1>
              <p className="text-white/90 text-lg font-medium">
                Khám phá Việt Nam cùng BusGo. Tiết kiệm thời gian, bảo vệ môi trường.
              </p>
            </div>
          </div>

          {/* Registration Form Area */}
          <div className="col-span-1 lg:col-span-7 flex items-center justify-center py-12 lg:py-20 bg-surface">
            <div className="w-full max-w-xl px-4 lg:px-12">
              <div className="bg-white rounded-3xl p-8 lg:p-10 shadow-editorial">
                {/* Form Header */}
                <div className="mb-10">
                  <h2 className="text-3xl font-extrabold text-on-surface mb-2 tracking-tight">
                    Đăng ký tài khoản
                  </h2>
                  <p className="text-on-surface-variant text-base">
                    Tạo tài khoản để đặt vé dễ dàng hơn
                  </p>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl mb-6">
                    <span className="material-symbols-outlined text-red-500">error</span>
                    <span className="text-sm font-medium">{error}</span>
                  </div>
                )}

                {/* Registration Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Full Name */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-on-surface-variant ml-1">
                      Họ và tên
                    </label>
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

                  {/* Username */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-on-surface-variant ml-1">
                      Tên đăng nhập
                    </label>
                    <input
                      name="username"
                      className="w-full bg-white border-0 rounded-xl p-4 text-on-surface ring-1 ring-outline-variant/30 focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-gray-400"
                      placeholder="nguyenvana"
                      type="text"
                      value={form.username}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  {/* Email & Phone */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-on-surface-variant ml-1">
                        Email
                      </label>
                      <input
                        name="email"
                        className="w-full bg-white border-0 rounded-xl p-4 text-on-surface ring-1 ring-outline-variant/30 focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-gray-400"
                        placeholder="example@email.com"
                        type="email"
                        value={form.email}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-on-surface-variant ml-1">
                        Số điện thoại
                      </label>
                      <input
                        name="phone"
                        className="w-full bg-white border-0 rounded-xl p-4 text-on-surface ring-1 ring-outline-variant/30 focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-gray-400"
                        placeholder="09xx xxx xxx"
                        type="tel"
                        value={form.phone}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  {/* Password & Confirm */}
                  <p className="text-xs text-on-surface-variant bg-surface-container-low rounded-lg px-3 py-2 flex items-start gap-2">
                    <span className="material-symbols-outlined text-sm text-primary mt-0.5">info</span>
                    Mật khẩu phải có chữ hoa, chữ thường, số và ký tự đặc biệt (#@$%&!*?^_)
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-on-surface-variant ml-1">
                        Mật khẩu
                      </label>
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
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-primary transition-colors"
                        >
                          <span className="material-symbols-outlined text-xl">
                            {showPassword ? "visibility_off" : "visibility"}
                          </span>
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-on-surface-variant ml-1">
                        Xác nhận mật khẩu
                      </label>
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

                  {/* Terms & Conditions */}
                  <div className="flex items-start gap-4 py-2 px-1 relative">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-secondary-container rounded-full"></div>
                    <div className="pl-4 flex items-center">
                      <input
                        type="checkbox"
                        id="terms"
                        checked={agreeTerms}
                        onChange={(e) => setAgreeTerms(e.target.checked)}
                        className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary"
                      />
                      <label className="ml-3 text-sm text-on-surface-variant leading-tight" htmlFor="terms">
                        Tôi đồng ý với{" "}
                        <span className="text-primary font-semibold cursor-pointer hover:underline">
                          Điều khoản sử dụng
                        </span>{" "}
                        và{" "}
                        <span className="text-primary font-semibold cursor-pointer hover:underline">
                          Chính sách bảo mật
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-primary to-primary-container text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Đang đăng ký...</span>
                      </>
                    ) : (
                      <span>Đăng ký</span>
                    )}
                  </button>
                </form>

                {/* Social Divider */}
                <div className="relative my-8 flex items-center">
                  <div className="flex-grow border-t border-outline-variant/20"></div>
                  <span className="flex-shrink mx-4 text-on-surface-variant text-sm font-medium">hoặc</span>
                  <div className="flex-grow border-t border-outline-variant/20"></div>
                </div>

                {/* Social Buttons */}
                <div className="grid grid-cols-2 gap-4">
                  <button className="flex items-center justify-center gap-3 bg-surface-container-high text-on-surface font-semibold py-3 px-4 rounded-xl hover:bg-surface-container-highest transition-colors active:scale-95">
                    <img
                      alt="Google"
                      className="w-5 h-5"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuCariVLBls2Idh5tkIwWWIk-8TLFIfoy4y_mf1Vbq9ElNbpC2169v_2VnpaJKEb5wvPNL03ePg53T4MqWlW1j4r_IYTXhqdFXR2bwsO36TKl1q5OP0r-KaXRm7u-c9SwQIT8a3fuvYnIqLwvFNkGgVmlpK_uiWww9bPdAGhHTJzB7hplVIbhBaEitZ4gKKF1hSS_TjU0-MKtyzFlJwzZA2AWsU78aUtuq96tr78hRorXUEV2cQmXMOakSGStz0wXZsFQ1FbgctT7_A"
                    />
                    <span>Google</span>
                  </button>
                  <button className="flex items-center justify-center gap-3 bg-surface-container-high text-on-surface font-semibold py-3 px-4 rounded-xl hover:bg-surface-container-highest transition-colors active:scale-95">
                    <img
                      alt="Facebook"
                      className="w-5 h-5"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuDcyTvtc6CRrUIWGcVG3juYnFYM4cRSlEm5en0dxABopP-LVSSQAD9a3OJ10FT4mHImAnu3BxAMSx1cILTq3hMMd4FzwKbnuE0xLc7w-SYlqYAoUfWsd7JqgXP4Do-YRszsdi2CbFDiL7CeZYlllEn4Tki1di1jFCxUPl5AmKOZDGuv7Hi2hAqkJhpeOBs1Q0RmDDo3C9MdiLoFrU2Ycz-EfbHA-2s0-nFn3wqbvl7YPDdMk1i6eH6pQXsWuH6lBT3Z6D-DqQZrtwU"
                    />
                    <span>Facebook</span>
                  </button>
                </div>

                {/* Login Redirect */}
                <div className="mt-8 text-center">
                  <p className="text-on-surface-variant">
                    Đã có tài khoản?{" "}
                    <Link to="/login" className="text-primary font-bold ml-1 hover:underline">
                      Đăng nhập
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-8 mt-auto bg-gray-50">
        <div className="flex flex-col md:flex-row justify-between items-center px-8 gap-4 max-w-7xl mx-auto">
          <div className="text-xs text-gray-500">
            © 2024 BusGo. Bản quyền thuộc về Đội ngũ Phát triển.
          </div>
          <div className="flex gap-6">
            <span className="text-xs text-gray-500 hover:text-gray-800 transition-colors cursor-pointer">
              Điều khoản sử dụng
            </span>
            <span className="text-xs text-gray-500 hover:text-gray-800 transition-colors cursor-pointer">
              Chính sách bảo mật
            </span>
            <span className="text-xs text-gray-500 hover:text-gray-800 transition-colors cursor-pointer">
              Liên hệ
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Register;
