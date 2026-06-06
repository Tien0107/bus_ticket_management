import React, { useMemo, useState } from "react";
import { updatePassword, sendEmail } from "../../api/auth";
import { useToast } from "../../context/ToastContext";
import { getStoredUser } from "../../utils/authStorage";

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[#@$%&!*?^_])[^\s]+$/;

const emptyForm = {
  oldPassword: "",
  newPassword: "",
  confirmPassword: ""
};

const getAccountEmail = (user) => user?.email || getStoredUser(null)?.email || "";

const PasswordInput = ({ label, name, value, onChange, disabled }) => (
  <label className="block">
    <span className="mb-2 block text-sm font-bold text-on-surface">{label}</span>
    <input
      type="password"
      name={name}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className="w-full rounded-lg border border-outline-variant/50 bg-white px-4 py-3 text-sm font-medium outline-none transition-all placeholder:text-outline focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:bg-surface-container-low disabled:text-on-surface-variant"
    />
  </label>
);

export default function ChangePasswordCard({ user, compact = false }) {
  const { addToast } = useToast();
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const accountEmail = useMemo(() => getAccountEmail(user), [user]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const validate = () => {
    if (!form.oldPassword.trim()) return "Vui lòng nhập mật khẩu hiện tại.";
    if (!form.newPassword.trim()) return "Vui lòng nhập mật khẩu mới.";
    if (form.newPassword !== form.confirmPassword) return "Mật khẩu xác nhận không khớp.";
    if (form.newPassword.length < 8) return "Mật khẩu mới phải có ít nhất 8 ký tự.";
    if (!passwordRegex.test(form.newPassword)) {
      return "Mật khẩu mới phải có chữ hoa, chữ thường, số và ký tự đặc biệt.";
    }
    if (form.oldPassword === form.newPassword) return "Mật khẩu mới phải khác mật khẩu hiện tại.";
    return "";
  };

  const handleSubmit = async () => {
    const error = validate();
    if (error) {
      addToast(error, "error");
      return;
    }

    try {
      setSaving(true);
      await updatePassword({
        oldPassword: form.oldPassword,
        newPassword: form.newPassword
      });
      setForm(emptyForm);
      addToast("Cập nhật mật khẩu thành công", "success");

      if (accountEmail) {
        sendEmail({
          to: accountEmail,
          subject: "[BusGo] Mật khẩu tài khoản của bạn đã được thay đổi",
          text: `Chào bạn,\n\nChúng tôi muốn thông báo rằng mật khẩu cho tài khoản BusGo của bạn (${accountEmail}) vừa được thay đổi thành công vào lúc ${new Date().toLocaleString("vi-VN")}.\n\nNếu bạn KHÔNG thực hiện thay đổi này, vui lòng liên hệ ngay với tổng đài hỗ trợ 1900 6868 hoặc phản hồi email này để bảo vệ tài khoản.\n\nTrân trọng,\nĐội ngũ bảo mật BusGo`,
          template: "default",
          params: {}
        }).catch((err) => console.error("Lỗi gửi email thông báo đổi mật khẩu:", err));
      }
    } catch (error) {
      addToast(
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Cập nhật mật khẩu thất bại",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className={`rounded-xl border border-outline-variant/30 bg-white shadow-sm ${compact ? "p-5" : "p-6"}`}>
      <div className="mb-5 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <span className="material-symbols-outlined text-[21px]">lock_reset</span>
        </span>
        <div className="min-w-0">
          <h2 className="text-lg font-extrabold text-on-surface">Cập nhật mật khẩu</h2>
          <p className="mt-1 text-sm font-medium text-on-surface-variant">
            Đổi mật khẩu đăng nhập cho tài khoản hiện tại.
          </p>
        </div>
      </div>

      <div className="mb-5 rounded-lg border border-sky-100 bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-800">
        Lưu ý: nếu tài khoản đăng nhập bằng Google hoặc Facebook, bạn sẽ không thể thay đổi mật khẩu tại đây. Vui lòng sử dụng chức năng "Quên mật khẩu" trên trang đăng nhập để đặt lại mật khẩu thông qua email.
      </div>

      <div className={`grid grid-cols-1 gap-4 ${compact ? "" : "md:grid-cols-3"}`}>
        <PasswordInput
          label="Mật khẩu hiện tại"
          name="oldPassword"
          value={form.oldPassword}
          onChange={handleChange}
          disabled={saving}
        />
        <PasswordInput
          label="Mật khẩu mới"
          name="newPassword"
          value={form.newPassword}
          onChange={handleChange}
          disabled={saving}
        />
        <PasswordInput
          label="Xác nhận mật khẩu mới"
          name="confirmPassword"
          value={form.confirmPassword}
          onChange={handleChange}
          disabled={saving}
        />
      </div>

      <div className="mt-5 flex justify-end">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60">
          {saving ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Đang cập nhật...
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[20px]">save</span>
              Cập nhật mật khẩu
            </>
          )}
        </button>
      </div>
    </section>
  );
}
