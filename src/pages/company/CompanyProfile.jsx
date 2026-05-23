import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  IconButton,
  LoadingState,
  PrimaryButton,
  SecondaryButton,
  StatusBadge,
  inputClass,
} from "./CompanyUI";

const emptyCompanyForm = {
  name: "",
  hotline: "",
  logoUrl: "",
  address: "",
  latitude: "",
  longitude: "",
};

const InfoItem = ({ label, value }) => (
  <div className="rounded-lg bg-surface-container-low p-4">
    <p className="text-sm font-medium text-on-surface-variant">{label}</p>
    <p className="mt-1 break-words font-bold text-on-surface">{value || "—"}</p>
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
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState(emptyCompanyForm);
  const [currentUser, setCurrentUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const stored = localStorage.getItem("user");
      setCurrentUser(stored ? JSON.parse(stored) : null);

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

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    addToast("Đã đăng xuất", "success");
    navigate("/login");
  };

  if (loading) {
    return (
      <CompanyPageShell title="Hồ sơ công ty" description="Đang tải thông tin công ty.">
        <LoadingState />
      </CompanyPageShell>
    );
  }

  if (!profile) {
    return (
      <CompanyPageShell title="Hồ sơ công ty" description="Quản lý thông tin công ty.">
        <EmptyState icon="warning" title="Không thể tải hồ sơ công ty" description="Vui lòng thử lại sau." />
      </CompanyPageShell>
    );
  }

  const logoPreviewUrl = isEditing ? formData.logoUrl : profile.logoUrl;

  return (
    <CompanyPageShell
      eyebrow="Profile"
      title="Hồ sơ công ty"
      description="Cập nhật tên, hotline, logo và địa chỉ theo đúng dữ liệu backend đang hỗ trợ."
      actions={
        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 transition-colors hover:bg-red-100"
        >
          <span className="material-symbols-outlined text-[20px]">logout</span>
          Đăng xuất
        </button>
      }
      maxWidth="max-w-6xl"
    >
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-xl border border-outline-variant/30 bg-white shadow-sm">
          <div className="border-b border-outline-variant/20 p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                {logoPreviewUrl ? (
                  <img
                    src={logoPreviewUrl}
                    alt={profile.name || "Logo công ty"}
                    className="h-14 w-14 rounded-xl border border-outline-variant/30 object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <span className="material-symbols-outlined text-[30px]">domain</span>
                  </div>
                )}
                <div>
                  <h2 className="text-xl font-extrabold text-on-surface">{profile.name || "Công ty"}</h2>
                  <p className="mt-1 text-sm text-on-surface-variant">
                    ID công ty: <span className="font-bold">{profile.id || "—"}</span>
                  </p>
                </div>
              </div>
              {!isEditing && <IconButton icon="edit" label="Chỉnh sửa công ty" variant="primary" onClick={() => setIsEditing(true)} />}
            </div>
          </div>

          <div className="p-5">
            {isEditing ? (
              <div className="space-y-4">
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
                <Field label="Logo công ty">
                  <div className="rounded-xl border border-outline-variant/40 bg-white p-4">
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
                        {formData.logoUrl && (
                          <p className="mt-3 truncate text-xs font-medium text-on-surface-variant">
                            {formData.logoUrl}
                          </p>
                        )}
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
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <InfoItem label="Tên công ty" value={profile.name} />
                <InfoItem label="Hotline" value={profile.hotline} />
                <InfoItem label="Logo URL" value={profile.logoUrl} />
                <InfoItem label="Địa chỉ" value={profile.address} />
                <InfoItem label="Vĩ độ" value={profile.latitude} />
                <InfoItem label="Kinh độ" value={profile.longitude} />
              </div>
            )}
          </div>
        </section>

        <aside className="rounded-xl border border-outline-variant/30 bg-white shadow-sm">
          <div className="border-b border-outline-variant/20 p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                <span className="material-symbols-outlined text-[30px]">person</span>
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-xl font-extrabold text-on-surface">
                  {currentUser?.fullName || "Người quản trị"}
                </h2>
                <p className="mt-1 text-sm text-on-surface-variant">Thông tin đăng nhập hiện tại</p>
              </div>
            </div>
          </div>

          <div className="space-y-4 p-5">
            <InfoItem label="Email" value={currentUser?.email} />
            <InfoItem label="Số điện thoại" value={currentUser?.phone} />
            <InfoItem label="Vai trò" value={currentUser?.staffProfileRole || currentUser?.role} />
            <div className="rounded-lg bg-surface-container-low p-4">
              <p className="text-sm font-medium text-on-surface-variant">Trạng thái</p>
              <div className="mt-2">
                <StatusBadge tone={currentUser?.status === "active" ? "emerald" : "slate"}>
                  {currentUser?.status === "active" ? "Hoạt động" : currentUser?.status || "—"}
                </StatusBadge>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </CompanyPageShell>
  );
}
