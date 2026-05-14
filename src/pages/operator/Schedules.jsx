import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getTripSchedules, createTripSchedule, updateTripSchedule, deleteTripSchedule, getRoutes } from "../../api/operator";
import { useToast } from "../../context/ToastContext";
import ActionIconButton from "./ActionIconButton";

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
      addToast({
        type: "error",
        title: "Không tải được lịch biểu",
        message: "Dữ liệu tuyến và lịch biểu chưa thể hiển thị. Hãy thử lại sau.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Validation
      if (!formData.routeId) {
        addToast({
          type: "warning",
          title: "Chưa chọn tuyến đường",
          message: "Chọn một tuyến trước khi tạo lịch biểu.",
        });
        return;
      }
      if (!formData.departureTime) {
        addToast({
          type: "warning",
          title: "Thiếu giờ khởi hành",
          message: "Nhập thời gian xe bắt đầu xuất bến.",
        });
        return;
      }
      if (!formData.startDate) {
        addToast({
          type: "warning",
          title: "Thiếu ngày bắt đầu",
          message: "Chọn ngày đầu tiên lịch biểu có hiệu lực.",
        });
        return;
      }
      if (!formData.endDate) {
        addToast({
          type: "warning",
          title: "Thiếu ngày kết thúc",
          message: "Chọn ngày cuối cùng lịch biểu có hiệu lực.",
        });
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
        addToast({
          type: "success",
          title: "Cập nhật lịch biểu thành công",
        });
      } else {
        await createTripSchedule(payload);
        addToast({
          type: "success",
          title: "Tạo lịch biểu thành công",
        });
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
      addToast({
        type: "error",
        title: "Không lưu được lịch biểu",
        message: err?.response?.data?.message || "Vui lòng kiểm tra dữ liệu lịch biểu và thử lại.",
      });
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    const scheduleToDelete = schedules.find(s => s.id === id);
    
    if (window.confirm(`Xóa lịch biểu #${id} - ${scheduleToDelete?.fromLocation} → ${scheduleToDelete?.toLocation}?`)) {
      try {
        console.log("🗑️ Deleting schedule:", id);
        await deleteTripSchedule(id);
        addToast({
          type: "success",
          title: "Xóa lịch biểu thành công",
        });
        fetchData();
      } catch (err) {
        console.error("❌ Error deleting schedule:", err);
        const errorMsg = err?.response?.data?.message;
        
        // Check if error is about related trips
        if (err?.response?.status === 500 || errorMsg?.includes("trip") || errorMsg?.includes("foreign")) {
          addToast({
            type: "error",
            title: "Không thể xóa lịch biểu",
            message: "Lịch biểu này vẫn còn chuyến. Hãy xóa hoặc xử lý các chuyến trước.",
          });
        } else {
          addToast({
            type: "error",
            title: "Không xóa được lịch biểu",
            message: errorMsg || "Vui lòng thử lại sau.",
          });
        }
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
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <ActionIconButton
                        icon="pin_drop"
                        label="Điểm dừng"
                        onClick={() => navigate(`/operator/schedules/${schedule.id}/stopping-points`, { state: { schedule } })}
                      />
                      <ActionIconButton
                        icon="directions_bus"
                        label="Chuyến"
                        onClick={() => navigate(`/operator/schedules/${schedule.id}/trips`)}
                      />
                      <ActionIconButton
                        icon="delete"
                        label="Xóa lịch biểu"
                        title="Xóa lịch biểu (xóa tất cả chuyến trước)"
                        onClick={() => handleDelete(schedule.id)}
                      />
                    </div>
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
