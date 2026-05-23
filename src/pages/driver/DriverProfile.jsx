import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../context/ToastContext";

const ProfileField = ({ label, value, icon }) => (
  <div className="rounded-lg border border-outline-variant/30 bg-white p-4">
    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
      <span className="material-symbols-outlined text-[22px] leading-none">{icon}</span>
    </div>
    <p className="text-sm font-medium text-on-surface-variant">{label}</p>
    <p className="mt-1 break-words font-semibold text-on-surface">{value || "Chưa cập nhật"}</p>
  </div>
);

const TextInput = ({ label, name, value, onChange, type = "text", disabled = false }) => (
  <label className="block">
    <span className="text-sm font-semibold text-on-surface">{label}</span>
    <input
      type={type}
      name={name}
      value={value || ""}
      onChange={onChange}
      disabled={disabled}
      className="mt-2 w-full rounded-lg border border-outline-variant/40 bg-white px-4 py-3 text-sm outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:bg-surface-container-low disabled:text-on-surface-variant"
    />
  </label>
);

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

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      localStorage.setItem("user", JSON.stringify(formData));
      setUser(formData);
      setIsEditing(false);
      addToast("Cập nhật hồ sơ thành công", "success");
    } catch {
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
      <div className="flex min-h-screen items-center justify-center bg-surface p-6">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
          <p className="mt-4 text-on-surface-variant">Đang tải hồ sơ...</p>
        </div>
      </div>
    );
  }

  const initials = (user.fullName || "TX")
    .split(" ")
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen bg-surface px-5 py-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">Hồ sơ tài xế</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-on-surface lg:text-4xl">
              Thông tin cá nhân
            </h1>
            <p className="mt-2 text-on-surface-variant">Quản lý thông tin liên hệ, bằng lái và phương tiện đang phụ trách.</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 transition-colors hover:bg-red-100"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            Đăng xuất
          </button>
        </div>

        <section className="overflow-hidden rounded-xl border border-outline-variant/30 bg-white shadow-sm">
          <div className="bg-primary p-6 text-white">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-white/15 text-3xl font-bold ring-1 ring-white/20">
                  {initials}
                </div>
                <div className="min-w-0">
                  <h2 className="truncate text-2xl font-bold">{user.fullName || "Tài xế"}</h2>
                  <p className="mt-1 truncate text-white/85">{user.email}</p>
                  <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm font-semibold ring-1 ring-white/20">
                    <span className="h-2 w-2 rounded-full bg-emerald-300" />
                    {user.status === "inactive" ? "Tạm ngưng" : "Đang hoạt động"}
                  </div>
                </div>
              </div>
              {!isEditing && (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-3 text-sm font-bold text-primary transition-opacity hover:opacity-90"
                >
                  <span className="material-symbols-outlined text-[20px]">edit</span>
                  Chỉnh sửa
                </button>
              )}
            </div>
          </div>

          <div className="p-5 lg:p-6">
            {isEditing ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <TextInput label="Họ và tên" name="fullName" value={formData.fullName} onChange={handleChange} />
                  <TextInput label="Tên đăng nhập" name="username" value={formData.username} onChange={handleChange} />
                  <TextInput label="Email" name="email" type="email" value={formData.email} onChange={handleChange} disabled />
                  <TextInput label="Số điện thoại" name="phone" value={formData.phone} onChange={handleChange} />
                  <TextInput label="Số CCCD/Passport" name="idNumber" value={formData.idNumber} onChange={handleChange} />
                  <TextInput label="Số bằng lái" name="licenseNumber" value={formData.licenseNumber} onChange={handleChange} />
                  <TextInput label="Biển số xe" name="vehicleNumber" value={formData.vehicleNumber} onChange={handleChange} />
                  <TextInput label="Loại xe" name="vehicleType" value={formData.vehicleType} onChange={handleChange} />
                </div>
                <TextInput label="Công ty" name="companyName" value={formData.companyName} onChange={handleChange} />

                <div className="flex flex-col-reverse gap-3 border-t border-outline-variant/20 pt-5 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setFormData(user);
                    }}
                    className="rounded-lg border border-outline-variant/50 px-5 py-3 text-sm font-bold text-on-surface transition-colors hover:bg-surface-container-low"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={loading}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Đang lưu...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[20px]">check</span>
                        Lưu thay đổi
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <ProfileField icon="badge" label="Tên đăng nhập" value={formData.username} />
                <ProfileField icon="call" label="Số điện thoại" value={formData.phone} />
                <ProfileField icon="credit_card" label="Số CCCD/Passport" value={formData.idNumber} />
                <ProfileField icon="license" label="Số bằng lái" value={formData.licenseNumber} />
                <ProfileField icon="directions_bus" label="Biển số xe" value={formData.vehicleNumber} />
                <ProfileField icon="airline_seat_recline_normal" label="Loại xe" value={formData.vehicleType} />
                <ProfileField icon="business" label="Công ty" value={formData.companyName} />
                <ProfileField icon="verified_user" label="Trạng thái" value={user.status === "inactive" ? "Tạm ngưng" : "Đang hoạt động"} />
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default DriverProfile;
