import React, { useState } from "react";
import { companySupportRegister } from "../../api/companySupport";
import { useNavigate, Link } from "react-router-dom";

export default function SupportRegister() {
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
    companyId: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!agreeTerms) {
      setError("Vui lòng đồng ý với Điều khoản sử dụng.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
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
      companyId: parseInt(form.companyId, 10),
    };

    try {
      const res = await companySupportRegister(payload);
      // Giả định backend trả về token luôn, hoặc bắt login lại
      if (res.data?.token) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        navigate("/company-support/tickets");
      } else {
        alert("Đăng ký thành công! Vui lòng chờ công ty duyệt hoặc tiến hành đăng nhập.");
        navigate("/login");
      }
    } catch (err) {
      const data = err.response?.data;
      if (data?.issues && Array.isArray(data.issues)) {
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
    <div className="min-h-screen bg-surface flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-md border border-outline-variant/20">
        <div className="text-center mb-8">
           <h2 className="text-3xl font-extrabold text-primary mb-2">Đăng ký Support</h2>
           <p className="text-on-surface-variant text-sm">Cổng dành riêng cho nhân viên nhà xe</p>
        </div>

        {error && (
          <div className="bg-error-container text-on-error-container p-4 rounded-xl mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-on-surface-variant ml-1 mb-1">Mã nhà xe (Company ID)</label>
            <input
              name="companyId"
              type="number"
              required
              value={form.companyId}
              onChange={handleChange}
              className="w-full bg-surface-container-low border-0 rounded-xl p-3 text-on-surface ring-1 ring-outline-variant/30 focus:ring-2 focus:ring-primary outline-none transition-all"
              placeholder="Ví dụ: 1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-on-surface-variant ml-1 mb-1">Họ và tên</label>
            <input
              name="fullName"
              type="text"
              required
              value={form.fullName}
              onChange={handleChange}
              className="w-full bg-surface-container-low border-0 rounded-xl p-3 text-on-surface ring-1 ring-outline-variant/30 focus:ring-2 focus:ring-primary outline-none transition-all"
              placeholder="Nguyễn Văn B"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-on-surface-variant ml-1 mb-1">Tên đăng nhập</label>
            <input
              name="username"
              type="text"
              required
              value={form.username}
              onChange={handleChange}
              className="w-full bg-surface-container-low border-0 rounded-xl p-3 text-on-surface ring-1 ring-outline-variant/30 focus:ring-2 focus:ring-primary outline-none transition-all"
              placeholder="support_b"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="block text-sm font-medium text-on-surface-variant ml-1 mb-1">Email</label>
               <input
                 name="email"
                 type="email"
                 required
                 value={form.email}
                 onChange={handleChange}
                 className="w-full bg-surface-container-low border-0 rounded-xl p-3 text-on-surface ring-1 ring-outline-variant/30 focus:ring-2 focus:ring-primary outline-none transition-all"
                 placeholder="abc@example.com"
               />
             </div>
             <div>
               <label className="block text-sm font-medium text-on-surface-variant ml-1 mb-1">Số điện thoại</label>
               <input
                 name="phone"
                 type="tel"
                 required
                 value={form.phone}
                 onChange={handleChange}
                 className="w-full bg-surface-container-low border-0 rounded-xl p-3 text-on-surface ring-1 ring-outline-variant/30 focus:ring-2 focus:ring-primary outline-none transition-all"
                 placeholder="09xx..."
               />
             </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-on-surface-variant ml-1 mb-1">Mật khẩu</label>
            <div className="relative">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                required
                value={form.password}
                onChange={handleChange}
                className="w-full bg-surface-container-low border-0 rounded-xl p-3 pr-10 text-on-surface ring-1 ring-outline-variant/30 focus:ring-2 focus:ring-primary outline-none transition-all"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-outline"
              >
                <span className="material-symbols-outlined text-lg">{showPassword ? "visibility_off" : "visibility"}</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-on-surface-variant ml-1 mb-1">Xác nhận mật khẩu</label>
            <input
              name="confirmPassword"
              type={showPassword ? "text" : "password"}
              required
              value={form.confirmPassword}
              onChange={handleChange}
              className="w-full bg-surface-container-low border-0 rounded-xl p-3 text-on-surface ring-1 ring-outline-variant/30 focus:ring-2 focus:ring-primary outline-none transition-all"
              placeholder="••••••••"
            />
          </div>

          <div className="flex items-center pt-2">
            <input
              type="checkbox"
              id="terms"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary"
            />
            <label className="ml-2 text-sm text-on-surface-variant" htmlFor="terms">
              Tôi xác nhận thông tin hỗ trợ nội bộ
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 bg-primary text-white font-bold py-3.5 rounded-xl hover:opacity-90 transition-opacity flex justify-center disabled:opacity-50"
          >
            {loading ? "Đang xử lý..." : "Đăng ký Support"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-on-surface-variant">
           Hoặc <Link to="/login" className="text-primary font-bold hover:underline">về trang Đăng nhập</Link>
        </div>
      </div>
    </div>
  );
}
