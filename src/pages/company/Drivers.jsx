import React, { useState, useEffect } from "react";
import { getDrivers, updateStaff } from "../../api/company";
import { useToast } from "../../context/ToastContext";

export default function Drivers() {
  const { addToast } = useToast();

  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    fetchDrivers();
  }, [filterStatus]);

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const params = {
        status: filterStatus !== "all" ? filterStatus : undefined,
        limit: 100,
      };
      Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);
      
      const response = await getDrivers(params);
      setDrivers(Array.isArray(response.data?.drivers) ? response.data.drivers : []);
      setError(null);
    } catch (err) {
      console.error("Lỗi tải danh sách tài xế:", err);
      setError("Không thể tải danh sách tài xế");
    } finally {
      setLoading(false);
    }
  };

  const filteredDrivers = drivers.filter((driver) => {
    const matchesSearch =
      driver.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.phone?.includes(searchTerm);
    const matchesStatus = filterStatus === "all" || driver.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    const colorMap = {
      active: "bg-green-100 text-green-700",
      inactive: "bg-red-100 text-red-700",
      on_leave: "bg-yellow-100 text-yellow-700",
      suspended: "bg-gray-100 text-gray-700",
    };
    return colorMap[status] || colorMap.inactive;
  };

  const getStatusLabel = (status) => {
    const labelMap = {
      active: "Hoạt động",
      inactive: "Không hoạt động",
      on_leave: "Nghỉ phép",
      suspended: "Tạm ngừng",
    };
    return labelMap[status] || status;
  };

  const handleOpenEditModal = () => {
    setEditFormData({
      fullName: selectedDriver.fullName,
      email: selectedDriver.email,
      phone: selectedDriver.phone,
      status: selectedDriver.status,
    });
    setShowEditModal(true);
  };

  const handleEditChange = (field, value) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveEdit = async () => {
    if (!editFormData.fullName?.trim() || !editFormData.email?.trim() || !editFormData.phone?.trim()) {
      addToast("Vui lòng điền đầy đủ thông tin", "error");
      return;
    }

    try {
      setEditLoading(true);
      await updateStaff(selectedDriver.id, editFormData);
      addToast("Cập nhật thông tin tài xế thành công", "success");
      setShowEditModal(false);
      // Update selected driver with new data
      setSelectedDriver(prev => ({
        ...prev,
        ...editFormData
      }));
      // Refresh drivers list
      fetchDrivers();
    } catch (err) {
      console.error("Lỗi cập nhật:", err);
      addToast("Cập nhật thông tin thất bại", "error");
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface p-3 sm:p-6 lg:p-8">
      <div className="max-w-4xl sm:max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-on-surface">Quản lý tài xế</h1>
            <p className="text-sm sm:text-base text-on-surface-variant mt-1 sm:mt-2">Danh sách tất cả tài xế của công ty</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg sm:rounded-2xl p-3 sm:p-6 shadow-sm mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
                search
              </span>
              <input
                type="text"
                placeholder="Tìm tài xế (tên, email, SĐT)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-surface-container-low border-0 rounded-xl focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-3 bg-surface-container-low border-0 rounded-xl focus:ring-2 focus:ring-primary outline-none"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Hoạt động</option>
              <option value="inactive">Không hoạt động</option>
              <option value="on_leave">Nghỉ phép</option>
              <option value="suspended">Tạm ngừng</option>
            </select>
          </div>
        </div>

        {/* Drivers Table */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            <p className="text-on-surface-variant mt-4">Đang tải...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-2xl">{error}</div>
        ) : filteredDrivers.length === 0 ? (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-6xl text-on-surface-variant opacity-50">
              person_off
            </span>
            <p className="text-on-surface-variant mt-4">Không tìm thấy tài xế nào</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-surface-container-low border-b border-outline-variant/20">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-bold text-on-surface">Tên</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-on-surface">Email</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-on-surface">SĐT</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-on-surface">Trạng thái</th>
                    <th className="px-6 py-4 text-center text-sm font-bold text-on-surface">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {filteredDrivers.map((driver) => (
                    <tr key={driver.id} className="hover:bg-surface-container-low transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary-container rounded-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-primary">person</span>
                          </div>
                          <p className="font-semibold text-on-surface">{driver.fullName}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-on-surface">{driver.email}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-on-surface">{driver.phone}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(driver.status)}`}>
                          {driver.status === "active" ? "Hoạt động" : driver.status === "inactive" ? "Không hoạt động" : "Tạm ngừng"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => {
                            setSelectedDriver(driver);
                            setShowDetailModal(true);
                          }}
                          className="text-primary hover:text-primary/80 font-bold text-sm"
                        >
                          Xem chi tiết
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="mt-4 sm:mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 text-center">
            <p className="text-xl sm:text-2xl font-bold text-primary">{drivers.length}</p>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-1\">Tổng tài xế</p>
          </div>
          <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 text-center">
            <p className="text-xl sm:text-2xl font-bold text-green-600">{drivers.filter((d) => d.status === "active").length}</p>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-1\">Hoạt động</p>
          </div>
          <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 text-center">
            <p className="text-xl sm:text-2xl font-bold text-red-600\">{drivers.filter((d) => d.status === "inactive").length}</p>
            <p className="text-sm text-on-surface-variant">Không hoạt động</p>
          </div>
        </div>

        {/* Driver Detail Modal */}
        {showDetailModal && selectedDriver && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl">
              {/* Header */}
              <div className="bg-gradient-to-r from-primary to-primary-container text-white p-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Chi tiết tài xế</h2>
                  <p className="text-white/80 mt-1">{selectedDriver.fullName}</p>
                </div>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedDriver(null);
                  }}
                  className="text-white/80 hover:text-white text-2xl"
                >
                  ✕
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Basic Info */}
                <div>
                  <h3 className="text-lg font-bold text-on-surface mb-4">Thông tin cơ bản</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-on-surface-variant font-medium mb-1">Tên đầy đủ</p>
                      <p className="text-on-surface font-semibold">{selectedDriver.fullName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-on-surface-variant font-medium mb-1">ID</p>
                      <p className="text-on-surface font-semibold">{selectedDriver.id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-on-surface-variant font-medium mb-1">Email</p>
                      <p className="text-on-surface font-semibold">{selectedDriver.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-on-surface-variant font-medium mb-1">Số điện thoại</p>
                      <p className="text-on-surface font-semibold">{selectedDriver.phone}</p>
                    </div>
                  </div>
                </div>

                {/* Status Info */}
                <div className="border-t border-outline-variant/20 pt-6">
                  <h3 className="text-lg font-bold text-on-surface mb-4">Trạng thái</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-on-surface-variant font-medium mb-2">Trạng thái hiện tại</p>
                      <span className={`px-4 py-2 rounded-full text-sm font-bold inline-block ${getStatusColor(selectedDriver.status)}`}>
                        {getStatusLabel(selectedDriver.status)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-on-surface-variant font-medium mb-1">Chức vụ</p>
                      <p className="text-on-surface font-semibold">{selectedDriver.role || "—"}</p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="border-t border-outline-variant/20 pt-6 flex gap-3">
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      setSelectedDriver(null);
                    }}
                    className="flex-1 px-6 py-3 border-2 border-primary text-primary rounded-xl font-bold hover:bg-primary/10 transition-all"
                  >
                    Đóng
                  </button>
                  <button
                    onClick={handleOpenEditModal}
                    className="flex-1 px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/80 transition-all flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined">edit</span>
                    <span>Sửa thông tin</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Driver Modal */}
        {showEditModal && selectedDriver && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl">
              {/* Header */}
              <div className="bg-gradient-to-r from-primary to-primary-container text-white p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold">Sửa thông tin tài xế</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-white/80 hover:text-white text-2xl"
                >
                  ✕
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-on-surface mb-2">Tên đầy đủ <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={editFormData.fullName || ""}
                    onChange={(e) => handleEditChange("fullName", e.target.value)}
                    className="w-full px-4 py-2 border border-outline rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    placeholder="Nhập tên đầy đủ"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-on-surface mb-2">Email <span className="text-red-500">*</span></label>
                  <input
                    type="email"
                    value={editFormData.email || ""}
                    onChange={(e) => handleEditChange("email", e.target.value)}
                    className="w-full px-4 py-2 border border-outline rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    placeholder="Nhập email"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-on-surface mb-2">Số điện thoại <span className="text-red-500">*</span></label>
                  <input
                    type="tel"
                    value={editFormData.phone || ""}
                    onChange={(e) => handleEditChange("phone", e.target.value)}
                    className="w-full px-4 py-2 border border-outline rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    placeholder="Nhập số điện thoại"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-on-surface mb-2">Trạng thái</label>
                  <select
                    value={editFormData.status || "active"}
                    onChange={(e) => handleEditChange("status", e.target.value)}
                    className="w-full px-4 py-2 border border-outline rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="active">Hoạt động</option>
                    <option value="inactive">Không hoạt động</option>
                    <option value="suspended">Tạm ngừng</option>
                  </select>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-surface p-6 flex gap-3 rounded-b-2xl">
                <button
                  onClick={() => setShowEditModal(false)}
                  disabled={editLoading}
                  className="flex-1 px-6 py-3 border-2 border-primary text-primary rounded-xl font-bold hover:bg-primary/10 transition-all disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={editLoading}
                  className="flex-1 px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/80 transition-all disabled:opacity-50"
                >
                  {editLoading ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
