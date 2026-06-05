import React, { useCallback, useEffect, useState } from "react";
import ChangePasswordCard from "../../components/profile/ChangePasswordCard";
import OperatorProfileCard from "../../components/profile/OperatorProfileCard";
import { getStoredUser as getAuthStoredUser } from "../../utils/authStorage";
import { OperatorPageShell } from "../operator/OperatorUI";

const getStoredUser = () => {
  return getAuthStoredUser();
};

export default function SupportProfile() {
  const [user, setUser] = useState(getStoredUser);

  useEffect(() => {
    const syncUser = () => setUser(getStoredUser());

    window.addEventListener("storage", syncUser);
    window.addEventListener("busgo:user-updated", syncUser);

    return () => {
      window.removeEventListener("storage", syncUser);
      window.removeEventListener("busgo:user-updated", syncUser);
    };
  }, []);

  const handleProfileUpdated = useCallback((profile) => {
    setUser((current) => ({ ...current, ...profile }));
  }, []);

  return (
    <OperatorPageShell
      eyebrow="Profile"
      title="Hồ sơ hỗ trợ"
      description="Quản lý thông tin cá nhân, vai trò, mã nhân viên, ngày vào làm, bộ phận và vị trí.">
      <div className="space-y-5">
        <OperatorProfileCard roleLabel="Nhân viên hỗ trợ" onProfileUpdated={handleProfileUpdated} />
        <ChangePasswordCard user={user} />
      </div>
    </OperatorPageShell>
  );
}
