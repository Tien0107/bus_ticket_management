import React, { useState, useEffect } from "react";
import { sendOtp, contactCheck } from "../../api/auth";
import axiosClient from "../../api/axiosClient";
import { updateCustomerContact, updateCustomerProfile, verifyContactIdentity } from "../../api/customer";
import { useToast } from "../../context/ToastContext";
import ProfileStatusBadge from "./ProfileStatusBadge";
import { getStoredUser, setStoredToken, setStoredUser } from "../../utils/authStorage";
import OtpInput from "../common/OtpInput";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^(?:\+84|0)\d{9}$/;
const OTP_REGEX = /^\d{4,8}$/;

const FIELD_LABELS = {
  email: "Email",
  phone: "Số điện thoại"
};

const CONTACT_UPDATE_COOLDOWN_MS = 12 * 60 * 60 * 1000;

const LAST_CHANGE_KEYS = {
  email: ["lastChangeEmail", "last_change_email"],
  phone: ["lastChangePhone", "last_change_phone"],
  generic: ["lastChangeContact", "lastchangeContact", "last_change_contact"]
};

const getCachedUser = () => {
  const parsed = getStoredUser(null);
  return parsed && typeof parsed === "object" ? parsed : null;
};

const getLastChangeTimestamp = (user, field) => {
  const cachedUser = getCachedUser();
  const source = { ...(user || {}), ...(cachedUser || {}) };
  if (!source || Object.keys(source).length === 0) return null;
  // Prioritize field-specific (lastChangeEmail / lastChangePhone) so the two are independent.
  // Fall back to generic lastChangeContact for backward compat with older data.
  const keys = [...(LAST_CHANGE_KEYS[field] || []), ...LAST_CHANGE_KEYS.generic];
  for (const key of keys) {
    const raw = source[key];
    if (raw === undefined || raw === null || raw === "") continue;
    const ts =
    typeof raw === "number" ?
    raw > 1e12 ?
    raw :
    raw * 1000 :
    new Date(raw).getTime();
    if (!Number.isNaN(ts) && ts > 0) return ts;
  }
  return null;
};

const getCooldownInfo = (user, field) => {
  const lastTs = getLastChangeTimestamp(user, field);
  if (!lastTs) return { blocked: false };
  const nextAllowedMs = lastTs + CONTACT_UPDATE_COOLDOWN_MS;
  const now = Date.now();
  if (now >= nextAllowedMs) return { blocked: false };
  const remainingMs = nextAllowedMs - now;
  const totalMinutes = Math.ceil(remainingMs / (60 * 1000));
  const remainingHours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;
  return { blocked: true, remainingHours, remainingMinutes };
};

const formatCooldownMessage = (field, info) => {
  const action = field === "email" ? "cập nhật email" :
                 field === "phone" ? "cập nhật số điện thoại" :
                 "cập nhật thông tin liên hệ";
  if (!info.remainingHours) {
    return `Bạn vừa ${action}. Vui lòng thử lại sau ${info.remainingMinutes} phút.`;
  }
  if (!info.remainingMinutes) {
    return `Bạn vừa ${action}. Vui lòng thử lại sau ${info.remainingHours} giờ.`;
  }
  return `Bạn vừa ${action}. Vui lòng thử lại sau ${info.remainingHours} giờ ${info.remainingMinutes} phút.`;
};

const hasContactValue = (value) => Boolean(String(value || "").trim());

export default function ProfileInfoCard({ user, onProfileUpdated }) {
  const { addToast } = useToast();
  const [modalState, setModalState] = useState({
    isOpen: false,
    field: "",
    oldOtp: "",
    oldVerified: false,
    newValue: "",
    newValueChecked: false,
    checkingNewValue: false,
    newOtp: "",
    newOtpSent: false,
    error: "",
    sendingOldOtp: false,
    verifyingOldOtp: false,
    sendingOtp: false,
    submitting: false
  });

  const [isEditingName, setIsEditingName] = useState(false);
  const [editingFullName, setEditingFullName] = useState("");
  const [savingName, setSavingName] = useState(false);

  const currentValueByField = {
    email: user?.email || "",
    phone: user?.phone || ""
  };

  useEffect(() => {
    if (!isEditingName && user?.fullName) {
      setEditingFullName(user.fullName);
    }
  }, [user?.fullName, isEditingName]);

  const getApiError = (error, fallback) => {
    return error?.response?.data?.message || fallback;
  };

  const validateNewValue = (field, value) => {
    if (!value.trim()) {
      return `${FIELD_LABELS[field]} mới không được để trống.`;
    }
    if (field === "email" && !EMAIL_REGEX.test(value.trim())) {
      return "Email mới không đúng định dạng.";
    }
    if (field === "phone" && !PHONE_REGEX.test(value.trim())) {
      return "Số điện thoại mới không hợp lệ.";
    }
    return "";
  };

  const validateCurrentValue = (field, value) => {
    const trimmed = String(value || "").trim();
    if (!trimmed) {
      return "";
    }
    if (field === "email" && !EMAIL_REGEX.test(trimmed)) {
      return "Email hiện tại không đúng định dạng.";
    }
    if (field === "phone" && !PHONE_REGEX.test(trimmed)) {
      return "Số điện thoại hiện tại không hợp lệ.";
    }
    return "";
  };

  const validateOtp = (otp, label = "OTP") => {
    const trimmed = (otp || "").trim();
    if (!trimmed) return `${label} không được để trống.`;
    if (!OTP_REGEX.test(trimmed)) return `${label} phải là 4-8 chữ số.`;
    return "";
  };

  const closeModal = () => {
    setModalState({
      isOpen: false,
      field: "",
      oldOtp: "",
      oldVerified: false,
      newValue: "",
      newValueChecked: false,
      checkingNewValue: false,
      newOtp: "",
      newOtpSent: false,
      error: "",
      sendingOldOtp: false,
      verifyingOldOtp: false,
      sendingOtp: false,
      submitting: false
    });
  };

  const handleStartNameEdit = () => {
    setEditingFullName(user?.fullName || "");
    setIsEditingName(true);
  };

  const handleCancelNameEdit = () => {
    setIsEditingName(false);
    setEditingFullName(user?.fullName || "");
  };

  const handleSaveName = async () => {
    const trimmed = (editingFullName || "").trim();
    if (!trimmed) {
      addToast("Họ và tên không được để trống.", "error");
      return;
    }
    const currentName = (user?.fullName || "").trim();
    if (trimmed === currentName) {
      setIsEditingName(false);
      return;
    }

    try {
      setSavingName(true);
      const res = await updateCustomerProfile({ fullName: trimmed });
      const nextToken = res?.data?.token;
      let updatedUser = res?.data?.user;
      if (!updatedUser) {
        updatedUser = res?.data && typeof res.data === "object" && !Array.isArray(res.data)
          ? res.data
          : { ...user, fullName: trimmed };
      }

      if (nextToken) {
        setStoredToken(nextToken);
        axiosClient.defaults.headers.common.Authorization = `Bearer ${nextToken}`;
      }

      try {
        const currentStored = getStoredUser() || {};
        const nextUser = { ...currentStored, ...updatedUser, fullName: trimmed };
        setStoredUser(nextUser);
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("busgo:user-updated", { detail: nextUser }));
        }
      } catch {}

      addToast("Cập nhật họ và tên thành công.", "success");
      setIsEditingName(false);
      if (onProfileUpdated) {
        await onProfileUpdated(updatedUser);
      }
    } catch (error) {
      const msg = getApiError(error, "Cập nhật họ và tên thất bại.");
      addToast(msg, "error");
    } finally {
      setSavingName(false);
    }
  };

  const handleStartVerify = async (field) => {
    const value = String(currentValueByField[field] || "").trim();
    const isCurrentContactMissing = !hasContactValue(value);
    if (!isCurrentContactMissing) {
      const currentValueError = validateCurrentValue(field, value);
      if (currentValueError) {
        addToast(currentValueError, "error");
        return;
      }
    }

    const cooldown = getCooldownInfo(user, field);
    if (cooldown.blocked) {
      const message = formatCooldownMessage(field, cooldown);
      addToast(message, "error");
      return;
    }

    const initialState = {
      isOpen: true,
      field,
      oldOtp: "",
      oldVerified: isCurrentContactMissing,
      newValue: "",
      newValueChecked: false,
      checkingNewValue: false,
      newOtp: "",
      newOtpSent: false,
      error: "",
      sendingOldOtp: !isCurrentContactMissing,
      verifyingOldOtp: false,
      sendingOtp: false,
      submitting: false
    };

    if (isCurrentContactMissing) {
      setModalState(initialState);
      return;
    }

    try {
      setModalState(initialState);
      await sendOtp({ field, value });
      addToast(`Đã gửi OTP đến ${FIELD_LABELS[field].toLowerCase()} hiện tại.`, "success");
      setModalState((prev) => ({ ...prev, sendingOldOtp: false }));
    } catch (error) {
      setModalState((prev) => ({
        ...prev,
        sendingOldOtp: false,
        error: getApiError(error, "Gửi OTP xác thực thất bại.")
      }));
    }
  };

  const handleVerifyOldContact = async () => {
    const field = modalState.field;
    const value = String(currentValueByField[field] || "").trim();


    if (!hasContactValue(value)) {
      setModalState((prev) => ({
        ...prev,
        oldVerified: true,
        error: ""
      }));
      return;
    }

    const currentValueError = validateCurrentValue(field, value);
    if (currentValueError) {
      setModalState((prev) => ({ ...prev, error: currentValueError }));
      return;
    }
    const oldOtpError = validateOtp(modalState.oldOtp, "OTP liên hệ hiện tại");
    if (oldOtpError) {
      setModalState((prev) => ({ ...prev, error: oldOtpError }));
      return;
    }

    try {
      setModalState((prev) => ({ ...prev, verifyingOldOtp: true, error: "" }));
      await verifyContactIdentity({ field, value, otp: modalState.oldOtp.trim() });
      setModalState((prev) => ({
        ...prev,
        oldVerified: true,
        verifyingOldOtp: false,
        error: ""
      }));
      addToast("Xác thực liên hệ hiện tại thành công. Vui lòng nhập liên hệ mới.", "success");
    } catch (error) {
      setModalState((prev) => ({
        ...prev,
        verifyingOldOtp: false,
        error: getApiError(error, "OTP xác thực không hợp lệ hoặc đã hết hạn.")
      }));
    }
  };

  const handleCheckNewValue = async () => {
    const field = modalState.field;
    const newValue = modalState.newValue.trim();

    const validationError = validateNewValue(field, newValue);
    if (validationError) {
      setModalState((prev) => ({ ...prev, error: validationError }));
      return;
    }

    const currentValue = String(currentValueByField[field] || "").trim();
    const isCurrentContactMissing = !hasContactValue(currentValue);

    if (!isCurrentContactMissing && newValue === currentValue) {
      setModalState((prev) => ({
        ...prev,
        error: `${FIELD_LABELS[field]} mới phải khác giá trị hiện tại.`
      }));
      return;
    }

    try {
      setModalState((prev) => ({ ...prev, checkingNewValue: true, error: "" }));
      await contactCheck({ field, value: newValue });
      setModalState((prev) => ({
        ...prev,
        newValueChecked: true,
        checkingNewValue: false
      }));
    } catch (error) {
      setModalState((prev) => ({
        ...prev,
        checkingNewValue: false,
        error: getApiError(error, `${FIELD_LABELS[field]} mới không khả dụng (đã được sử dụng bởi tài khoản khác).`)
      }));
    }
  };

  const handleSendOtpNewContact = async () => {
    const field = modalState.field;
    const newValue = modalState.newValue.trim();
    const currentValue = String(currentValueByField[field] || "").trim();

    // Require explicit check (res 200) before allowing send OTP for new contact
    if (!modalState.newValueChecked) {
      setModalState((prev) => ({ ...prev, error: "Vui lòng kiểm tra liên hệ mới trước khi gửi OTP." }));
      return;
    }

    const isCurrentContactMissing = !hasContactValue(currentValue);
    if (!isCurrentContactMissing) {
      const currentValueError = validateCurrentValue(field, currentValue);
      if (currentValueError) {
        setModalState((prev) => ({ ...prev, error: currentValueError }));
        return;
      }
    }

    const validationError = validateNewValue(field, newValue);
    if (validationError) {
      setModalState((prev) => ({ ...prev, error: validationError }));
      return;
    }

    if (!isCurrentContactMissing && newValue === currentValue) {
      setModalState((prev) => ({
        ...prev,
        error: `${FIELD_LABELS[field]} mới phải khác giá trị hiện tại.`
      }));
      return;
    }

    const cooldown = getCooldownInfo(user, field);
    if (cooldown.blocked) {
      const message = formatCooldownMessage(field, cooldown);
      setModalState((prev) => ({
        ...prev,
        error: message
      }));
      addToast(message, "error");
      return;
    }

    try {
      setModalState((prev) => ({ ...prev, sendingOtp: true, error: "" }));
      await sendOtp({ field, value: newValue });
      setModalState((prev) => ({ ...prev, newOtpSent: true }));
      addToast(`Đã gửi OTP đến ${FIELD_LABELS[field].toLowerCase()} mới.`, "success");
    } catch (error) {
      setModalState((prev) => ({
        ...prev,
        error: getApiError(error, "Không thể gửi OTP cho liên hệ mới.")
      }));
    } finally {
      setModalState((prev) => ({ ...prev, sendingOtp: false }));
    }
  };

  const handleConfirmUpdate = async () => {
    const field = modalState.field;
    const newValue = modalState.newValue.trim();
    const newOtp = modalState.newOtp.trim();
    if (!modalState.oldVerified) {
      setModalState((prev) => ({ ...prev, error: "Vui lòng xác thực OTP liên hệ hiện tại trước." }));
      return;
    }

    const validationError = validateNewValue(field, newValue);
    if (validationError) {
      setModalState((prev) => ({ ...prev, error: validationError }));
      return;
    }
    const newOtpError = validateOtp(newOtp, "OTP liên hệ mới");
    if (newOtpError) {
      setModalState((prev) => ({ ...prev, error: newOtpError }));
      return;
    }
    if (!modalState.newOtpSent) {
      setModalState((prev) => ({ ...prev, error: "Vui lòng gửi OTP cho liên hệ mới trước khi xác nhận." }));
      return;
    }

    try {
      setModalState((prev) => ({ ...prev, submitting: true, error: "" }));
      const res = await updateCustomerContact({ field, value: newValue, otp: newOtp });
      const nextToken = res?.data?.token;
      const updatedUser = res?.data?.user;

      if (nextToken) {
        setStoredToken(nextToken);
        axiosClient.defaults.headers.common.Authorization = `Bearer ${nextToken}`;
      }

      if (updatedUser) {
        try {
          const currentStored = getStoredUser() || {};
          const nextUser = { ...currentStored, ...updatedUser };
          setStoredUser(nextUser);
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("busgo:user-updated", { detail: nextUser }));
          }
        } catch {}
      }

      addToast(`Cập nhật ${FIELD_LABELS[field].toLowerCase()} thành công.`, "success");
      closeModal();
      if (onProfileUpdated) {
        await onProfileUpdated(updatedUser);
      }
    } catch (error) {
      setModalState((prev) => ({
        ...prev,
        error: getApiError(error, "Cập nhật thông tin liên hệ thất bại.")
      }));
    } finally {
      setModalState((prev) => ({ ...prev, submitting: false }));
    }
  };

  const renderContactField = (field, label, icon, value) => {
    const cooldown = getCooldownInfo(user, field);
    const isCooldownBlocked = cooldown.blocked;
    const cooldownMessage = isCooldownBlocked ?
    formatCooldownMessage(field, cooldown) :
    "";
    const isCurrentContactMissing = !hasContactValue(value);

    const isButtonDisabled = isCooldownBlocked;
    const buttonTitle = cooldownMessage;

    return (
      <div className="rounded-2xl bg-surface-container-low p-4 border border-outline-variant/20">
        <p className="text-xs uppercase tracking-wide text-on-surface-variant font-semibold mb-2">{label}</p>
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary">{icon}</span>
          <p className="text-sm md:text-base font-medium text-on-surface-variant">{value || "-"}</p>
        </div>

        <div className="mt-4 space-y-3">
          <button
            type="button"
            onClick={() => handleStartVerify(field)}
            disabled={isButtonDisabled}
            title={buttonTitle}
            className="px-4 py-2 text-sm font-bold rounded-xl bg-primary text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity">
            
            {isCurrentContactMissing ? `Thêm ${label.toLowerCase()}` : "Xác thực để cập nhật"}
          </button>

          {isCooldownBlocked &&
          <p className="text-xs text-amber-700 font-medium">{cooldownMessage}</p>
          }

        </div>
      </div>);

  };

  const isCurrentContactMissing = modalState.field && !hasContactValue(currentValueByField[modalState.field]);
  const currentContactLabel = FIELD_LABELS[modalState.field]?.toLowerCase();
  const isStepVerifyOld = modalState.isOpen && !modalState.oldVerified && !isCurrentContactMissing;
  const isStepEnterNew = modalState.isOpen && modalState.oldVerified && !modalState.newOtpSent;
  const isStepVerifyNew = modalState.isOpen && modalState.oldVerified && modalState.newOtpSent;

  return (
    <>
      <section className="bg-white border border-outline-variant/20 rounded-3xl p-6 md:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-black text-on-surface">Thông tin tài khoản</h2>
            <p className="text-sm text-on-surface-variant mt-1">
              Dữ liệu được đồng bộ trực tiếp từ hệ thống.
            </p>
          </div>
          <ProfileStatusBadge status={user?.status} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <div className="rounded-2xl bg-surface-container-low p-4 border border-outline-variant/20">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs uppercase tracking-wide text-on-surface-variant font-semibold mb-2">Họ và tên</p>
                  {isEditingName ? (
                    <input
                      type="text"
                      value={editingFullName}
                      onChange={(e) => setEditingFullName(e.target.value)}
                      placeholder="Nguyễn Văn A"
                      disabled={savingName}
                      className="w-full rounded-lg border border-outline-variant/50 bg-white px-3 py-2 text-sm font-medium text-on-surface outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:bg-surface-container-low disabled:text-on-surface-variant"
                    />
                  ) : (
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-primary">person</span>
                      <p className="text-sm md:text-base font-bold text-on-surface truncate">{user?.fullName || "-"}</p>
                    </div>
                  )}
                </div>
                {!isEditingName && (
                  <button
                    type="button"
                    onClick={handleStartNameEdit}
                    className="shrink-0 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary transition-colors hover:bg-primary hover:text-white"
                    aria-label="Chỉnh sửa họ và tên"
                    title="Chỉnh sửa họ và tên">
                    <span className="material-symbols-outlined text-[18px]">edit</span>
                  </button>
                )}
              </div>
              {isEditingName && (
                <div className="mt-3 flex flex-col-reverse gap-2 border-t border-outline-variant/20 pt-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={handleCancelNameEdit}
                    disabled={savingName}
                    className="rounded-lg border border-outline-variant/50 px-4 py-2 text-sm font-bold text-on-surface transition-colors hover:bg-surface-container-low disabled:opacity-60">
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveName}
                    disabled={savingName}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-primary/90 disabled:opacity-60">
                    {savingName ? (
                      <>
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Đang lưu...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[18px]">save</span>
                        Lưu thay đổi
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
          {renderContactField("email", "Email", "mail", user?.email)}
          {renderContactField("phone", "Số điện thoại", "call", user?.phone)}
        </div>
      </section>

      {modalState.isOpen &&
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 space-y-4">
              <h3 className="text-xl font-bold text-on-surface">
                Cập nhật {FIELD_LABELS[modalState.field]?.toLowerCase()}
              </h3>
              <p className="text-sm text-on-surface-variant">
                {isStepVerifyOld && "Bước 1/3: Xác thực liên hệ hiện tại bằng OTP."}
                {isStepEnterNew && (isCurrentContactMissing ? `Bước 1/2: Nhập ${currentContactLabel} mới và gửi OTP.` : "Bước 2/3: Nhập liên hệ mới và gửi OTP.")}
                {isStepVerifyNew && (isCurrentContactMissing ? `Bước 2/2: Nhập OTP để cập nhật ${currentContactLabel}.` : "Bước 3/3: Nhập OTP liên hệ mới để hoàn tất cập nhật.")}
              </p>

              {isStepVerifyOld &&
            <div className="space-y-2">
                  <label className="text-sm font-semibold text-on-surface-variant">
                    OTP liên hệ hiện tại
                  </label>
                  <OtpInput
                value={modalState.oldOtp}
                onChange={(val) =>
                setModalState((prev) => ({
                  ...prev,
                  oldOtp: val,
                  error: ""
                }))
                }
                disabled={modalState.verifyingOldOtp || modalState.submitting} />
              
                </div>
            }

              {isStepEnterNew &&
            <div className="space-y-2">
                  <label className="text-sm font-semibold text-on-surface-variant">
                    {FIELD_LABELS[modalState.field]} mới
                  </label>
                  <div className="relative">
                    <input
                      type={modalState.field === "email" ? "email" : "text"}
                      value={modalState.newValue}
                      onChange={(event) =>
                        setModalState((prev) => ({
                          ...prev,
                          newValue: event.target.value,
                          newValueChecked: false,
                          error: ""
                        }))
                      }
                      placeholder={`Nhập ${FIELD_LABELS[modalState.field]?.toLowerCase()} mới`}
                      className="w-full rounded-xl border border-outline-variant/30 px-3 py-2 pr-20 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      disabled={modalState.sendingOtp || modalState.submitting || modalState.checkingNewValue}
                    />
                    <div className="absolute right-1.5 top-1/2 -translate-y-1/2">
                      {!modalState.newValueChecked && modalState.newValue.trim() && (
                        <button
                          type="button"
                          onClick={handleCheckNewValue}
                          disabled={modalState.checkingNewValue || modalState.sendingOtp || modalState.submitting}
                          className="px-2 py-0.5 text-xs font-semibold rounded-md bg-primary/10 text-primary hover:bg-primary/15 border border-primary/30 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                          title="Kiểm tra liên hệ mới khả dụng"
                        >
                          {modalState.checkingNewValue ? (
                            <span className="inline-block w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                          ) : (
                            "Kiểm tra"
                          )}
                        </button>
                      )}
                      {modalState.newValueChecked && (
                        <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-emerald-600/10 text-emerald-700 border border-emerald-600/30">
                          Đã kiểm tra
                        </span>
                      )}
                    </div>
                  </div>

                  {modalState.newValueChecked && (
                    <div className="text-emerald-600 text-[11px] font-medium flex items-center gap-1 mt-0.5">
                      <span className="material-symbols-outlined text-sm">check_circle</span>
                      <span>{FIELD_LABELS[modalState.field]} mới khả dụng — sẵn sàng gửi OTP</span>
                    </div>
                  )}
              
                </div>
            }

              {isStepVerifyNew &&
            <div className="space-y-2">
                  <label className="text-sm font-semibold text-on-surface-variant">
                    OTP liên hệ mới
                  </label>
                  <OtpInput
                value={modalState.newOtp}
                onChange={(val) =>
                setModalState((prev) => ({
                  ...prev,
                  newOtp: val,
                  error: ""
                }))
                }
                disabled={modalState.submitting} />
              
                </div>
            }

              {modalState.error &&
            <p className="text-sm text-red-600 font-medium">{modalState.error}</p>
            }
            </div>

            <div className="px-6 py-4 bg-surface-container-lowest border-t flex justify-end gap-3">
              <button
              type="button"
              onClick={closeModal}
              disabled={modalState.submitting || modalState.sendingOtp}
              className="px-5 py-2.5 text-sm font-bold text-on-surface-variant hover:bg-surface-container rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              
                Hủy
              </button>
              <button
              type="button"
              onClick={
              isStepVerifyOld ?
              handleVerifyOldContact :
              isStepEnterNew ?
              (modalState.newValueChecked ? handleSendOtpNewContact : handleCheckNewValue) :
              handleConfirmUpdate
              }
              disabled={
              modalState.submitting ||
              modalState.sendingOtp ||
              modalState.verifyingOldOtp ||
              modalState.sendingOldOtp ||
              modalState.checkingNewValue
              }
              className="px-5 py-2.5 text-sm font-bold text-on-primary rounded-xl shadow-md bg-primary hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              
                {isStepVerifyOld && (
              modalState.verifyingOldOtp ? "Đang xác thực..." : "Xác thực OTP hiện tại")}
                {isStepEnterNew && (
              modalState.checkingNewValue ? "Đang kiểm tra..." :
              modalState.sendingOtp ? "Đang gửi OTP..." :
              modalState.newValueChecked ? (isCurrentContactMissing ? "Gửi OTP" : "Gửi OTP liên hệ mới") : "Kiểm tra khả dụng"
              )}
                {isStepVerifyNew && (
              modalState.submitting ? "Đang cập nhật..." : "Xác nhận cập nhật")}
              </button>
            </div>
          </div>
        </div>
      }
    </>);

}
