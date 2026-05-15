import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { customerSignUp } from "../../api/auth";
import { useToast } from "../../context/ToastContext";

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[#@$%&!*?^_])[^\s]+$/;

export default function CustomerRegisterForm() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [form, setForm] = useState({
    fullName: "",
    username: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const validate = () => {
    if (!agreeTerms) return "Vui lòng đồng ý với Điều khoản sử dụng và Chính sách bảo mật.";
    if (form.password !== form.confirmPassword) return "Mật khẩu xác nhận không khớp.";
    if (!passwordRegex.test(form.password)) {
      return "Mật khẩu phải có chữ hoa, chữ thường, số và ký tự đặc biệt (#@$%&!*?^_), không có dấu cách.";
    }
    if (form.password.length < 6) return "Mật khẩu phải có ít nhất 6 ký tự.";
    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

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
      setLoading(true);
      await customerSignUp(payload);
      addToast("Đăng ký khách hàng thành công", "success");
      setTimeout(() => navigate("/login"), 500);
    } catch (err) {
      const data = err.response?.data;
      const errorMessage = Array.isArray(data?.issues)
        ? data.issues.map((item) => item.reason || item.field).join(". ")
        : data?.message || "Đăng ký thất bại";
      setError(errorMessage);
      addToast("Đăng ký thất bại", "error");
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

      <div className="space-y-2">
        <label className="block text-sm font-medium text-on-surface-variant ml-1">Tên đăng nhập</label>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-on-surface-variant ml-1">Email</label>
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
          <label className="block text-sm font-medium text-on-surface-variant ml-1">Số điện thoại</label>
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

      <div className="flex items-start gap-4 py-2 px-1 relative">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-secondary-container rounded-full"></div>
        <div className="pl-4 flex items-center">
          <input
            type="checkbox"
            id="terms-customer"
            checked={agreeTerms}
            onChange={(event) => setAgreeTerms(event.target.checked)}
            className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary"
          />
          <label className="ml-3 text-sm text-on-surface-variant leading-tight" htmlFor="terms-customer">
            Tôi đồng ý với{" "}
            <span className="text-primary font-semibold cursor-pointer hover:underline">Điều khoản sử dụng</span>{" "}
            và{" "}
            <span className="text-primary font-semibold cursor-pointer hover:underline">Chính sách bảo mật</span>
          </label>
        </div>
      </div>

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
          <span>Đăng ký khách hàng</span>
        )}
      </button>
    </form>
  );
}
