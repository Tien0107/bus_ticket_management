import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { companySignUp } from "../../api/company";
import { useToast } from "../../context/ToastContext";

export default function CompanyRegisterForm() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [form, setForm] = useState({
    username: "",
    fullName: "",
    email: "",
    phone: "",
    password: "",
    companyId: "",
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
    if (!form.username.trim()) return "Tên đăng nhập bắt buộc";
    if (form.username.length < 3) return "Tên đăng nhập tối thiểu 3 ký tự";
    if (!form.fullName.trim()) return "Họ tên bắt buộc";
    if (!form.email.trim()) return "Email bắt buộc";
    if (!form.email.includes("@")) return "Email không hợp lệ";
    if (!form.phone.trim()) return "Số điện thoại bắt buộc";
    if (form.phone.length < 10) return "Số điện thoại tối thiểu 10 ký tự";
    if (!form.password) return "Mật khẩu bắt buộc";
    if (form.password.length < 8) return "Mật khẩu tối thiểu 8 ký tự";
    if (!form.companyId) return "ID công ty bắt buộc";
    if (!Number.isFinite(Number(form.companyId))) return "ID công ty không hợp lệ";
    if (!agreeTerms) return "Vui lòng đồng ý với Điều khoản sử dụng và Chính sách bảo mật.";
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
      companyId: Number(form.companyId),
    };

    try {
      setLoading(true);
      await companySignUp(payload);
      addToast("Đăng ký công ty thành công", "success");
      setTimeout(() => navigate("/login"), 500);
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Đăng ký thất bại";
      setError(errorMessage);
      addToast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-on-surface mb-2">Đăng ký Công ty</h3>
        <p className="text-on-surface-variant">Tham gia BusGo để quản lý xe buýt của bạn</p>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-600">
          <span className="material-symbols-outlined text-red-500">error</span>
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      <div>
        <h4 className="text-lg font-bold text-on-surface mb-4">Thông tin tài khoản</h4>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-on-surface mb-2">Tên đăng nhập *</label>
            <input
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-surface-container-low border-0 rounded-xl focus:ring-2 focus:ring-primary outline-none"
              placeholder="company_admin"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-on-surface mb-2">Họ tên *</label>
            <input
              type="text"
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-surface-container-low border-0 rounded-xl focus:ring-2 focus:ring-primary outline-none"
              placeholder="Nguyễn Văn A"
              required
            />
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-lg font-bold text-on-surface mb-4">Thông tin liên hệ</h4>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-on-surface mb-2">Email *</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-surface-container-low border-0 rounded-xl focus:ring-2 focus:ring-primary outline-none"
              placeholder="company@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-on-surface mb-2">Số điện thoại *</label>
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-surface-container-low border-0 rounded-xl focus:ring-2 focus:ring-primary outline-none"
              placeholder="0901234567"
              required
            />
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-lg font-bold text-on-surface mb-4">Bảo mật và công ty</h4>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-on-surface mb-2">Mật khẩu *</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
                className="w-full px-4 py-3 pr-12 bg-surface-container-low border-0 rounded-xl focus:ring-2 focus:ring-primary outline-none"
                placeholder="Abcd12345#"
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

          <div>
            <label className="block text-sm font-bold text-on-surface mb-2">ID công ty *</label>
            <input
              type="number"
              name="companyId"
              value={form.companyId}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-surface-container-low border-0 rounded-xl focus:ring-2 focus:ring-primary outline-none"
              placeholder="1"
              required
            />
          </div>
        </div>
      </div>

      <div className="flex items-start gap-4 py-2 px-1 relative">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-secondary-container rounded-full"></div>
        <div className="pl-4 flex items-center">
          <input
            type="checkbox"
            id="terms-company"
            checked={agreeTerms}
            onChange={(event) => setAgreeTerms(event.target.checked)}
            className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary"
          />
          <label className="ml-3 text-sm text-on-surface-variant leading-tight" htmlFor="terms-company">
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

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-primary text-white px-6 py-4 rounded-xl font-bold hover:bg-primary/80 disabled:opacity-60 transition-all active:scale-95 flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            <span>Đang đăng ký...</span>
          </>
        ) : (
          <>
            <span className="material-symbols-outlined">business</span>
            <span>Đăng ký công ty</span>
          </>
        )}
      </button>
    </form>
  );
}
