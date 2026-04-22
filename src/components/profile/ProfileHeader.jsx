import React from "react";
import { useNavigate } from "react-router-dom";

export default function ProfileHeader({ fullName, email }) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-3xl md:text-4xl font-black text-on-surface">Hồ sơ cá nhân</h1>
        <p className="text-on-surface-variant mt-2">
          Quản lý thông tin tài khoản BusGo của bạn.
        </p>
      </div>

      <div className="rounded-2xl bg-white border border-outline-variant/20 p-4 shadow-sm min-w-[220px]">
        <p className="font-bold text-on-surface truncate">{fullName || "Khách hàng"}</p>
        <p className="text-sm text-on-surface-variant truncate">{email || "Chưa cập nhật email"}</p>
        <button
          onClick={() => navigate("/profile/tickets")}
          className="mt-3 w-full rounded-xl bg-primary text-white px-4 py-2.5 text-sm font-bold hover:bg-primary/90 transition-colors"
        >
          Xem vé của tôi
        </button>
      </div>
    </div>
  );
}
