import React, { useState, useEffect } from "react";
import { getCompanyInfo, updateCompanyInfo } from "../../api/company";
import { useToast } from "../../context/ToastContext";
import { useNavigate } from "react-router-dom";

export default function CompanyProfile() {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await getCompanyInfo();
      const data = response.data?.company || response.data;
      setProfile(data);
      setFormData(data);
    } catch (err) {
      console.error("Lỗi tải hồ sơ:", err);
      addToast("Không thể tải hồ sơ công ty", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateCompanyInfo(formData);
      setProfile(formData);
      setIsEditing(false);
      addToast("Cập nhật hồ sơ thành công", "success");
    } catch (err) {
      console.error("Lỗi cập nhật:", err);
      addToast("Cập nhật hồ sơ thất bại", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    addToast("Đã đăng xuất", "success");
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <p className="text-on-surface-variant mt-4">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-surface p-6 flex items-center justify-center">
        <div className="text-center">
          <span className="material-symbols-outlined text-6xl text-on-surface-variant opacity-50">
            warning
          </span>
          <p className="text-on-surface-variant mt-4">Không thể tải hồ sơ công ty</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface p-6 lg:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold text-on-surface mb-2">Hồ sơ công ty</h1>
          <p className="text-on-surface-variant">Quản lý thông tin công ty</p>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-6">
          {/* Avatar Banner */}
          <div className="h-32 bg-gradient-to-r from-primary to-primary-container flex items-end justify-start p-6">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center border-4 border-primary shadow-lg">
              <span className="material-symbols-outlined text-5xl text-primary">business</span>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 pt-0">
            {isEditing ? (
              <div className="space-y-5">
                {/* Company Info */}
                <div>
                  <h2 className="text-xl font-bold text-on-surface mb-4">Thông tin công ty</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-on-surface mb-2">Tên công ty</label>
                      <input
                        type="text"
                        name="companyName"
                        value={formData.companyName || ""}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-surface-container-low border-0 rounded-xl focus:ring-2 focus:ring-primary outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-on-surface mb-2">Số ĐKKD</label>
                        <input
                          type="text"
                          name="businessRegistration"
                          value={formData.businessRegistration || ""}
                          onChange={handleChange}
                          className="w-full px-4 py-3 bg-surface-container-low border-0 rounded-xl focus:ring-2 focus:ring-primary outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-on-surface mb-2">Mã số thuế</label>
                        <input
                          type="text"
                          name="taxCode"
                          value={formData.taxCode || ""}
                          onChange={handleChange}
                          className="w-full px-4 py-3 bg-surface-container-low border-0 rounded-xl focus:ring-2 focus:ring-primary outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-on-surface mb-2">Địa chỉ</label>
                      <input
                        type="text"
                        name="address"
                        value={formData.address || ""}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-surface-container-low border-0 rounded-xl focus:ring-2 focus:ring-primary outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-on-surface mb-2">Thành phố</label>
                        <input
                          type="text"
                          name="city"
                          value={formData.city || ""}
                          onChange={handleChange}
                          className="w-full px-4 py-3 bg-surface-container-low border-0 rounded-xl focus:ring-2 focus:ring-primary outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-on-surface mb-2">Quốc gia</label>
                        <input
                          type="text"
                          name="country"
                          value={formData.country || ""}
                          onChange={handleChange}
                          className="w-full px-4 py-3 bg-surface-container-low border-0 rounded-xl focus:ring-2 focus:ring-primary outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact Info */}
                <div>
                  <h2 className="text-xl font-bold text-on-surface mb-4">Thông tin liên hệ</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-on-surface mb-2">Email</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email || ""}
                        onChange={handleChange}
                        disabled
                        className="w-full px-4 py-3 bg-surface-container-low border-0 rounded-xl outline-none opacity-50 cursor-not-allowed"
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

                    <div>
                      <label className="block text-sm font-bold text-on-surface mb-2">Website</label>
                      <input
                        type="url"
                        name="website"
                        value={formData.website || ""}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-surface-container-low border-0 rounded-xl focus:ring-2 focus:ring-primary outline-none"
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-bold text-on-surface mb-2">Mô tả</label>
                  <textarea
                    name="description"
                    value={formData.description || ""}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-surface-container-low border-0 rounded-xl focus:ring-2 focus:ring-primary outline-none resize-none"
                    rows="4"
                    placeholder="Mô tả về công ty của bạn..."
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl font-bold text-on-surface mb-1">{profile.companyName}</h2>
                  <p className="text-on-surface-variant">Số ĐKKD: {profile.businessRegistration}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-outline-variant/20 pt-6">
                  <div>
                    <p className="text-on-surface-variant text-sm font-medium mb-1">Email</p>
                    <p className="text-on-surface font-semibold">{profile.email}</p>
                  </div>
                  <div>
                    <p className="text-on-surface-variant text-sm font-medium mb-1">Số điện thoại</p>
                    <p className="text-on-surface font-semibold">{profile.phone || "—"}</p>
                  </div>
                  <div>
                    <p className="text-on-surface-variant text-sm font-medium mb-1">Địa chỉ</p>
                    <p className="text-on-surface font-semibold">{profile.address}</p>
                  </div>
                  <div>
                    <p className="text-on-surface-variant text-sm font-medium mb-1">Thành phố</p>
                    <p className="text-on-surface font-semibold">{profile.city}</p>
                  </div>
                </div>

                {profile.description && (
                  <div className="border-t border-outline-variant/20 pt-6">
                    <p className="text-on-surface-variant text-sm font-medium mb-2">Mô tả</p>
                    <p className="text-on-surface">{profile.description}</p>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 mt-8 pt-6 border-t border-outline-variant/20">
              {isEditing ? (
                <>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setFormData(profile);
                    }}
                    className="flex-1 px-6 py-3 border-2 border-primary text-primary rounded-xl font-bold hover:bg-primary/10 transition-all"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/80 disabled:opacity-60 transition-all flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Đang lưu...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined">save</span>
                        <span>Lưu thay đổi</span>
                      </>
                    )}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex-1 px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/80 transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined">edit</span>
                  <span>Chỉnh sửa</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full px-6 py-4 border-2 border-error text-error rounded-xl font-bold hover:bg-error/10 transition-all flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined">logout</span>
          <span>Đăng xuất</span>
        </button>
      </div>
    </div>
  );
}
