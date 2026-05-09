import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getStoppingPoints, createStoppingPoint, updateStoppingPoint } from "../../api/operator";
import { getStations } from "../../api/operator";
import { useToast } from "../../context/ToastContext";

export default function StoppingPoints() {
  const { scheduleId } = useParams();
  const { showToast } = useToast();

  const [stoppingPoints, setStoppingPoints] = useState([]);
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    stationId: "",
    allowPickup: true,
    allowDropoff: true,
    stopOrder: "",
  });

  useEffect(() => {
    if (scheduleId) {
      fetchData();
    }
  }, [scheduleId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pointsRes, stationsRes] = await Promise.all([
        getStoppingPoints(scheduleId),
        getStations({ limit: 100 }),
      ]);
      setStoppingPoints(pointsRes?.data?.stoppingPoints || []);
      setStations(stationsRes?.data?.stations || []);
    } catch (error) {
      showToast("Lỗi khi tải dữ liệu", "error");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!formData.stationId || formData.stopOrder === "") {
        showToast("Vui lòng điền đầy đủ thông tin", "error");
        return;
      }

      const payload = {
        stationId: parseInt(formData.stationId),
        allowPickup: formData.allowPickup,
        allowDropoff: formData.allowDropoff,
        stopOrder: parseInt(formData.stopOrder),
        scheduleId: parseInt(scheduleId),
        routeId: 0,
      };

      if (editingId) {
        await updateStoppingPoint(scheduleId, editingId, payload);
        showToast("Cập nhật điểm dừng thành công", "success");
      } else {
        await createStoppingPoint(scheduleId, payload);
        showToast("Thêm điểm dừng thành công", "success");
      }

      fetchData();
      resetForm();
    } catch (error) {
      showToast(error?.response?.data?.message || "Lỗi khi lưu dữ liệu", "error");
      console.error(error);
    }
  };

  const resetForm = () => {
    setFormData({
      stationId: "",
      allowPickup: true,
      allowDropoff: true,
      stopOrder: "",
    });
    setEditingId(null);
  };

  const handleEdit = (point) => {
    setEditingId(point.stationId);
    setFormData({
      stationId: point.stationId,
      allowPickup: point.allowPickup,
      allowDropoff: point.allowDropoff,
      stopOrder: point.stopOrder,
    });
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
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Quản lý Điểm Dừng (Lịch biểu #{scheduleId})</h1>

      {/* Form */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">
          {editingId ? "Cập nhật Điểm Dừng" : "Thêm Điểm Dừng Mới"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trạm</label>
              <select
                value={formData.stationId}
                onChange={(e) => setFormData({ ...formData, stationId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Chọn trạm</option>
                {stations.map((station) => (
                  <option key={station.id} value={station.id}>
                    {station.address} - {station.city}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Thứ tự Dừng</label>
              <input
                type="number"
                value={formData.stopOrder}
                onChange={(e) => setFormData({ ...formData, stopOrder: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="1, 2, 3..."
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.allowPickup}
                onChange={(e) => setFormData({ ...formData, allowPickup: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-gray-700">Cho phép Đón khách</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.allowDropoff}
                onChange={(e) => setFormData({ ...formData, allowDropoff: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-gray-700">Cho phép Trả khách</span>
            </label>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              {editingId ? "Cập nhật" : "Thêm"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 font-medium"
              >
                Hủy
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Thứ tự</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Địa chỉ</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Thành phố</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Đón</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Trả</th>
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
            ) : stoppingPoints.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-4 text-gray-500">
                  Chưa có điểm dừng
                </td>
              </tr>
            ) : (
              stoppingPoints.map((point) => (
                <tr key={point.stationId} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-3 text-gray-900">{point.stopOrder}</td>
                  <td className="px-6 py-3 text-gray-900">{point.address}</td>
                  <td className="px-6 py-3 text-gray-900">{point.city}</td>
                  <td className="px-6 py-3">
                    <span className={point.allowPickup ? "text-green-600 font-medium" : "text-red-600"}>
                      {point.allowPickup ? "✓" : "✗"}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <span className={point.allowDropoff ? "text-green-600 font-medium" : "text-red-600"}>
                      {point.allowDropoff ? "✓" : "✗"}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <button
                      onClick={() => handleEdit(point)}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Sửa
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
