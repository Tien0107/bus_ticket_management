import React, { useCallback, useEffect, useState } from "react";
import {
  getAdminCompanyUploadPresigned,
  getCompanyInfo,
  updateCompanyInfo,
  uploadAdminCompanyFile,
} from "../../api/company";
import { useToast } from "../../context/ToastContext";
import {
  CompanyPageShell,
  EmptyState,
  Field,
  LoadingState,
  PrimaryButton,
  SecondaryButton,
  inputClass,
} from "./CompanyUI";
import OperatorProfileCard from "../../components/profile/OperatorProfileCard";

const emptyCompanyForm = {
  name: "",
  hotline: "",
  logoUrl: "",
  address: "",
  latitude: "",
  longitude: "",
};

const displayValue = (value) => (value === undefined || value === null || value === "" ? "—" : value);

const CompanyInfoRow = ({ icon, label, value, wide = false }) => (
  <div className={`flex min-w-0 items-start gap-3 px-5 py-4 ${wide ? "lg:col-span-2" : ""}`}>
    <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
      <span className="material-symbols-outlined text-[21px] leading-none">{icon}</span>
    </span>
    <div className="min-w-0">
      <p className="text-xs font-extrabold uppercase tracking-wide text-on-surface-variant">{label}</p>
      <p className="mt-1 break-words text-base font-extrabold text-on-surface">{displayValue(value)}</p>
    </div>
  </div>
);

const normalizeCompany = (company = {}) => ({
  name: company.name || "",
  hotline: company.hotline || "",
  logoUrl: company.logoUrl || "",
  address: company.address || "",
  latitude: company.latitude ?? "",
  longitude: company.longitude ?? "",
  id: company.id,
});

const buildCompanyPayload = (formData) => {
  const payload = {
    name: formData.name?.trim() || "",
    hotline: formData.hotline?.trim() || "",
    logoUrl: formData.logoUrl?.trim() || "",
    address: formData.address?.trim() || "",
  };

  if (formData.latitude !== "" && formData.latitude !== null && formData.latitude !== undefined) {
    payload.latitude = Number(formData.latitude);
  }

  if (formData.longitude !== "" && formData.longitude !== null && formData.longitude !== undefined) {
    payload.longitude = Number(formData.longitude);
  }

  return payload;
};

const isAcceptedFileType = (file, acceptedMimeTypes = []) => {
  if (!acceptedMimeTypes.length) return true;

  return acceptedMimeTypes.some((mimeType) => {
    if (mimeType.endsWith("/*")) {
      return file.type.startsWith(mimeType.replace("/*", "/"));
    }

    return file.type === mimeType;
  });
};

export default function CompanyProfile() {
  const { addToast } = useToast();

  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState(emptyCompanyForm);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getCompanyInfo();
      const companyData = normalizeCompany(response.data?.company || response.data);
      setProfile(companyData);
      setFormData(companyData);
    } catch {
      addToast("Không thể tải hồ sơ công ty", "error");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleLogoUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    try {
      setUploadingLogo(true);

      const presignedResponse = await getAdminCompanyUploadPresigned();
      const uploadConfig = presignedResponse.data || {};
      const acceptedMimeTypes = uploadConfig.acceptedMimeTypes || [];

      if (!isAcceptedFileType(file, acceptedMimeTypes)) {
        addToast(
          `Định dạng ảnh không hợp lệ. Chỉ hỗ trợ ${uploadConfig.allowedFormats || acceptedMimeTypes.join(", ")}.`,
          "error"
        );
        return;
      }

      const uploadResult = await uploadAdminCompanyFile(file, uploadConfig);
      const uploadedUrl = uploadResult.secure_url || uploadResult.url;

      if (!uploadedUrl) {
        throw new Error("Upload thành công nhưng không nhận được URL ảnh.");
      }

      setFormData((current) => ({ ...current, logoUrl: uploadedUrl }));
      addToast("Upload logo thành công. Bấm lưu để cập nhật hồ sơ.", "success");
    } catch (err) {
      addToast(err.message || "Upload logo thất bại", "error");
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name?.trim()) {
      addToast("Tên công ty không được để trống", "error");
      return;
    }

    try {
      setSaving(true);
      const payload = buildCompanyPayload(formData);
      const response = await updateCompanyInfo(payload);
      const updatedCompany = normalizeCompany(response.data?.company || { ...profile, ...payload });

      setProfile(updatedCompany);
      setFormData(updatedCompany);
      setIsEditing(false);
      addToast("Cập nhật hồ sơ công ty thành công", "success");
    } catch (err) {
      addToast(err.response?.data?.message || "Cập nhật hồ sơ công ty thất bại", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <CompanyPageShell title="Hồ sơ" description="Đang tải thông tin công ty.">
        <LoadingState />
      </CompanyPageShell>
    );
  }

  if (!profile) {
    return (
      <CompanyPageShell title="Hồ sơ" description="Quản lý thông tin công ty và hồ sơ cá nhân.">
        <EmptyState icon="warning" title="Không thể tải hồ sơ công ty" description="Vui lòng thử lại sau." />
      </CompanyPageShell>
    );
  }

  const logoPreviewUrl = isEditing ? formData.logoUrl : profile.logoUrl;

  return (
    <CompanyPageShell
      eyebrow="Profile"
      title="Hồ sơ"
      description="Quản lý hồ sơ công ty và hồ sơ cá nhân của tài khoản quản trị."
      maxWidth="max-w-7xl"
    >
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)] xl:items-start">
        <section className="overflow-hidden rounded-xl border border-outline-variant/30 bg-white shadow-sm">
          <div className="p-5">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 items-center gap-4">
                {logoPreviewUrl ? (
                  <img
                    src={logoPreviewUrl}
                    alt={profile.name || "Logo công ty"}
                    className="h-16 w-16 rounded-xl border border-outline-variant/30 object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <span className="material-symbols-outlined text-[30px]">domain</span>
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-xs font-extrabold uppercase tracking-wide text-primary">Hồ sơ công ty</p>
                  <h2 className="mt-1 truncate text-2xl font-extrabold text-on-surface">{profile.name || "Công ty"}</h2>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="inline-flex rounded-full bg-surface-container-low px-3 py-1 text-xs font-bold text-on-surface-variant ring-1 ring-outline-variant/30">
                      ID công ty #{profile.id || "N/A"}
                    </span>
                    {profile.hotline ? (
                      <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-100">
                        {profile.hotline}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
              {!isEditing && (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-bold text-white transition-colors hover:bg-primary/90"
                >
                  <span className="material-symbols-outlined text-[20px]">edit</span>
                  Chỉnh sửa
                </button>
              )}
            </div>
          </div>

          <div className="border-t border-outline-variant/20">
            {isEditing ? (
              <div className="space-y-5 p-5">
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <Field label="Tên công ty">
                    <input
                      type="text"
                      name="name"
                      value={formData.name || ""}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="Tên nhà xe"
                    />
                  </Field>
                  <Field label="Hotline">
                    <input
                      type="tel"
                      name="hotline"
                      value={formData.hotline || ""}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="0901234567"
                    />
                  </Field>
                </div>
                <Field label="Logo công ty">
                  <div className="rounded-lg border border-outline-variant/40 bg-surface-container-low/40 p-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                      {formData.logoUrl ? (
                        <img
                          src={formData.logoUrl}
                          alt={formData.name || "Logo công ty"}
                          className="h-20 w-20 rounded-xl border border-outline-variant/30 object-cover"
                        />
                      ) : (
                        <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <span className="material-symbols-outlined text-[34px]">image</span>
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap gap-3">
                          <label className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-outline-variant/60 bg-white px-4 py-3 text-sm font-bold text-on-surface transition-colors hover:bg-surface-container-low ${uploadingLogo ? "pointer-events-none opacity-60" : ""}`}>
                            <span className="material-symbols-outlined text-[20px]">
                              {uploadingLogo ? "sync" : "upload"}
                            </span>
                            {uploadingLogo ? "Đang upload..." : "Chọn ảnh"}
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleLogoUpload}
                              disabled={uploadingLogo || saving}
                            />
                          </label>
                          {formData.logoUrl && (
                            <SecondaryButton
                              icon="delete"
                              onClick={() => setFormData((current) => ({ ...current, logoUrl: "" }))}
                              disabled={uploadingLogo || saving}
                            >
                              Xóa ảnh
                            </SecondaryButton>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Field>
                <Field label="Địa chỉ">
                  <input
                    type="text"
                    name="address"
                    value={formData.address || ""}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Địa chỉ công ty"
                  />
                </Field>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Vĩ độ">
                    <input
                      type="number"
                      name="latitude"
                      value={formData.latitude}
                      onChange={handleChange}
                      className={inputClass}
                      min="-90"
                      max="90"
                      step="0.000001"
                    />
                  </Field>
                  <Field label="Kinh độ">
                    <input
                      type="number"
                      name="longitude"
                      value={formData.longitude}
                      onChange={handleChange}
                      className={inputClass}
                      min="-180"
                      max="180"
                      step="0.000001"
                    />
                  </Field>
                </div>
                <div className="flex flex-col-reverse gap-3 border-t border-outline-variant/20 pt-5 sm:flex-row sm:justify-end">
                  <SecondaryButton
                    onClick={() => {
                      setIsEditing(false);
                      setFormData(profile);
                    }}
                    disabled={saving}
                  >
                    Hủy
                  </SecondaryButton>
                  <PrimaryButton icon="save" onClick={handleSave} disabled={saving}>
                    {saving ? "Đang lưu..." : "Lưu thay đổi"}
                  </PrimaryButton>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 divide-y divide-outline-variant/20 lg:grid-cols-2 lg:divide-x lg:divide-y-0">
                <div className="divide-y divide-outline-variant/20">
                  <CompanyInfoRow icon="domain" label="Tên công ty" value={profile.name} />
                  <CompanyInfoRow icon="call" label="Hotline" value={profile.hotline} />
                  <CompanyInfoRow icon="location_on" label="Địa chỉ" value={profile.address} />
                </div>
                <div className="divide-y divide-outline-variant/20">
                  <CompanyInfoRow icon="explore" label="Vĩ độ" value={profile.latitude} />
                  <CompanyInfoRow icon="near_me" label="Kinh độ" value={profile.longitude} />
                  <CompanyInfoRow icon="tag" label="ID công ty" value={profile.id} />
                </div>
              </div>
            )}
          </div>
        </section>

        <aside className="xl:sticky xl:top-6">
          <OperatorProfileCard roleLabel="Quản trị công ty" compact />
        </aside>
      </div>
    </CompanyPageShell>
  );
}
