import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getTrips, updateTrip } from "../../api/operator";
import { useToast } from "../../context/ToastContext";

export default function Trips() {
  const { scheduleId } = useParams();
  const { showToast } = useToast();

  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filterStatus, setFilterStatus] = useState("--");
  const [filterDate, setFilterDate] = useState("");
  const [formData, setFormData] = useState({
    status: "scheduled",
    vehicleId: "",
    driverId: "",
  });

  useEffect(() => {
    if (scheduleId) {
      fetchTrips();
    }
  }, [scheduleId, filterStatus, filterDate]);

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
      showToast("Lỗi khi tải dữ liệu chuyến", "error");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!editingId) {
        showToast("Vui lòng chọn chuyến để cập nhật", "error");
        return;
      }

      const payload = {
        status: formData.status,
        vehicleId: formData.vehicleId ? parseInt(formData.vehicleId) : null,
        driverId: formData.driverId ? parseInt(formData.driverId) : null,
        scheduleId: parseInt(scheduleId),
      };

      await updateTrip(scheduleId, editingId, payload);
      showToast("Cập nhật chuyến thành công", "success");
      fetchTrips();
      resetForm();
    } catch (error) {
      showToast(error?.response?.data?.message || "Lỗi khi cập nhật", "error");
      console.error(error);
    }
  };

  const resetForm = () => {
    setFormData({
      status: "scheduled",
      vehicleId: "",
      driverId: "",
    });
    setEditingId(null);
  };

  const handleEdit = (trip) => {
    setEditingId(trip.id);
    setFormData({
      status: trip.status || "scheduled",
      vehicleId: "",
      driverId: "",
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
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Quản lý Chuyến (Lịch biểu #{scheduleId})</h1>

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
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Cập nhật Chuyến #{editingId}</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
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
                    <button
                      onClick={() => handleEdit(trip)}
                      className={`font-medium ${
                        editingId === trip.id
                          ? "text-gray-400 cursor-default"
                          : "text-blue-600 hover:text-blue-800"
                      }`}
                      disabled={editingId === trip.id}
                    >
                      {editingId === trip.id ? "Đang sửa" : "Sửa"}
                    </button>
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
