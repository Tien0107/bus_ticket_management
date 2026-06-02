import React, { useEffect, useState } from "react";
import { useToast } from "../../context/ToastContext";
import axiosClient from "../../api/axiosClient";

const ProfileField = ({ label, value, icon }) =>
<div className="rounded-lg border border-outline-variant/30 bg-white p-4">
    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
      <span className="material-symbols-outlined text-[22px] leading-none">{icon}</span>
    </div>
    <p className="text-sm font-medium text-on-surface-variant">{label}</p>
    <p className="mt-1 break-words font-semibold text-on-surface">{value || "Chưa cập nhật"}</p>
  </div>;


const TextInput = ({ label, name, value, onChange, type = "text", disabled = false }) =>
<label className="block">
    <span className="text-sm font-semibold text-on-surface">{label}</span>
    <input
    type={type}
    name={name}
    value={value || ""}
    onChange={onChange}
    disabled={disabled}
    className="mt-2 w-full rounded-lg border border-outline-variant/40 bg-white px-4 py-3 text-sm outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:bg-surface-container-low disabled:text-on-surface-variant" />
  
  </label>;


const getFirstValue = (...values) =>
values.find((value) => value !== undefined && value !== null && value !== "");

const getCompanyId = (data = {}) =>
getFirstValue(
  data.companyId,
  data.company_id,
  data.driverCompanyId,
  data.driver_company_id,
  data.operatorCompanyId,
  data.operator_company_id,
  data.company?.id,
  data.company?._id,
  data.driverProfile?.companyId,
  data.driverProfile?.company_id,
  data.driverProfile?.driverCompanyId,
  data.driverProfile?.driver_company_id,
  data.driverProfile?.company?.id,
  data.driver_profile?.companyId,
  data.driver_profile?.company_id,
  data.driver_profile?.driverCompanyId,
  data.driver_profile?.driver_company_id,
  data.driver_profile?.company?.id
);

const getCompanyName = (data = {}) =>
getFirstValue(
  data.companyName,
  data.company_name,
  data.company?.name,
  data.company?.company_name,
  data.driverProfile?.companyName,
  data.driverProfile?.company_name,
  data.driverProfile?.company?.name,
  data.driverProfile?.company?.company_name,
  data.driver_profile?.companyName,
  data.driver_profile?.company_name,
  data.driver_profile?.company?.name,
  data.driver_profile?.company?.company_name
);

const getDisplayName = (data = {}) => getFirstValue(data.fullName, data.username, data.email, data.phone);

const normalizeDriverProfile = (data = {}) => {
  const companyId = getCompanyId(data);
  const companyName = getCompanyName(data);

  return {
    ...data,
    companyId,
    companyName: companyName || (companyId ? `Công ty #${companyId}` : "")
  };
};

const normalizeUsersResponse = (data) => {
  if (Array.isArray(data?.users)) return data.users;
  if (Array.isArray(data?.data?.users)) return data.data.users;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data)) return data;
  return [];
};

const matchesCurrentDriver = (candidate = {}, current = {}) =>
String(candidate.id || "") === String(current.id || "") ||
candidate.phone && current.phone && String(candidate.phone) === String(current.phone) ||
candidate.email && current.email && String(candidate.email).toLowerCase() === String(current.email).toLowerCase();

const DriverProfile = () => {
  const { addToast } = useToast();

  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingCompany, setLoadingCompany] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        const userData = normalizeDriverProfile(JSON.parse(stored));
        setUser(userData);
        setFormData(userData);
      } catch {
        localStorage.removeItem("user");
      }
    }
  }, []);

  useEffect(() => {
    const companyId = getCompanyId(formData);
    const companyName = getCompanyName(formData);
    const hasResolvedCompanyName = companyName && !String(companyName).startsWith("Công ty #");

    if (hasResolvedCompanyName) return;

    const updateStoredProfile = (nextProfile) => {
      setFormData(nextProfile);
      setUser(nextProfile);
      localStorage.setItem("user", JSON.stringify(nextProfile));
    };

    const resolveCompanyName = async (targetCompanyId, baseProfile) => {
      if (!targetCompanyId) return false;

      try {
        const response = await axiosClient.get("/public/company", { params: { limit: 100 } });
        const companies = Array.isArray(response.data?.companies) ?
        response.data.companies :
        Array.isArray(response.data) ?
        response.data :
        [];
        const matchedCompany = companies.find((company) => String(company.id) === String(targetCompanyId));

        if (!matchedCompany?.name) return false;

        updateStoredProfile({ ...baseProfile, companyId: targetCompanyId, companyName: matchedCompany.name });
        return true;
      } catch {
        return false;
      }
    };

    const resolveCurrentDriverProfile = async () => {
      const queries = [
      formData.phone ? { role: "driver", phone: formData.phone, limit: 10 } : null,
      formData.email ? { role: "driver", email: formData.email, limit: 10 } : null].
      filter(Boolean);

      for (const params of queries) {
        try {
          const response = await axiosClient.get("/auth/user", { params });
          const driver = normalizeUsersResponse(response.data).find((item) => matchesCurrentDriver(item, formData));
          const normalizedDriver = normalizeDriverProfile({ ...formData, ...driver });

          if (getCompanyName(normalizedDriver) && !String(getCompanyName(normalizedDriver)).startsWith("Công ty #")) {
            updateStoredProfile(normalizedDriver);
            return true;
          }

          const resolvedCompanyId = getCompanyId(normalizedDriver);
          if (resolvedCompanyId) {
            updateStoredProfile(normalizedDriver);
            return resolveCompanyName(resolvedCompanyId, normalizedDriver);
          }
        } catch {

        }
      }

      return false;
    };

    const resolveCompany = async () => {
      try {
        setLoadingCompany(true);

        if (companyId) {
          await resolveCompanyName(companyId, formData);
          return;
        }

        await resolveCurrentDriverProfile();
      } finally {
        setLoadingCompany(false);
      }
    };

    resolveCompany();
  }, [formData]);

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

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface p-4">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
          <p className="mt-4 text-on-surface-variant">Đang tải hồ sơ...</p>
        </div>
      </div>);

  }

  const initials = (user.fullName || "TX").
  split(" ").
  filter(Boolean).
  slice(-2).
  map((part) => part[0]).
  join("").
  toUpperCase();

  return (
    <div className="min-h-screen bg-surface px-4 py-4 lg:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">Hồ sơ tài xế</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-on-surface lg:text-3xl">
              Thông tin cá nhân
            </h1>
            <p className="mt-1 text-sm text-on-surface-variant">Quản lý thông tin liên hệ và trạng thái tài khoản tài xế.</p>
          </div>
        </div>

        <section className="overflow-hidden rounded-xl border border-outline-variant/30 bg-white shadow-sm">
          <div className="bg-primary p-4 text-white">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white/15 text-xl font-bold ring-1 ring-white/20">
                  {initials}
                </div>
                <div className="min-w-0">
                  <h2 className="truncate text-xl font-bold">{user.fullName || "Tài xế"}</h2>
                  <p className="mt-0.5 truncate text-sm text-white/85">{user.email}</p>
                  <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-semibold ring-1 ring-white/20">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                    {user.status === "inactive" ? "Tạm ngưng" : "Đang hoạt động"}
                  </div>
                </div>
              </div>
              {!isEditing &&
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-3 py-1.5 text-sm font-bold text-primary transition-opacity hover:opacity-90">
                
                  <span className="material-symbols-outlined text-[18px]">edit</span>
                  Chỉnh sửa
                </button>
              }
            </div>
          </div>

          <div className="p-4">
            {isEditing ?
            <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <TextInput label="Họ và tên" name="fullName" value={formData.fullName} onChange={handleChange} />
                  <TextInput label="Tên đăng nhập" name="loginName" value={getDisplayName(formData)} onChange={handleChange} disabled />
                  <TextInput label="Email" name="email" type="email" value={formData.email} onChange={handleChange} disabled />
                  <TextInput label="Số điện thoại" name="phone" value={formData.phone} onChange={handleChange} />
                </div>
                <TextInput
                label="Công ty"
                name="companyName"
                value={loadingCompany ? "Đang tải công ty..." : formData.companyName}
                onChange={handleChange}
                disabled />
              

                <div className="flex flex-col-reverse gap-3 border-t border-outline-variant/20 pt-5 sm:flex-row sm:justify-end">
                  <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setFormData(user);
                  }}
                  className="rounded-lg border border-outline-variant/50 px-5 py-3 text-sm font-bold text-on-surface transition-colors hover:bg-surface-container-low">
                  
                    Hủy
                  </button>
                  <button
                  type="button"
                  onClick={handleSave}
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60">
                  
                    {loading ?
                  <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Đang lưu...
                      </> :

                  <>
                        <span className="material-symbols-outlined text-[20px]">check</span>
                        Lưu thay đổi
                      </>
                  }
                  </button>
                </div>
              </div> :

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <ProfileField icon="badge" label="Tên đăng nhập" value={getDisplayName(formData)} />
                <ProfileField icon="call" label="Số điện thoại" value={formData.phone} />
                <ProfileField
                icon="business"
                label="Công ty"
                value={loadingCompany ? "Đang tải công ty..." : formData.companyName} />
              
                <ProfileField icon="verified_user" label="Trạng thái" value={user.status === "inactive" ? "Tạm ngưng" : "Đang hoạt động"} />
              </div>
            }
          </div>
        </section>
      </div>
    </div>);

};

export default DriverProfile;