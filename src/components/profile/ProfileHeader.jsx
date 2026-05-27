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
    </div>
  );
}
