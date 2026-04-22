import React from "react";
import ProfileField from "./ProfileField";
import ProfileStatusBadge from "./ProfileStatusBadge";

export default function ProfileInfoCard({ user }) {
  return (
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
        <ProfileField
          label="Họ và tên"
          value={user?.fullName}
          icon="person"
          emphasized
        />
        <ProfileField
          label="Email"
          value={user?.email}
          icon="mail"
        />
        <ProfileField
          label="Số điện thoại"
          value={user?.phone}
          icon="call"
        />
      </div>
    </section>
  );
}
