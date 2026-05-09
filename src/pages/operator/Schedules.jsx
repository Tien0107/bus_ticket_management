import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getTripSchedules, createTripSchedule, updateTripSchedule, deleteTripSchedule, getRoutes } from "../../api/operator";
import { useToast } from "../../context/ToastContext";

export default function Schedules() {
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    routeId: "",
    companyId: 1,
    departureTime: "06:00",
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    status: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [schedulesRes, routesRes] = await Promise.all([
        getTripSchedules({ limit: 100, orderBy: 'asc' }),
        getRoutes({ limit: 100 }),
      ]);
      setSchedules(schedulesRes.data?.trip || []);
      setRoutes(routesRes.data?.routes || []);
    } catch (err) {
      console.error("❌ Lỗi tải dữ liệu:", err);
      addToast("Không thể tải dữ liệu", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Validation
      if (!formData.routeId) {
        addToast("Vui lòng chọn tuyến đường", "error");
        return;
      }
      if (!formData.departureTime) {
        addToast("Vui lòng nhập giờ khởi hành", "error");
        return;
      }
      if (!formData.startDate) {
        addToast("Vui lòng nhập ngày bắt đầu", "error");
        return;
      }
      if (!formData.endDate) {
        addToast("Vui lòng nhập ngày kết thúc", "error");
        return;
      }

      const payload = {
        routeId: parseInt(formData.routeId),
        companyId: 1,
        departureTime: formData.departureTime,
        startDate: formData.startDate,
        endDate: formData.endDate,
        status: formData.status,
      };

      if (editingId) {
        await updateTripSchedule(editingId, payload);
        addToast("Cập nhật lịch biểu thành công", "success");
      } else {
        await createTripSchedule(payload);
        addToast("Tạo lịch biểu mới thành công", "success");
      }
      setFormData({
        routeId: "",
        companyId: 1,
        departureTime: "06:00",
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        status: true,
      });
      setShowForm(false);
      setEditingId(null);
      fetchData();
    } catch (err) {
      addToast(err?.response?.data?.message || "Lỗi khi lưu lịch biểu", "error");
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Xóa lịch biểu này?")) {
      try {
        await deleteTripSchedule(id);
        addToast("Xóa lịch biểu thành công", "success");
        fetchData();
      } catch (err) {
        addToast("Lỗi khi xóa lịch biểu", "error");
      }
    }
  };

  const handleEdit = (schedule) => {
    setEditingId(schedule.id);
    // Note: API doesn't return startDate/endDate in list, so we can only edit other fields
    setFormData({
      routeId: schedule.id,
      companyId: 1,
      departureTime: schedule.departureTime || "06:00",
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      status: true,
    });
    setShowForm(true);
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Quản lý Lịch Biểu</h1>
        <button
          onClick={() => {
            if (editingId) {
              setShowForm(false);
              setEditingId(null);
              setFormData({
                routeId: "",
                companyId: 1,
                departureTime: "06:00",
                startDate: new Date().toISOString().split('T')[0],
                endDate: new Date().toISOString().split('T')[0],
                status: true,
              });
            } else {
              setShowForm(!showForm);
            }
          }}
          className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90"
        >
          {showForm ? "Hủy" : "+ Lịch biểu mới"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg mb-6 shadow-sm">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Tuyến Đường *</label>
              <select
                value={formData.routeId}
                onChange={(e) => setFormData({ ...formData, routeId: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                required
              >
                <option value="">-- Chọn tuyến đường --</option>
                {routes.map((route) => (
                  <option key={route.id} value={route.id}>
                    {route.fromLocation} → {route.toLocation} ({route.distanceKm}km)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Giờ khởi hành *</label>
              <input
                type="time"
                value={formData.departureTime}
                onChange={(e) => setFormData({ ...formData, departureTime: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Ngày bắt đầu *</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Ngày kết thúc *</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                required
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700">
              {editingId ? "Cập nhật" : "Tạo"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  setFormData({
                    routeId: "",
                    companyId: 1,
                    departureTime: "06:00",
                    startDate: new Date().toISOString().split('T')[0],
                    endDate: new Date().toISOString().split('T')[0],
                    status: true,
                  });
                }}
                className="bg-gray-400 text-white px-6 py-2 rounded-lg hover:bg-gray-500"
              >
                Hủy
              </button>
            )}
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-center py-8">Đang tải...</div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold">Tuyến</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Giờ khởi hành</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Công ty</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Khoảng cách</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {schedules.map((schedule) => (
                <tr key={schedule.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4">
                    {schedule.fromLocation} → {schedule.toLocation}
                  </td>
                  <td className="px-6 py-4">{schedule.departureTime}</td>
                  <td className="px-6 py-4">{schedule.name}</td>
                  <td className="px-6 py-4">{schedule.distanceKm} km</td>
                  <td className="px-6 py-4 space-x-2 flex">
                    <button
                      onClick={() => navigate(`/operator/schedules/${schedule.id}/stopping-points`)}
                      className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                    >
                      Điểm dừng
                    </button>
                    <button
                      onClick={() => navigate(`/operator/schedules/${schedule.id}/trips`)}
                      className="text-purple-600 hover:text-purple-800 font-medium text-sm"
                    >
                      Chuyến
                    </button>
                    <button
                      onClick={() => handleDelete(schedule.id)}
                      className="text-red-600 hover:text-red-800 font-medium text-sm"
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {schedules.length === 0 && (
            <div className="text-center py-8 text-gray-500">Không có lịch biểu nào</div>
          )}
        </div>
      )}
    </div>
  );
}
