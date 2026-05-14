import React, { useState, useEffect } from "react";
import { getRoutes, createRoute, updateRoute } from "../../api/operator";
import { useToast } from "../../context/ToastContext";
import ActionIconButton from "./ActionIconButton";

export default function Routes() {
  const { addToast } = useToast();
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    fromLocation: "",
    toLocation: "",
    distanceKm: 0,
    durationMinutes: 0,
  });

  useEffect(() => {
    fetchRoutes();
  }, []);

  const fetchRoutes = async () => {
    try {
      setLoading(true);
      const res = await getRoutes({ limit: 100 });
      setRoutes(res.data?.routes || []);
    } catch (err) {
      console.error("❌ Lỗi tải tuyến:", err);
      addToast({
        type: "error",
        title: "Không tải được tuyến đường",
        message: "Kiểm tra kết nối hoặc thử tải lại trang.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateRoute(editingId, formData);
        addToast({
          type: "success",
          title: "Cập nhật tuyến thành công",
        });
      } else {
        await createRoute(formData);
        addToast({
          type: "success",
          title: "Tạo tuyến thành công",
        });
      }
      setFormData({ fromLocation: "", toLocation: "", distanceKm: 0, durationMinutes: 0 });
      setShowForm(false);
      setEditingId(null);
      fetchRoutes();
    } catch (err) {
      addToast({
        type: "error",
        title: "Không lưu được tuyến",
        message: err?.response?.data?.message || "Vui lòng kiểm tra dữ liệu tuyến và thử lại.",
      });
    }
  };

  const handleEdit = (route) => {
    setEditingId(route.id);
    setFormData({
      fromLocation: route.fromLocation,
      toLocation: route.toLocation,
      distanceKm: route.distanceKm,
      durationMinutes: route.durationMinutes,
    });
    setShowForm(true);
  };

  // Note: API does not support DELETE for routes

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ fromLocation: "", toLocation: "", distanceKm: 0, durationMinutes: 0 });
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Quản lý Tuyến Đường</h1>
        <button
          onClick={() => {
            if (editingId) {
              handleCancel();
            } else {
              setShowForm(!showForm);
            }
          }}
          className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90"
        >
          {showForm ? "Hủy" : "+ Tuyến mới"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg mb-6 shadow-sm">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Từ địa điểm</label>
              <input
                type="text"
                value={formData.fromLocation}
                onChange={(e) => setFormData({ ...formData, fromLocation: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                placeholder="VD: Hà Nội"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Tới địa điểm</label>
              <input
                type="text"
                value={formData.toLocation}
                onChange={(e) => setFormData({ ...formData, toLocation: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                placeholder="VD: TP. Hồ Chí Minh"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Khoảng cách (km)</label>
              <input
                type="number"
                value={formData.distanceKm}
                onChange={(e) => setFormData({ ...formData, distanceKm: parseFloat(e.target.value) })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Thời gian (phút)</label>
              <input
                type="number"
                value={formData.durationMinutes}
                onChange={(e) => setFormData({ ...formData, durationMinutes: parseInt(e.target.value) })}
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
                onClick={handleCancel}
                className="bg-gray-400 text-white px-6 py-2 rounded-lg hover:bg-gray-500"
              >
                Hủy chỉnh sửa
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
                <th className="px-6 py-3 text-left text-sm font-semibold">Từ</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Tới</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Khoảng cách</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Thời gian</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {routes.map((route) => (
                <tr key={route.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4">{route.fromLocation}</td>
                  <td className="px-6 py-4">{route.toLocation}</td>
                  <td className="px-6 py-4">{route.distanceKm} km</td>
                  <td className="px-6 py-4">{route.durationMinutes} phút</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <ActionIconButton
                        icon="edit_square"
                        label="Sửa tuyến"
                        onClick={() => handleEdit(route)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {routes.length === 0 && (
            <div className="text-center py-8 text-gray-500">Không có tuyến nào</div>
          )}
        </div>
      )}
    </div>
  );
}
