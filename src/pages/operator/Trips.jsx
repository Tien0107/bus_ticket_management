import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getTrips, updateTrip, getVehicles, getDrivers } from "../../api/operator";
import { useToast } from "../../context/ToastContext";
import ActionIconButton from "./ActionIconButton";

export default function Trips() {
  const { scheduleId } = useParams();
  const { addToast } = useToast();

  const [trips, setTrips] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filterStatus, setFilterStatus] = useState("--");
  const [filterDate, setFilterDate] = useState("");
  const [formData, setFormData] = useState({
    routeId: "",
    vehicleId: "",
    driverId: "",
    departureDate: new Date().toISOString().split('T')[0],
    status: "scheduled",
  });

  useEffect(() => {
    if (scheduleId) {
      fetchTrips();
      fetchDrivers();
      fetchVehicles();
    }
  }, [scheduleId, filterStatus, filterDate]);

  // Clear editing state when filters change to prevent stale data
  useEffect(() => {
    if (editingId) {
      resetForm();
    }
  }, [filterStatus, filterDate]);

  const fetchDrivers = async () => {
    try {
      const res = await getDrivers({ limit: 100, status: "active" });
      setDrivers(res?.data?.drivers || []);
    } catch (error) {
      console.error("❌ Lỗi tải danh sách tài xế:", error);
    }
  };

  const fetchVehicles = async () => {
    try {
      const res = await getVehicles({ limit: 100, status: "active" });
      setVehicles(res?.data?.vehicles || []);
    } catch (error) {
      console.error("❌ Lỗi tải danh sách xe:", error);
    }
  };

  const fetchTrips = async () => {
    try {
      setLoading(true);
      const params = {
        limit: 100,
        orderBy: "asc",
      };
      if (filterStatus !== "--") {
        params.status = filterStatus;
      }
      if (filterDate) {
        params.date = filterDate;
      }
      const res = await getTrips(scheduleId, params);
      setTrips(res?.data?.trips || []);
    } catch (error) {
      addToast({
        type: "error",
        title: "Không tải được chuyến",
        message: "Danh sách chuyến chưa thể hiển thị. Hãy thử lại sau.",
      });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!editingId) {
        addToast({
          type: "warning",
          title: "Chưa chọn chuyến",
          message: "Chọn một chuyến trong bảng trước khi cập nhật.",
        });
        return;
      }

      // Validate required fields
      if (!formData.driverId || !formData.vehicleId) {
        addToast({
          type: "warning",
          title: "Thiếu tài xế hoặc xe",
          message: "Chọn đủ tài xế và xe trước khi lưu chuyến.",
        });
        return;
      }

      const payload = {
        routeId: formData.routeId ? parseInt(formData.routeId) : undefined,
        vehicleId: parseInt(formData.vehicleId),
        driverId: parseInt(formData.driverId),
        scheduleId: parseInt(scheduleId),
        departureDate: formData.departureDate || new Date().toISOString(),
        status: formData.status,
      };

      console.log("🔄 Updating trip:", { scheduleId, tripId: editingId, payload });

      await updateTrip(scheduleId, editingId, payload);
      addToast({
        type: "success",
        title: "Cập nhật chuyến thành công",
      });
      fetchTrips();
      resetForm();
    } catch (error) {
      console.error("❌ Error updating trip:", error);
      addToast({
        type: "error",
        title: "Không cập nhật được chuyến",
        message: error?.response?.data?.message || "Vui lòng kiểm tra dữ liệu chuyến và thử lại.",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      routeId: "",
      vehicleId: "",
      driverId: "",
      departureDate: new Date().toISOString().split('T')[0],
      status: "scheduled",
    });
    setEditingId(null);
  };

  const handleEdit = (trip) => {
    // If already editing a different trip, confirm before switching
    if (editingId && editingId !== trip.id) {
      if (!window.confirm("Bạn đang chỉnh sửa chuyến khác. Hủy để sang chuyến mới?")) {
        return;
      }
    }
    
    setEditingId(trip.id);
    setFormData({
      routeId: trip.routeId || "",
      vehicleId: trip.vehicleId || "",
      driverId: trip.driverId || "",
      departureDate: trip.departureDate ? trip.departureDate.split('T')[0] : new Date().toISOString().split('T')[0],
      status: trip.status || "scheduled",
    });
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      scheduled: "bg-blue-100 text-blue-800",
      running: "bg-yellow-100 text-yellow-800",
      completed: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return statusMap[status] || "bg-gray-100 text-gray-800";
  };

  if (!scheduleId) {
    return (
      <div className="p-6 bg-red-50 rounded-lg">
        <p className="text-red-600">Vui lòng chọn lịch biểu trước</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Quản lý Chuyến</h1>

      {/* Filter & Update Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Filter Status */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Lọc theo Trạng thái</h2>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="--">Tất cả</option>
            <option value="scheduled">Sắp khởi hành</option>
            <option value="running">Đang chạy</option>
            <option value="completed">Hoàn thành</option>
            <option value="cancelled">Hủy</option>
          </select>
        </div>

        {/* Filter Date */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Lọc theo Ngày</h2>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Update Form */}
        {editingId && (
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
            <h2 className="text-lg font-semibold text-gray-700 mb-2">Cập nhật Chuyến</h2>
            <p className="text-xs text-gray-500 mb-4">
              ⚠️ {trips.find(t => t.id === editingId) ? "Chuyến tồn tại" : "❌ Chuyến không tìm thấy!"}
            </p>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tài xế</label>
                <select
                  value={formData.driverId}
                  onChange={(e) => setFormData({ ...formData, driverId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">-- Chọn tài xế --</option>
                  {drivers.map((driver) => (
                    <option key={driver.id} value={driver.id}>
                      {driver.fullName} ({driver.phone})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Xe</label>
                <select
                  value={formData.vehicleId}
                  onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">-- Chọn xe --</option>
                  {vehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.plateNumber} ({vehicle.totalSeats} ghế, loại {vehicle.type})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="scheduled">Sắp khởi hành</option>
                  <option value="running">Đang chạy</option>
                  <option value="completed">Hoàn thành</option>
                  <option value="cancelled">Hủy</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                  disabled={!trips.find(t => t.id === editingId)}
                >
                  Cập nhật
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 font-medium"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Trips Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Chuyến ID</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Tuyến</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Xe</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Số ghế</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Trạng thái</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="text-center py-4 text-gray-500">
                  Đang tải...
                </td>
              </tr>
            ) : trips.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-4 text-gray-500">
                  Không có chuyến nào
                </td>
              </tr>
            ) : (
              trips.map((trip) => (
                <tr key={trip.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-3 text-gray-900 font-medium">#{trip.id}</td>
                  <td className="px-6 py-3 text-gray-900">
                    <div className="text-sm">
                      {trip.fromLocation} → {trip.toLocation}
                    </div>
                    <div className="text-xs text-gray-500">{trip.distanceKm}km</div>
                  </td>
                  <td className="px-6 py-3">
                    <div className="text-gray-900">{trip.plateNumber || "N/A"}</div>
                    <div className="text-xs text-gray-500">{trip.companyName}</div>
                  </td>
                  <td className="px-6 py-3 text-gray-900">
                    {trip.totalSeats} ghế ({trip.type})
                  </td>
                  <td className="px-6 py-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(trip.status)}`}>
                      {trip.status === "scheduled"
                        ? "Sắp khởi hành"
                        : trip.status === "running"
                        ? "Đang chạy"
                        : trip.status === "completed"
                        ? "Hoàn thành"
                        : "Hủy"}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-4">
                      <ActionIconButton
                        icon="edit_square"
                        label={editingId === trip.id ? "Đang sửa chuyến" : "Sửa chuyến"}
                        onClick={() => handleEdit(trip)}
                        disabled={editingId === trip.id}
                      />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
