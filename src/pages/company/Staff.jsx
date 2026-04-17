import React, { useState, useEffect } from "react";
import { getStaff, updateStaffRole, updateStaff } from "../../api/company";
import { useToast } from "../../context/ToastContext";

export default function Staff() {
  const { addToast } = useToast();

  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [newRole, setNewRole] = useState("");
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
      setError(null);
    } catch (err) {
      console.error("Lỗi tải danh sách nhân viên:", err);
      setStaff([]);
      setError("Không thể tải danh sách nhân viên");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async () => {
    try {
      // Swagger show request body là string, không object
      await updateStaffRole(selectedStaff.userId, newRole);
      addToast("Cập nhật chức vụ thành công", "success");
      setShowRoleModal(false);
      setSelectedStaff(null);
      fetchStaff();
    } catch (err) {
      console.error("Lỗi cập nhật chức vụ:", err);
      addToast("Cập nhật chức vụ thất bại", "error");
    }
  };

  const handleOpenEditModal = (staffMember) => {
    setEditingStaff(staffMember);
    setEditFormData({
      fullName: staffMember.fullName || "",
      email: staffMember.email || "",
      phone: staffMember.phone || "",
      status: staffMember.status || "active",
    });
    setShowEditModal(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData({ ...editFormData, [name]: value });
  };

  const handleSaveEdit = async () => {
    try {
      if (!editFormData.fullName?.trim()) {
        addToast("Vui lòng nhập tên đầy đủ", "error");
        return;
      }
      if (!editFormData.email?.trim()) {
        addToast("Vui lòng nhập email", "error");
        return;
      }
      if (!editFormData.phone?.trim()) {
        addToast("Vui lòng nhập số điện thoại", "error");
        return;
      }

      await updateStaff(editingStaff.userId, editFormData);
      addToast("Cập nhật thông tin nhân viên thành công", "success");
      setShowEditModal(false);
      setEditingStaff(null);
      fetchStaff();
    } catch (err) {
      console.error("Lỗi cập nhật nhân viên:", err);
      addToast(err.response?.data?.message || "Cập nhật thông tin thất bại", "error");
    }
  };

  const filteredStaff = staff.filter(
    (s) =>
      s.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleColor = (role) => {
    const colorMap = {
      admin: "bg-red-100 text-red-700",
      operator: "bg-blue-100 text-blue-700",
      accountant: "bg-green-100 text-green-700",
      support: "bg-purple-100 text-purple-700",
      staff: "bg-gray-100 text-gray-700",
    };
    return colorMap[role] || colorMap.staff;
  };

  const getRoleLabel = (role) => {
    const labelMap = {
      admin: "Quản trị viên",
      operator: "Người điều hành",
      accountant: "Kế toán",
      support: "Hỗ trợ khách hàng",
      staff: "Nhân viên",
    };
    return labelMap[role] || role;
  };

  return (
    <div className="min-h-screen bg-surface p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold text-on-surface">Quản lý nhân viên</h1>
          <p className="text-on-surface-variant mt-2">Quản lý nhân viên công ty và chức vụ của họ</p>
        </div>

        {/* Search */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
              search
            </span>
            <input
              type="text"
              placeholder="Tìm nhân viên (tên, email, chức vụ)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-surface-container-low border-0 rounded-xl focus:ring-2 focus:ring-primary outline-none"
            />
          </div>
        </div>

        {/* Staff Table */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            <p className="text-on-surface-variant mt-4">Đang tải...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-2xl">{error}</div>
        ) : filteredStaff.length === 0 ? (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-6xl text-on-surface-variant opacity-50">
              people
            </span>
            <p className="text-on-surface-variant mt-4">Không tìm thấy nhân viên nào</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-outline-variant/20">
                  <tr>
                    <th className="px-6 py-4 text-left text-base font-extrabold text-primary">Tên</th>
                    <th className="px-6 py-4 text-left text-base font-extrabold text-primary">Email</th>
                    <th className="px-6 py-4 text-center text-base font-extrabold text-primary">SĐT</th>
                    <th className="px-6 py-4 text-center text-base font-extrabold text-primary">Chức vụ</th>
                    <th className="px-6 py-4 text-center text-base font-extrabold text-primary">Vị trí</th>
                    <th className="px-6 py-4 text-center text-base font-extrabold text-primary">Ngày tham gia</th>
                    <th className="px-6 py-4 text-center text-base font-extrabold text-primary">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {filteredStaff.map((member) => (
                    <tr key={member.id} className="hover:bg-surface-container-low transition-colors align-middle">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary-container rounded-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-primary text-2xl">person</span>
                          </div>
                          <p className="font-semibold text-on-surface break-words max-w-[140px]">{member.fullName}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-on-surface break-words max-w-[180px]">{member.email}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-on-surface text-center">{member.phone || "—"}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-4 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700 border border-gray-200`} style={{minWidth: 90, textAlign: 'center'}}>
                          {getRoleLabel(member.role || member.staffProfileRole) || member.role || member.staffProfileRole || "—"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-on-surface text-center font-semibold">{member.position || "—"}</p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-block text-sm font-semibold">
                          {member.hireDate ? new Date(member.hireDate).toLocaleDateString("vi-VN") : "—"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-block px-4 py-1 rounded-full text-xs font-bold ${member.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`} style={{minWidth: 90, textAlign: 'center'}}>
                          {member.status === "active" ? "Hoạt động" : member.status === "inactive" ? "Không hoạt động" : member.status || "—"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Role Modal */}
        {showRoleModal && selectedStaff && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md">
              <div className="bg-gradient-to-r from-primary to-primary-container text-white p-6">
                <h2 className="text-2xl font-bold">Đổi chức vụ</h2>
                <p className="text-white/80 mt-1">{selectedStaff.fullName}</p>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-on-surface mb-2">Chức vụ mới</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full px-4 py-3 bg-surface-container-low border-0 rounded-xl focus:ring-2 focus:ring-primary outline-none"
                  >
                    <option value="admin">Quản trị viên</option>
                    <option value="operator">Người điều hành</option>
                    <option value="accountant">Kế toán</option>
                    <option value="support">Hỗ trợ khách hàng</option>
                    <option value="staff">Nhân viên</option>
                  </select>
                </div>

                <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                  <p className="text-sm text-blue-700">
                    <span className="font-bold">Chức vụ hiện tại:</span> {getRoleLabel(selectedStaff.role)}
                  </p>
                  <p className="text-sm text-blue-600 mt-1">
                    Quyền của {getRoleLabel(newRole).toLowerCase()} sẽ được áp dụng ngay
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowRoleModal(false);
                      setSelectedStaff(null);
                    }}
                    className="flex-1 px-6 py-3 border-2 border-primary text-primary rounded-lg font-bold hover:bg-primary/10 transition-all"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleRoleChange}
                    className="flex-1 px-6 py-3 bg-primary text-white rounded-lg font-bold hover:bg-primary/80 transition-all"
                  >
                    Xác nhận
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Staff Modal */}
        {showEditModal && editingStaff && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6">
                <h2 className="text-2xl font-bold">Sửa thông tin nhân viên</h2>
                <p className="text-white/80 mt-1">{editingStaff.fullName}</p>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-on-surface mb-2">Tên đầy đủ</label>
                  <input
                    type="text"
                    name="fullName"
                    value={editFormData.fullName}
                    onChange={handleEditChange}
                    className="w-full px-4 py-3 bg-surface-container-low border-0 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-on-surface mb-2">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={editFormData.email}
                    onChange={handleEditChange}
                    className="w-full px-4 py-3 bg-surface-container-low border-0 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-on-surface mb-2">Số điện thoại</label>
                  <input
                    type="tel"
                    name="phone"
                    value={editFormData.phone}
                    onChange={handleEditChange}
                    className="w-full px-4 py-3 bg-surface-container-low border-0 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-on-surface mb-2">Trạng thái</label>
                  <select
                    name="status"
                    value={editFormData.status}
                    onChange={handleEditChange}
                    className="w-full px-4 py-3 bg-surface-container-low border-0 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="active">Hoạt động</option>
                    <option value="inactive">Không hoạt động</option>
                    <option value="banned">Bị chặn</option>
                  </select>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingStaff(null);
                    }}
                    className="flex-1 px-6 py-3 border-2 border-blue-500 text-blue-500 rounded-lg font-bold hover:bg-blue-50 transition-all"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-lg font-bold hover:bg-blue-600 transition-all"
                  >
                    Lưu
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-primary">{staff.length}</p>
            <p className="text-xs text-on-surface-variant">Tổng nhân viên</p>
          </div>
          <div className="bg-white rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-red-600">{staff.filter((s) => s.role === "admin").length}</p>
            <p className="text-xs text-on-surface-variant">Quản trị</p>
          </div>
          <div className="bg-white rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{staff.filter((s) => s.role === "operator").length}</p>
            <p className="text-xs text-on-surface-variant">Điều hành</p>
          </div>
          <div className="bg-white rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{staff.filter((s) => s.role === "accountant").length}</p>
            <p className="text-xs text-on-surface-variant">Kế toán</p>
          </div>
          <div className="bg-white rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-purple-600">{staff.filter((s) => s.role === "support").length}</p>
            <p className="text-xs text-on-surface-variant">Hỗ trợ</p>
          </div>
        </div>
      </div>
    </div>
  );
}
