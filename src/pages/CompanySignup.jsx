import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { companySignUp } from "../api/company";
import { useToast } from "../context/ToastContext";

export default function CompanySignup() {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    companyName: "",
    email: "",
    phone: "",
    username: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.companyName.trim()) newErrors.companyName = "Tên công ty bắt buộc";
    if (!formData.email.trim()) newErrors.email = "Email bắt buộc";
    if (!formData.email.includes("@")) newErrors.email = "Email không hợp lệ";
    if (!formData.phone.trim()) newErrors.phone = "Số điện thoại bắt buộc";
    if (formData.phone.length < 10) newErrors.phone = "Số điện thoại tối thiểu 10 ký tự";
    if (!formData.username.trim()) newErrors.username = "Tên đăng nhập bắt buộc";
    if (formData.username.length < 3) newErrors.username = "Tên đăng nhập tối thiểu 3 ký tự";

    if (!formData.password) newErrors.password = "Mật khẩu bắt buộc";
    if (formData.password.length < 6) newErrors.password = "Mật khẩu tối thiểu 6 ký tự";
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Mật khẩu không khớp";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setLoading(true);
      const payload = {
        username: formData.username,
        fullName: formData.companyName,
        contactInfo: {
          email: formData.email,
          phone: formData.phone,
        },
        password: formData.password,
        companyId: 1, // Default company ID
        role: "operator",
        staffProfileRole: "operator",
      };

      console.log("Signup payload:", payload);
      const res = await companySignUp(payload);
      
      addToast("Đăng ký công ty thành công!", "success");
      
      setTimeout(() => {
        navigate("/login");
      }, 500);
    } catch (err) {
      console.error("Signup error:", err);
      console.error("Error response:", err.response?.data); // ← Debug: xem lỗi từ BE
      const errorMsg = err.response?.data?.message || "Đăng ký thất bại";
      addToast(errorMsg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-container to-surface p-6 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-primary-container p-8 text-white">
          <h1 className="text-3xl font-bold mb-2">Đăng ký Công ty</h1>
          <p className="opacity-90">Tham gia BusGo để quản lý xe buýt của bạn</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* Company Info Section */}
          <div>
            <h2 className="text-lg font-bold text-on-surface mb-4">Thông tin công ty</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-on-surface mb-2">Tên công ty *</label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-surface-container-low border-0 rounded-xl focus:ring-2 focus:ring-primary outline-none"
                  placeholder="Công ty vận tải ABC"
                />
                {errors.companyName && <p className="text-red-600 text-sm mt-1">{errors.companyName}</p>}
              </div>
            </div>
          </div>

          {/* Contact Info Section */}
          <div>
            <h2 className="text-lg font-bold text-on-surface mb-4">Thông tin liên hệ</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-on-surface mb-2">Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-surface-container-low border-0 rounded-xl focus:ring-2 focus:ring-primary outline-none"
                  placeholder="company@example.com"
                />
                {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-bold text-on-surface mb-2">Số điện thoại *</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-surface-container-low border-0 rounded-xl focus:ring-2 focus:ring-primary outline-none"
                  placeholder="0901234567"
                />
                {errors.phone && <p className="text-red-600 text-sm mt-1">{errors.phone}</p>}
              </div>
            </div>
          </div>

          {/* Account Section */}
          <div>
            <h2 className="text-lg font-bold text-on-surface mb-4">Tài khoản đăng nhập</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-on-surface mb-2">Tên đăng nhập *</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-surface-container-low border-0 rounded-xl focus:ring-2 focus:ring-primary outline-none"
                  placeholder="company_admin"
                />
                {errors.username && <p className="text-red-600 text-sm mt-1">{errors.username}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-on-surface mb-2">Mật khẩu *</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-surface-container-low border-0 rounded-xl focus:ring-2 focus:ring-primary outline-none"
                    placeholder="••••••"
                  />
                  {errors.password && <p className="text-red-600 text-sm mt-1">{errors.password}</p>}
                </div>

                <div>
                  <label className="block text-sm font-bold text-on-surface mb-2">Xác nhận mật khẩu *</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-surface-container-low border-0 rounded-xl focus:ring-2 focus:ring-primary outline-none"
                    placeholder="••••••"
                  />
                  {errors.confirmPassword && <p className="text-red-600 text-sm mt-1">{errors.confirmPassword}</p>}
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
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

          {/* Login Link */}
          <p className="text-center text-on-surface-variant">
            Đã có tài khoản?{" "}
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="text-primary font-bold hover:underline"
            >
              Đăng nhập
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
