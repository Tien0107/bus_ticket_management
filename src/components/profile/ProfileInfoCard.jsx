import React, { useState } from "react";
import { sendOtp } from "../../api/auth";
import axiosClient from "../../api/axiosClient";
import { updateCustomerContact, verifyContactIdentity } from "../../api/customer";
import { useToast } from "../../context/ToastContext";
import ProfileField from "./ProfileField";
import ProfileStatusBadge from "./ProfileStatusBadge";
import { getStoredUser, setStoredToken, setStoredUser } from "../../utils/authStorage";

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
  const keys = [...LAST_CHANGE_KEYS.generic, ...(LAST_CHANGE_KEYS[field] || [])];
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
  if (!info.remainingHours) {
    return `Bạn vừa cập nhật thông tin liên hệ. Vui lòng thử lại sau ${info.remainingMinutes} phút.`;
  }
  if (!info.remainingMinutes) {
    return `Bạn vừa cập nhật thông tin liên hệ. Vui lòng thử lại sau ${info.remainingHours} giờ.`;
  }
  return `Bạn vừa cập nhật thông tin liên hệ. Vui lòng thử lại sau ${info.remainingHours} giờ ${info.remainingMinutes} phút.`;
};

const hasContactValue = (value) => Boolean(String(value || "").trim());

const OTPInput = ({ value, onChange, disabled }) => {
  const [otp, setOtp] = React.useState(Array(6).fill(""));

  React.useEffect(() => {
    if (value) {
      setOtp(value.split("").slice(0, 6).concat(Array(6).fill("")).slice(0, 6));
    }
  }, [value]);

  const handleChange = (index, val) => {
    if (!/^\d*$/.test(val)) return;
    const newOtp = [...otp];
    newOtp[index] = val.slice(-1);
    setOtp(newOtp);

    const otpString = newOtp.join("");
    onChange(otpString);


    if (val && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  return (
    <div className="flex gap-2 justify-center">
      {Array(6).
      fill(0).
      map((_, i) =>
      <input
        key={i}
        id={`otp-${i}`}
        type="password"
        maxLength="1"
        value={otp[i]}
        onChange={(e) => handleChange(i, e.target.value)}
        onKeyDown={(e) => handleKeyDown(i, e)}
        disabled={disabled}
        className="w-12 h-12 text-center text-lg font-bold rounded-lg border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary disabled:bg-gray-100 disabled:cursor-not-allowed" />

      )}
    </div>);

};

export default function ProfileInfoCard({ user, onProfileUpdated }) {
  const { addToast } = useToast();
  const [modalState, setModalState] = useState({
    isOpen: false,
    field: "",
    oldOtp: "",
    oldVerified: false,
    newValue: "",
    newOtp: "",
    newOtpSent: false,
    error: "",
    sendingOldOtp: false,
    verifyingOldOtp: false,
    sendingOtp: false,
    submitting: false
  });

  const currentValueByField = {
    email: user?.email || "",
    phone: user?.phone || ""
  };

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
      newOtp: "",
      newOtpSent: false,
      error: "",
      sendingOldOtp: false,
      verifyingOldOtp: false,
      sendingOtp: false,
      submitting: false
    });
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

  const handleSendOtpNewContact = async () => {
    const field = modalState.field;
    const newValue = modalState.newValue.trim();
    const currentValue = String(currentValueByField[field] || "").trim();


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
        setStoredUser(updatedUser);
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
            disabled={isCooldownBlocked}
            title={cooldownMessage}
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
            <ProfileField
              label="Họ và tên"
              value={user?.fullName}
              icon="person"
              emphasized />
            
            <p className="text-xs text-on-surface-variant mt-2 ml-1">
              Họ và tên được khóa, không thể chỉnh sửa trên giao diện này.
            </p>
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
                  <OTPInput
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
                  <input
                type={modalState.field === "email" ? "email" : "text"}
                value={modalState.newValue}
                onChange={(event) =>
                setModalState((prev) => ({
                  ...prev,
                  newValue: event.target.value,
                  error: ""
                }))
                }
                placeholder={`Nhập ${FIELD_LABELS[modalState.field]?.toLowerCase()} mới`}
                className="w-full rounded-xl border border-outline-variant/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                disabled={modalState.sendingOtp || modalState.submitting} />
              
                </div>
            }

              {isStepVerifyNew &&
            <div className="space-y-2">
                  <label className="text-sm font-semibold text-on-surface-variant">
                    OTP liên hệ mới
                  </label>
                  <OTPInput
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
              handleSendOtpNewContact :
              handleConfirmUpdate
              }
              disabled={
              modalState.submitting ||
              modalState.sendingOtp ||
              modalState.verifyingOldOtp ||
              modalState.sendingOldOtp
              }
              className="px-5 py-2.5 text-sm font-bold text-on-primary rounded-xl shadow-md bg-primary hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              
                {isStepVerifyOld && (
              modalState.verifyingOldOtp ? "Đang xác thực..." : "Xác thực OTP hiện tại")}
                {isStepEnterNew && (
              modalState.sendingOtp ? "Đang gửi OTP..." : isCurrentContactMissing ? "Gửi OTP" : "Gửi OTP liên hệ mới")}
                {isStepVerifyNew && (
              modalState.submitting ? "Đang cập nhật..." : "Xác nhận cập nhật")}
              </button>
            </div>
          </div>
        </div>
      }
    </>);

}
