import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../context/ToastContext";

const DriverProfile = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      const userData = JSON.parse(stored);
      setUser(userData);
      setFormData(userData);
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      // In production, call API to update profile
      // await updateDriverProfile(formData);
      
      localStorage.setItem("user", JSON.stringify(formData));
      setUser(formData);
      setIsEditing(false);
      addToast("Cập nhật hồ sơ thành công", "success");
    } catch (err) {
      console.error("Lỗi cập nhật:", err);
      addToast("Cập nhật hồ sơ thất bại", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    addToast("Đã đăng xuất", "success");
    navigate("/login");
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-surface p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <p className="text-on-surface-variant mt-4">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface p-6 lg:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-4xl font-extrabold text-on-surface mb-2">Hồ sơ cá nhân</h1>
          <p className="text-on-surface-variant">Quản lý thông tin tài khoản của bạn</p>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-sm p-6 lg:p-8 mb-6">
          {/* Avatar Section */}
          <div className="flex items-center gap-6 mb-8 pb-8 border-b border-outline-variant/20">
            <div className="w-20 h-20 bg-primary-container rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined text-4xl text-primary">person</span>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-on-surface">{user.fullName}</h2>
              <p className="text-on-surface-variant">{user.email}</p>
              <p className="text-sm text-on-surface-variant mt-1">ID: {user.id || "N/A"}</p>
            </div>
          </div>

          {/* Profile Form */}
          {isEditing ? (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-on-surface mb-2">Họ và tên</label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName || ""}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-surface-container-low border-0 rounded-xl focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-on-surface mb-2">Tên đăng nhập</label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username || ""}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-surface-container-low border-0 rounded-xl focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-on-surface mb-2">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email || ""}
                    onChange={handleChange}
                    disabled
                    className="w-full px-4 py-3 bg-surface-container-low border-0 rounded-xl focus:ring-2 focus:ring-primary outline-none opacity-50 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-on-surface mb-2">Số điện thoại</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone || ""}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-surface-container-low border-0 rounded-xl focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-on-surface mb-2">Số CCCD/Passport</label>
                  <input
                    type="text"
                    name="idNumber"
                    value={formData.idNumber || ""}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-surface-container-low border-0 rounded-xl focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-on-surface mb-2">Số bằng lái</label>
                  <input
                    type="text"
                    name="licenseNumber"
                    value={formData.licenseNumber || ""}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-surface-container-low border-0 rounded-xl focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-on-surface mb-2">Số xe</label>
                  <input
                    type="text"
                    name="vehicleNumber"
                    value={formData.vehicleNumber || ""}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-surface-container-low border-0 rounded-xl focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-on-surface mb-2">Loại xe</label>
                  <input
                    type="text"
                    name="vehicleType"
                    value={formData.vehicleType || ""}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-surface-container-low border-0 rounded-xl focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-on-surface mb-2">Công ty</label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName || ""}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-surface-container-low border-0 rounded-xl focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-on-surface-variant text-sm font-medium">Tên đăng nhập</p>
                  <p className="text-on-surface font-semibold">{formData.username || "—"}</p>
                </div>
                <div>
                  <p className="text-on-surface-variant text-sm font-medium">Số điện thoại</p>
                  <p className="text-on-surface font-semibold">{formData.phone || "—"}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-on-surface-variant text-sm font-medium">Số bằng lái</p>
                  <p className="text-on-surface font-semibold">{formData.licenseNumber || "—"}</p>
                </div>
                <div>
                  <p className="text-on-surface-variant text-sm font-medium">Số xe</p>
                  <p className="text-on-surface font-semibold">{formData.vehicleNumber || "—"}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-on-surface-variant text-sm font-medium">Loại xe</p>
                  <p className="text-on-surface font-semibold">{formData.vehicleType || "—"}</p>
                </div>
                <div>
                  <p className="text-on-surface-variant text-sm font-medium">Công ty</p>
                  <p className="text-on-surface font-semibold">{formData.companyName || "—"}</p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 mt-8">
            {isEditing ? (
              <>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setFormData(user);
                  }}
                  className="flex-1 px-6 py-3 border-2 border-primary text-primary font-bold rounded-xl hover:bg-primary/10 transition-all active:scale-95"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/80 disabled:opacity-60 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined">check</span>
                      <span>Lưu thay đổi</span>
                    </>
                  )}
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="flex-1 px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/80 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">edit</span>
                <span>Chỉnh sửa</span>
              </button>
            )}
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full px-6 py-4 border-2 border-error text-error font-bold rounded-xl hover:bg-error/10 transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined">logout</span>
          <span>Đăng xuất</span>
        </button>
      </div>
    </div>
  );
};

export default DriverProfile;
