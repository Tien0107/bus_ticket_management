import React from "react";
import OperatorProfileCard from "../../components/profile/OperatorProfileCard";
import { OperatorPageShell } from "./OperatorUI";

export default function OperatorProfile() {
  return (
    <OperatorPageShell
      eyebrow="Profile"
      title="Hồ sơ điều hành"
      description="Quản lý thông tin cá nhân, vai trò, mã nhân viên và ngày vào làm."
      maxWidth="max-w-6xl"
    >
      <OperatorProfileCard roleLabel="Điều hành viên" />
    </OperatorPageShell>
  );
}
