import { useState } from "react";
import { driverSignUp } from "../api/driver";
import { useNavigate, Link } from "react-router-dom";
import { useToast } from "../context/ToastContext";

function DriverSignup() {
  const navigate = useNavigate();
  const { addToast } = useToast();
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
    licenseNumber: "",
    vehicleNumber: "",
    vehicleType: "bus",
    companyName: "",
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
    if (form.phone.length < 10) {
      setError("Số điện thoại phải có ít nhất 10 ký tự.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }
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
      password: form.password,
      licenseNumber: form.licenseNumber,
      vehicleNumber: form.vehicleNumber,
      vehicleType: form.vehicleType,
      companyName: form.companyName,
      companyId: 1,  // ← ADD missing companyId
      contactInfo: {
        email: form.email,    // ← MOVE into contactInfo
        phone: form.phone,    // ← MOVE into contactInfo
      },
    };

    try {
      console.log("📤 Driver Signup Payload:", payload);
      const res = await driverSignUp(payload);
      console.log("📥 Response:", res.data);
      addToast("Đăng ký thành công", "success");
      
      setTimeout(() => {
        navigate("/login");
      }, 500);
    } catch (err) {
      console.log("🔴 ERROR Full:", err);
      console.log("🔴 ERROR Response:", err.response);
      console.log("🔴 ERROR Data:", err.response?.data);
      console.log("🔴 ERROR Status:", err.response?.status);
      
      const data = err.response?.data;
      let errorMsg = "Đăng ký thất bại";
      
      if (data?.issues && Array.isArray(data.issues)) {
        console.log("🔴 Issues detailed:");
        data.issues.forEach((issue, idx) => {
          console.log(`  Issue ${idx + 1}: Field="${issue.field}", Reason="${issue.reason}"`);
        });
        errorMsg = data.issues.map((i) => i.reason || i.field).join(". ");
        setError(errorMsg);
      } else {
        errorMsg = data?.message || "Đăng ký thất bại";
        setError(errorMsg);
      }
      
      addToast("Đăng ký thất bại", "error");
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
            <Link to="/login" className="text-gray-600 text-sm font-medium hover:text-primary transition-colors">
              Đăng nhập
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex pt-16">
        <div className="w-full max-w-2xl mx-auto px-4 lg:px-12 py-12 lg:py-20">
          <div className="bg-white rounded-3xl p-8 lg:p-10 shadow-editorial">
            <div className="mb-10">
              <h1 className="text-4xl font-extrabold text-on-surface mb-2 tracking-tight">
                Đăng ký Tài xế
              </h1>
              <p className="text-on-surface-variant text-base">
                Tham gia mạng lưới tài xế chuyên nghiệp của BusGo
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl mb-6">
                <span className="material-symbols-outlined text-red-500">error</span>
                <span className="text-sm font-medium">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Section: Thông tin cá nhân */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-bold text-on-surface mb-4">Thông tin cá nhân</h3>
                
                <div className="space-y-5">
                  {/* Full Name & Phone */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                  {/* Username & Email */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-on-surface-variant ml-1">
                        Tên đăng nhập
                      </label>
                      <input
                        name="username"
                        className="w-full bg-white border-0 rounded-xl p-4 text-on-surface ring-1 ring-outline-variant/30 focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-gray-400"
                        placeholder="taixe_nguyen"
                        type="text"
                        value={form.username}
                        onChange={handleChange}
                        required
                      />
                    </div>
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
                  </div>
                </div>
              </div>

              {/* Section: Thông tin bằng cấp */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-bold text-on-surface mb-4">Thông tin bằng cấp</h3>
                
                <div className="space-y-5">
                  {/* License Number */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-on-surface-variant ml-1">
                      Số giấy phép lái xe
                    </label>
                    <input
                      name="licenseNumber"
                      className="w-full bg-white border-0 rounded-xl p-4 text-on-surface ring-1 ring-outline-variant/30 focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-gray-400"
                      placeholder="123456789"
                      type="text"
                      value={form.licenseNumber}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Section: Thông tin xe */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-bold text-on-surface mb-4">Thông tin xe</h3>
                
                <div className="space-y-5">
                  {/* Vehicle Number & Type */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-on-surface-variant ml-1">
                        Biển số xe
                      </label>
                      <input
                        name="vehicleNumber"
                        className="w-full bg-white border-0 rounded-xl p-4 text-on-surface ring-1 ring-outline-variant/30 focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-gray-400"
                        placeholder="29A-12345"
                        type="text"
                        value={form.vehicleNumber}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-on-surface-variant ml-1">
                        Loại xe
                      </label>
                      <select
                        name="vehicleType"
                        className="w-full bg-white border-0 rounded-xl p-4 text-on-surface ring-1 ring-outline-variant/30 focus:ring-2 focus:ring-primary outline-none transition-all"
                        value={form.vehicleType}
                        onChange={handleChange}
                      >
                        <option value="bus">Xe bus</option>
                        <option value="minibus">Minibus</option>
                        <option value="coach">Xe khách</option>
                      </select>
                    </div>
                  </div>

                  {/* Company Name */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-on-surface-variant ml-1">
                      Tên công ty (nếu có)
                    </label>
                    <input
                      name="companyName"
                      className="w-full bg-white border-0 rounded-xl p-4 text-on-surface ring-1 ring-outline-variant/30 focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-gray-400"
                      placeholder="Công ty vận tải ABC"
                      type="text"
                      value={form.companyName}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              {/* Section: Bảo mật */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-bold text-on-surface mb-4">Bảo mật</h3>
                
                <p className="text-xs text-on-surface-variant bg-surface-container-low rounded-lg px-3 py-2 flex items-start gap-2 mb-4">
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
              </div>

              {/* Terms & Conditions */}
              <div className="flex items-start gap-4 py-2 px-1 relative border-t pt-6">
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
                  <span>Đăng ký Tài xế</span>
                )}
              </button>
            </form>

            {/* Login Link */}
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
      </main>

      {/* Footer */}
      <footer className="w-full py-8 mt-auto bg-gray-50">
        <div className="flex flex-col md:flex-row justify-between items-center px-8 gap-4 max-w-7xl mx-auto">
          <div className="text-xs text-gray-500">© 2024 BusGo.</div>
          <div className="flex gap-6">
            <span className="text-xs text-gray-500 hover:text-gray-800 transition-colors cursor-pointer">
              Điều khoản
            </span>
            <span className="text-xs text-gray-500 hover:text-gray-800 transition-colors cursor-pointer">
              Bảo mật
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default DriverSignup;
