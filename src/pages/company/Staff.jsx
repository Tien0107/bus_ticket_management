import React, { useEffect, useMemo, useState } from "react";
import { getStaff, updateStaff, updateStaffRole } from "../../api/company";
import { useToast } from "../../context/ToastContext";
import {
  CompanyPageShell,
  EmptyState,
  ErrorState,
  Field,
  IconButton,
  LoadingState,
  ModalShell,
  PrimaryButton,
  SearchInput,
  SecondaryButton,
  SelectControl,
  StatCard,
  StatusBadge,
  ToolbarCard,
  inputClass,
} from "./CompanyUI";

const roleLabel = {
  support: "Hỗ trợ",
  staff: "Nhân viên",
  dispatcher: "Điều phối",
  company_admin: "Quản trị công ty",
};

const roleTone = {
  dispatcher: "blue",
  support: "violet",
  staff: "slate",
  company_admin: "amber",
};

const statusTone = {
  active: "emerald",
  inactive: "red",
  banned: "red",
};

export default function Staff() {
  const { addToast } = useToast();

  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [newRole, setNewRole] = useState("staff");
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [editFormData, setEditFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    status: "active",
  });

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const response = await getStaff({ limit: 100 });
      setStaff(Array.isArray(response.data?.staff) ? response.data.staff : []);
      setError("");
    } catch (err) {
      console.error("Lỗi tải danh sách nhân viên:", err);
      setStaff([]);
      setError("Không thể tải danh sách nhân viên.");
    } finally {
      setLoading(false);
    }
  };

  const getStaffId = (member) => member?.userId || member?.id;
  const getRole = (member) => member?.role || member?.staffProfileRole || "staff";

  const filteredStaff = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return staff;

    return staff.filter((member) =>
      [member.fullName, member.email, member.phone, member.role, member.staffProfileRole, member.position]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword))
    );
  }, [staff, searchTerm]);

  const stats = useMemo(() => [
    { icon: "groups", label: "Tổng nhân viên", value: staff.length, tone: "primary" },
    { icon: "verified", label: "Hoạt động", value: staff.filter((member) => member.status === "active").length, tone: "emerald" },
    { icon: "admin_panel_settings", label: "Quản trị", value: staff.filter((member) => getRole(member) === "company_admin").length, tone: "amber" },
    { icon: "support_agent", label: "Vận hành", value: staff.filter((member) => ["dispatcher", "support"].includes(getRole(member))).length, tone: "blue" },
  ], [staff]);

  const handleOpenRoleModal = (member) => {
    setSelectedStaff(member);
    setNewRole(getRole(member));
    setShowRoleModal(true);
  };

  const handleRoleChange = async () => {
    if (!selectedStaff) return;

    try {
      await updateStaffRole(getStaffId(selectedStaff), newRole);
      addToast("Cập nhật chức vụ thành công", "success");
      setShowRoleModal(false);
      setSelectedStaff(null);
      fetchStaff();
    } catch (err) {
      console.error("Lỗi cập nhật chức vụ:", err);
      addToast(err.response?.data?.message || "Cập nhật chức vụ thất bại", "error");
    }
  };

  const handleOpenEditModal = (member) => {
    setEditingStaff(member);
    setEditFormData({
      fullName: member.fullName || "",
      email: member.email || "",
      phone: member.phone || "",
      status: member.status || "active",
    });
    setShowEditModal(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSaveEdit = async () => {
    if (!editFormData.fullName?.trim() || !editFormData.email?.trim() || !editFormData.phone?.trim()) {
      addToast("Vui lòng điền đầy đủ thông tin", "error");
      return;
    }

    try {
      await updateStaff(getStaffId(editingStaff), editFormData);
      addToast("Cập nhật nhân viên thành công", "success");
      setShowEditModal(false);
      setEditingStaff(null);
      fetchStaff();
    } catch (err) {
      console.error("Lỗi cập nhật nhân viên:", err);
      addToast(err.response?.data?.message || "Cập nhật thông tin thất bại", "error");
    }
  };

  return (
    <CompanyPageShell
      eyebrow="Staff"
      title="Quản lý nhân viên"
      description="Theo dõi nhân sự nội bộ, trạng thái tài khoản và vai trò vận hành."
    >
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <ToolbarCard>
        <SearchInput
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Tìm theo tên, email, số điện thoại hoặc chức vụ"
        />
      </ToolbarCard>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} />
      ) : filteredStaff.length === 0 ? (
        <EmptyState icon="group_search" title="Không tìm thấy nhân viên" description="Thử đổi từ khóa tìm kiếm." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-outline-variant/30 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-sm">
              <thead className="bg-surface-container-low">
                <tr>
                  <th className="px-5 py-3 text-left font-bold text-on-surface-variant">Nhân viên</th>
                  <th className="px-5 py-3 text-left font-bold text-on-surface-variant">Liên hệ</th>
                  <th className="px-5 py-3 text-left font-bold text-on-surface-variant">Vai trò</th>
                  <th className="px-5 py-3 text-left font-bold text-on-surface-variant">Vị trí</th>
                  <th className="px-5 py-3 text-left font-bold text-on-surface-variant">Trạng thái</th>
                  <th className="px-5 py-3 text-right font-bold text-on-surface-variant">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/15">
                {filteredStaff.map((member) => {
                  const role = getRole(member);

                  return (
                    <tr key={getStaffId(member)} className="hover:bg-surface-container-low/70">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <span className="material-symbols-outlined text-[22px]">person</span>
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-bold text-on-surface">{member.fullName || "Chưa có tên"}</p>
                            <p className="mt-1 text-xs text-on-surface-variant">ID: {getStaffId(member) || "—"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-medium text-on-surface">{member.email || "—"}</p>
                        <p className="mt-1 text-xs text-on-surface-variant">{member.phone || "—"}</p>
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge tone={roleTone[role] || "slate"}>{roleLabel[role] || role}</StatusBadge>
                      </td>
                      <td className="px-5 py-4 text-on-surface-variant">
                        {member.position || member.department || "—"}
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge tone={statusTone[member.status] || "slate"}>
                          {member.status === "active" ? "Hoạt động" : member.status || "—"}
                        </StatusBadge>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <IconButton icon="admin_panel_settings" label="Đổi vai trò" onClick={() => handleOpenRoleModal(member)} />
                          <IconButton icon="edit" label="Sửa nhân viên" variant="primary" onClick={() => handleOpenEditModal(member)} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showRoleModal && selectedStaff && (
        <ModalShell
          title="Đổi vai trò nhân viên"
          subtitle={selectedStaff.fullName}
          onClose={() => setShowRoleModal(false)}
          footer={
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <SecondaryButton onClick={() => setShowRoleModal(false)}>Hủy</SecondaryButton>
              <PrimaryButton icon="save" onClick={handleRoleChange}>Cập nhật</PrimaryButton>
            </div>
          }
        >
          <div className="space-y-4">
            <Field label="Vai trò mới">
              <SelectControl value={newRole} onChange={(e) => setNewRole(e.target.value)}>
                <option value="staff">Nhân viên</option>
                <option value="dispatcher">Điều phối</option>
                <option value="support">Hỗ trợ</option>
                <option value="company_admin">Quản trị công ty</option>
              </SelectControl>
            </Field>
            <div className="rounded-lg bg-surface-container-low p-4 text-sm text-on-surface-variant">
              Vai trò hiện tại: <span className="font-bold text-on-surface">{roleLabel[getRole(selectedStaff)] || getRole(selectedStaff)}</span>
            </div>
          </div>
        </ModalShell>
      )}

      {showEditModal && editingStaff && (
        <ModalShell
          title="Sửa thông tin nhân viên"
          subtitle={editingStaff.fullName}
          onClose={() => setShowEditModal(false)}
          footer={
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <SecondaryButton onClick={() => setShowEditModal(false)}>Hủy</SecondaryButton>
              <PrimaryButton icon="save" onClick={handleSaveEdit}>Lưu</PrimaryButton>
            </div>
          }
        >
          <div className="space-y-4">
            <Field label="Tên đầy đủ">
              <input
                type="text"
                name="fullName"
                value={editFormData.fullName}
                onChange={handleEditChange}
                className={inputClass}
              />
            </Field>
            <Field label="Email">
              <input
                type="email"
                name="email"
                value={editFormData.email}
                onChange={handleEditChange}
                className={inputClass}
              />
            </Field>
            <Field label="Số điện thoại">
              <input
                type="tel"
                name="phone"
                value={editFormData.phone}
                onChange={handleEditChange}
                className={inputClass}
              />
            </Field>
            <Field label="Trạng thái">
              <SelectControl name="status" value={editFormData.status} onChange={handleEditChange}>
                <option value="active">Hoạt động</option>
                <option value="inactive">Không hoạt động</option>
                <option value="banned">Bị chặn</option>
              </SelectControl>
            </Field>
          </div>
        </ModalShell>
      )}
    </CompanyPageShell>
  );
}
