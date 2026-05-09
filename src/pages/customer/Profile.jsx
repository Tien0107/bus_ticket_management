import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCustomerProfile } from "../../api/customer";
import ProfileHeader from "../../components/profile/ProfileHeader";
import ProfileInfoCard from "../../components/profile/ProfileInfoCard";
import CustomerProfileNav from "../../components/profile/CustomerProfileNav";

export default function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getCustomerProfile();
      setProfile(res.data?.user ? res.data : { user: res.data });
    } catch (err) {
      console.error("Lỗi lấy hồ sơ:", err);
      if (err.response?.status === 401) {
        navigate("/login");
        return;
      }
      setError("Không thể tải thông tin hồ sơ. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [navigate]);

  const handleProfileUpdated = async (updatedUser) => {
    if (updatedUser) {
      setProfile((prev) => ({ ...(prev || {}), user: updatedUser }));
      return;
    }
    await fetchProfile();
  };

  return (
    <div className="min-h-screen bg-surface pt-24 pb-12 px-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <CustomerProfileNav />

        <ProfileHeader
          fullName={profile?.user?.fullName}
          email={profile?.user?.email}
        />

        {loading && (
          <div className="bg-white rounded-3xl border border-outline-variant/20 p-10 flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            <p className="text-on-surface-variant font-medium">Đang tải hồ sơ...</p>
          </div>
        )}

        {!loading && error && (
          <div className="bg-red-50 text-red-600 border border-red-200 rounded-2xl p-4 font-medium">
            {error}
          </div>
        )}

        {!loading && !error && profile?.user && (
          <ProfileInfoCard user={profile.user} onProfileUpdated={handleProfileUpdated} />
        )}
      </div>
    </div>
  );
}
