import React, { useState, useEffect } from "react";
import { getDrivers } from "../../api/company";
import { useToast } from "../../context/ToastContext";

export default function Drivers() {
  const { addToast } = useToast();

  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const response = await getDrivers();
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

  return (
    <div className="min-h-screen bg-surface p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold text-on-surface">Quản lý tài xế</h1>
          <p className="text-on-surface-variant mt-2">Danh sách tất cả tài xế của công ty</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <th className="px-6 py-4 text-left text-sm font-bold text-on-surface">Bằng lái</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-on-surface">Xe</th>
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
                          <div>
                            <p className="font-semibold text-on-surface">{driver.fullName}</p>
                            <p className="text-xs text-on-surface-variant">ID: {driver.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-on-surface">{driver.email}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-on-surface">{driver.phone}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-on-surface font-mono">{driver.licenseNumber}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-on-surface">{driver.vehicleNumber || "—"}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(driver.status)}`}>
                          {driver.status === "active" ? "Hoạt động" : 
                           driver.status === "inactive" ? "Không hoạt động" :
                           driver.status === "on_leave" ? "Nghỉ phép" : "Tạm ngừng"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button className="text-primary hover:text-primary/80 font-bold text-sm">Xem chi tiết</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Stats Footer */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-primary">{drivers.length}</p>
            <p className="text-sm text-on-surface-variant">Tổng tài xế</p>
          </div>
          <div className="bg-white rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{drivers.filter((d) => d.status === "active").length}</p>
            <p className="text-sm text-on-surface-variant">Hoạt động</p>
          </div>
          <div className="bg-white rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-yellow-600">{drivers.filter((d) => d.status === "on_leave").length}</p>
            <p className="text-sm text-on-surface-variant">Nghỉ phép</p>
          </div>
          <div className="bg-white rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-red-600">{drivers.filter((d) => d.status === "inactive" || d.status === "suspended").length}</p>
            <p className="text-sm text-on-surface-variant">Không hoạt động</p>
          </div>
        </div>
      </div>
    </div>
  );
}
