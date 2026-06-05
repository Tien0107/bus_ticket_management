import React from "react";
import ChangePasswordCard from "../../components/profile/ChangePasswordCard";
import OperatorProfileCard from "../../components/profile/OperatorProfileCard";
import { OperatorPageShell } from "./OperatorUI";

export default function OperatorProfile() {
  return (
    <OperatorPageShell
      eyebrow="Profile"
      title="Hồ sơ điều hành"
      description="Quản lý thông tin cá nhân, vai trò, mã nhân viên, ngày vào làm, bộ phận và vị trí."
      maxWidth="max-w-6xl"
    >
      <div className="space-y-5">
        <OperatorProfileCard roleLabel="Điều hành viên" />
        <ChangePasswordCard />
      </div>
    </OperatorPageShell>
  );
}
