import React, { useCallback, useEffect, useMemo, useState } from "react";
import { getOperatorProfile, updateOperatorProfile } from "../../api/operator";
import { useToast } from "../../context/ToastContext";

const emptyProfile = {
  fullName: "",
  status: "active",
  staffProfileRole: "",
  staffCode: "",
  hireDate: "",
  department: "",
  position: ""
};

const statusOptions = [
{ value: "active", label: "Hoạt động" },
{ value: "inactive", label: "Tạm ngưng" }];


const getErrorMessage = (error, fallback) =>
error?.response?.data?.message || error?.response?.data?.error || error?.message || fallback;

const pickProfilePayload = (data) => {
  if (data?.user) return data.user;
  if (data?.data?.user) return data.data.user;
  if (data?.profile) return data.profile;
  if (data?.data && !Array.isArray(data.data)) return data.data;
  return data || {};
};

const hasProfileFields = (data) => {
  const profile = pickProfilePayload(data);
  return [
  "fullName",
  "status",
  "staffProfileRole",
  "staff_profile_role",
  "staffprofilerole",
  "staffCode",
  "hireDate",
  "hire_date",
  "department",
  "position"].
  some((key) => profile?.[key] !== undefined);
};

const toDateInputValue = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
  return date.toISOString().slice(0, 10);
};

const formatDate = (value) => {
  if (!value) return "Chưa cập nhật";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("vi-VN");
};

const normalizeOperatorProfile = (data = {}) => {
  const profile = pickProfilePayload(data);

  // Hide sensitive/internal fields for all operator roles (dispatcher, support, admin, etc.)
  const { companyId, company_id, accountStripeId, account_stripe_id, ...safeProfile } = profile;

  return {
    ...emptyProfile,
    ...safeProfile,
    staffProfileRole: profile.staffProfileRole || profile.staff_profile_role || profile.staffprofilerole || profile.staffRole || "",
    hireDate: profile.hireDate || profile.hire_date || ""
  };
};

const extractOperatorProfilePatch = (data = {}) => {
  const profile = pickProfilePayload(data);
  const patch = {};

  ["fullName", "status", "staffCode", "staffProfileRole"].forEach((key) => {
    if (profile[key] !== undefined) patch[key] = profile[key];
  });

  if (profile.hireDate !== undefined || profile.hire_date !== undefined) {
    patch.hireDate = profile.hireDate ?? profile.hire_date;
  }
  return patch;
};

const buildFormState = (profile) => ({
  fullName: profile.fullName || "",
  status: profile.status || "active",
  staffCode: profile.staffCode || "",
  hireDate: toDateInputValue(profile.hireDate),
  department: profile.department || "",
  position: profile.position || ""
});

const buildPayload = (formData, currentProfile = {}) => {
  const payload = {
    fullName: formData.fullName.trim(),
    status: formData.status || "active",
    staffCode: formData.staffCode.trim(),
    hireDate: formData.hireDate || "",
    department: formData.department?.trim() || "",
    position: formData.position?.trim() || ""
  };

  // Preserve identityNumber if it exists (never edited in this UI)
  if (currentProfile.identityNumber !== undefined) {
    payload.identityNumber = currentProfile.identityNumber || "";
  }

  return payload;
};

const getInitials = (name = "") => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "NV";
  return parts.slice(-2).map((part) => part[0]).join("").toUpperCase();
};

const getStatusLabel = (status) => {
  const matched = statusOptions.find((item) => item.value === status);
  return matched?.label || status || "Chưa cập nhật";
};

const getStatusClass = (status) =>
status === "active" ?
"bg-emerald-50 text-emerald-700 ring-emerald-100" :
"bg-slate-100 text-slate-700 ring-slate-200";

const normalizeRoleText = (value) => String(value || "").replace(/[\s-]+/g, "_").toLowerCase();

const getStaffProfileRoleLabel = (role) => {
  const labels = {
    company_admin: "Quản trị công ty",
    operator_admin: "Quản trị công ty",
    admin: "Quản trị công ty",
    dispatcher: "Điều hành viên",
    operator_dispatcher: "Điều hành viên",
    support: "Nhân viên hỗ trợ",
    company_support: "Nhân viên hỗ trợ",
    operator_support: "Nhân viên hỗ trợ"
  };

  return labels[normalizeRoleText(role)] || role || "Chưa cập nhật";
};

const getStoredStaffProfileRole = () => {
  try {
    const raw = localStorage.getItem("user");
    const user = raw ? JSON.parse(raw) : {};
    return (
      user.staffProfileRole ||
      user.staff_profile_role ||
      user.staffprofilerole ||
      user.staffProfile?.role ||
      user.staffProfile?.staffProfileRole ||
      user.staffProfile?.staffprofilerole ||
      user.staff_profile?.role ||
      user.staff_profile?.staff_profile_role ||
      user.staff_profile?.staffprofilerole ||
      "");

  } catch {
    return "";
  }
};

const syncStoredUser = (profile) => {
  try {
    const raw = localStorage.getItem("user");
    const currentUser = raw ? JSON.parse(raw) : {};
    const nextUser = {
      ...currentUser,
      fullName: profile.fullName || currentUser.fullName,
      status: profile.status || currentUser.status,
      staffProfileRole: profile.staffProfileRole || currentUser.staffProfileRole,
      companyId: profile.companyId ?? currentUser.companyId,
      staffCode: profile.staffCode ?? currentUser.staffCode,
      hireDate: profile.hireDate ?? currentUser.hireDate
    };
    delete nextUser.position;
    delete nextUser.department;
    delete nextUser.identityNumber;

    localStorage.setItem("user", JSON.stringify(nextUser));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("busgo:user-updated", { detail: nextUser }));
    }
  } catch {

  }
};

function InfoItem({ icon, label, value, compact = false }) {
  const displayValue = value === undefined || value === null || value === "" ? "Chưa cập nhật" : value;

  if (compact) {
    return (
      <div className="flex min-w-0 items-start gap-3 rounded-lg border border-outline-variant/30 bg-white p-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <span className="material-symbols-outlined text-[20px] leading-none">{icon}</span>
        </span>
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">{label}</p>
          <p className="mt-1 break-words text-sm font-extrabold text-on-surface">{displayValue}</p>
        </div>
      </div>);

  }

  return (
    <div className="flex min-w-0 items-start gap-3 rounded-lg border border-outline-variant/30 bg-surface-container-low/70 p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-primary shadow-sm">
        <span className="material-symbols-outlined text-[21px] leading-none">{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-xs font-extrabold uppercase tracking-wide text-on-surface-variant">{label}</p>
        <p className="mt-1 break-words text-base font-extrabold text-on-surface">{displayValue}</p>
      </div>
    </div>);

}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-on-surface">{label}</span>
      {children}
    </label>);

}

const inputClass =
"w-full rounded-lg border border-outline-variant/50 bg-white px-4 py-3 text-sm font-medium outline-none transition-all placeholder:text-outline focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:bg-surface-container-low disabled:text-on-surface-variant";

export default function OperatorProfileCard({ roleLabel = "Nhân viên", onProfileUpdated, compact = false }) {
  const { addToast } = useToast();
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await getOperatorProfile();
      const profileFromApi = normalizeOperatorProfile(response.data);
      const nextProfile = {
        ...profileFromApi,
        staffProfileRole: profileFromApi.staffProfileRole || getStoredStaffProfileRole()
      };
      setProfile(nextProfile);
      setFormData(buildFormState(nextProfile));
      syncStoredUser(nextProfile);
      onProfileUpdated?.(nextProfile);
    } catch (err) {
      setError(getErrorMessage(err, "Không thể tải hồ sơ nhân viên."));
    } finally {
      setLoading(false);
    }
  }, [onProfileUpdated]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const initials = useMemo(() => getInitials(profile?.fullName || formData.fullName), [profile, formData.fullName]);
  const effectiveStatusOptions = useMemo(() => {
    if (!formData.status || statusOptions.some((option) => option.value === formData.status)) {
      return statusOptions;
    }
    return [...statusOptions, { value: formData.status, label: formData.status }];
  }, [formData.status]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSave = async () => {
    if (!formData.fullName.trim()) {
      addToast("Họ và tên không được để trống", "error");
      return;
    }

    try {
      setSaving(true);
      const payload = buildPayload(formData, profile);
      const response = await updateOperatorProfile(payload);
      const responseProfile = hasProfileFields(response.data) ? extractOperatorProfilePatch(response.data) : {};
      const nextProfile = normalizeOperatorProfile({
        ...profile,
        ...payload,
        ...responseProfile
      });

      setProfile(nextProfile);
      setFormData(buildFormState(nextProfile));
      setIsEditing(false);
      syncStoredUser(nextProfile);
      onProfileUpdated?.(nextProfile);
      addToast("Cập nhật hồ sơ thành công", "success");
    } catch (err) {
      addToast(getErrorMessage(err, "Cập nhật hồ sơ thất bại"), "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <section className={`rounded-xl border border-outline-variant/30 bg-white text-center shadow-sm ${compact ? "p-6" : "p-10"}`}>
        <div className={`${compact ? "h-9 w-9" : "h-11 w-11"} mx-auto animate-spin rounded-full border-4 border-primary/20 border-t-primary`} />
        <p className="mt-4 text-sm font-medium text-on-surface-variant">Đang tải hồ sơ...</p>
      </section>);

  }

  if (error) {
    return (
      <section className="rounded-xl border border-red-200 bg-red-50 p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-bold text-red-700">{error}</p>
          <button
            type="button"
            onClick={fetchProfile}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-bold text-red-700 ring-1 ring-red-200 transition-colors hover:bg-red-100">
            
            <span className="material-symbols-outlined text-[19px]">refresh</span>
            Thử lại
          </button>
        </div>
      </section>);

  }

  return (
    <section className="overflow-hidden rounded-xl border border-outline-variant/30 bg-white shadow-sm">
      {compact ?
      <div className="border-b border-outline-variant/20 p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-xl font-extrabold text-primary ring-1 ring-primary/10">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-extrabold uppercase tracking-wide text-primary">{roleLabel}</p>
                <h2 className="mt-1 truncate text-xl font-extrabold text-on-surface">{profile?.fullName || "Nhân viên"}</h2>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${getStatusClass(profile?.status)}`}>
                    {getStatusLabel(profile?.status)}
                  </span>
                  <span className="inline-flex rounded-full bg-sky-50 px-2.5 py-1 text-xs font-bold text-sky-700 ring-1 ring-sky-100">
                    {getStaffProfileRoleLabel(profile?.staffProfileRole)}
                  </span>
                </div>
              </div>
            </div>
            {!isEditing &&
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary transition-colors hover:bg-primary hover:text-white"
            aria-label="Chỉnh sửa hồ sơ cá nhân"
            title="Chỉnh sửa hồ sơ cá nhân">
            
                <span className="material-symbols-outlined text-[20px]">edit</span>
              </button>
          }
          </div>
        </div> :

      <div className="border-b border-outline-variant/20 bg-white p-5 lg:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-2xl font-extrabold text-primary ring-1 ring-primary/10">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-extrabold uppercase tracking-wide text-primary">{roleLabel}</p>
                <h2 className="mt-1 truncate text-2xl font-extrabold text-on-surface">{profile?.fullName || "Nhân viên"}</h2>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ring-1 ${getStatusClass(profile?.status)}`}>
                    {getStatusLabel(profile?.status)}
                  </span>
                  <span className="inline-flex items-center rounded-full bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700 ring-1 ring-sky-100">
                    {getStaffProfileRoleLabel(profile?.staffProfileRole)}
                  </span>
                </div>
              </div>
            </div>
            {!isEditing &&
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-bold text-white transition-colors hover:bg-primary/90">
            
                <span className="material-symbols-outlined text-[20px]">edit</span>
                Chỉnh sửa
              </button>
          }
          </div>
        </div>
      }

      <div className={compact ? "p-5" : "p-5 lg:p-6"}>
        {isEditing ?
        <div className="space-y-5">
            <div className={`grid grid-cols-1 gap-4 ${compact ? "" : "md:grid-cols-2"}`}>
              <Field label="Họ và tên">
                <input
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className={inputClass}
                placeholder="Nguyễn Văn A" />
              
              </Field>
              <Field label="Trạng thái">
                <select name="status" value={formData.status} onChange={handleChange} className={inputClass}>
                  {effectiveStatusOptions.map((option) =>
                <option key={option.value} value={option.value}>{option.label}</option>
                )}
                </select>
              </Field>
              <Field label="Mã nhân viên">
                <input name="staffCode" value={formData.staffCode} onChange={handleChange} className={inputClass} />
              </Field>
              <Field label="Ngày vào làm">
                <input type="date" name="hireDate" value={formData.hireDate} onChange={handleChange} className={inputClass} />
              </Field>
              <Field label="Bộ phận">
                <input
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="Phòng điều hành" />
              </Field>
              <Field label="Vị trí">
                <input
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="Điều hành viên ca sáng" />
              </Field>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-outline-variant/20 pt-5 sm:flex-row sm:justify-end">
              <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                setFormData(buildFormState(profile));
              }}
              disabled={saving}
              className="rounded-lg border border-outline-variant/50 px-5 py-3 text-sm font-bold text-on-surface transition-colors hover:bg-surface-container-low disabled:cursor-not-allowed disabled:opacity-60">
              
                Hủy
              </button>
              <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60">
              
                {saving ?
              <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Đang lưu...
                  </> :

              <>
                    <span className="material-symbols-outlined text-[20px]">save</span>
                    Lưu thay đổi
                  </>
              }
              </button>
            </div>
          </div> :

        <div className="space-y-5">
            {!compact &&
          <div className="flex flex-wrap gap-2">
              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1 ${getStatusClass(profile?.status)}`}>
                {getStatusLabel(profile?.status)}
              </span>
              {profile?.staffCode ?
            <span className="inline-flex rounded-full bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700 ring-1 ring-sky-100">
                  {profile.staffCode}
                </span> :
            null}
              </div>
          }

            <div className={`grid grid-cols-1 gap-3 ${compact ? "" : "md:grid-cols-2 xl:grid-cols-3 md:gap-4"}`}>
              <InfoItem compact={compact} icon="admin_panel_settings" label="Vai trò" value={getStaffProfileRoleLabel(profile?.staffProfileRole)} />
              <InfoItem compact={compact} icon="badge" label="Mã nhân viên" value={profile?.staffCode} />
              <InfoItem compact={compact} icon="event" label="Ngày vào làm" value={formatDate(profile?.hireDate)} />
              <InfoItem compact={compact} icon="business_center" label="Bộ phận" value={profile?.department || "—"} />
              <InfoItem compact={compact} icon="work" label="Vị trí" value={profile?.position || "—"} />
            </div>
          </div>
        }
      </div>
    </section>);

}