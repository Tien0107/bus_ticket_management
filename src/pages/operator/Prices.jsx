import React, { useState, useEffect } from "react";
import { getTripPrices, createTripPrice, updateTripPrice, deleteTripPrice, getRoutes, getStations, getVehicles } from "../../api/operator";
import { useToast } from "../../context/ToastContext";
import ActionIconButton from "./ActionIconButton";

export default function Prices() {
  const { addToast } = useToast();
  const [prices, setPrices] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [stations, setStations] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    routeId: 0,
    fromStationId: 0,
    toStationId: 0,
    price: 0,
    status: true,
  });

  useEffect(() => {
    fetchPrices();
    fetchRoutes();
    fetchStations();
    fetchVehicles();
  }, []);

  const fetchPrices = async () => {
    try {
      setLoading(true);
      const res = await getTripPrices({ limit: 100 });
      setPrices(res.data?.prices || []);
    } catch (err) {
      console.error("❌ Lỗi tải bảng giá:", err);
      addToast({
        type: "error",
        title: "Không tải được bảng giá",
        message: "Dữ liệu giá vé chưa thể hiển thị. Hãy thử lại sau.",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRoutes = async () => {
    try {
      const res = await getRoutes({ limit: 100 });
      setRoutes(res?.data?.routes || []);
    } catch (err) {
      console.error("❌ Lỗi tải tuyến đường:", err);
    }
  };

  const fetchStations = async () => {
    try {
      const res = await getStations({ limit: 100 });
      setStations(res?.data?.stations || []);
    } catch (err) {
      console.error("❌ Lỗi tải ga/trạm:", err);
    }
  };

  const fetchVehicles = async () => {
    try {
      const res = await getVehicles({ limit: 100, status: "active" });
      setVehicles(res?.data?.vehicles || []);
    } catch (err) {
      console.error("❌ Lỗi tải danh sách xe:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Validate required fields
      if (!formData.routeId || !formData.fromStationId || !formData.toStationId || !formData.price) {
        addToast({
          type: "warning",
          title: "Thiếu thông tin bảng giá",
          message: "Chọn tuyến, trạm đi, trạm đến và nhập giá vé.",
        });
        return;
      }

      const payload = {
        routeId: parseInt(formData.routeId),
        fromStationId: parseInt(formData.fromStationId),
        toStationId: parseInt(formData.toStationId),
        price: parseFloat(formData.price),
        status: formData.status,
      };

      if (editingId) {
        await updateTripPrice(editingId, payload);
        addToast({
          type: "success",
          title: "Cập nhật bảng giá thành công",
        });
      } else {
        await createTripPrice(payload);
        addToast({
          type: "success",
          title: "Tạo bảng giá thành công",
        });
      }
      setFormData({ routeId: 0, fromStationId: 0, toStationId: 0, price: 0, status: true });
      setShowForm(false);
      setEditingId(null);
      fetchPrices();
    } catch (err) {
      console.error("❌ Error saving price:", err);
      addToast({
        type: "error",
        title: "Không lưu được bảng giá",
        message: err?.response?.data?.message || "Vui lòng kiểm tra dữ liệu giá vé và thử lại.",
      });
    }
  };

  const handleDelete = async (id) => {
    const priceToDelete = prices.find(p => p.id === id);
    if (window.confirm(`Xóa bảng giá từ ${priceToDelete?.fromStationAddress} → ${priceToDelete?.toStationAddress}?`)) {
      try {
        console.log("🗑️ Deleting price:", id);
        await deleteTripPrice(id);
        addToast({
          type: "success",
          title: "Xóa bảng giá thành công",
        });
        fetchPrices();
      } catch (err) {
        console.error("❌ Error deleting price:", err);
        addToast({
          type: "error",
          title: "Không xóa được bảng giá",
          message: err?.response?.data?.message || "Bảng giá có thể đang được sử dụng.",
        });
      }
    }
  };

  const handleEdit = (price) => {
    setEditingId(price.id);
    setFormData({
      routeId: price.routeId,
      fromStationId: price.fromStationId,
      toStationId: price.toStationId,
      price: price.price,
      status: price.status,
    });
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ routeId: 0, fromStationId: 0, toStationId: 0, price: 0, status: true });
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Quản lý Bảng Giá</h1>
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
          {showForm ? "Hủy" : "+ Giá mới"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg mb-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">{editingId ? "Cập nhật Giá" : "Tạo Giá Mới"}</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Tuyến Đường *</label>
              <select
                value={formData.routeId}
                onChange={(e) => setFormData({ ...formData, routeId: parseInt(e.target.value) })}
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
              <label className="block text-sm font-medium mb-2">Giá (VND) *</label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                placeholder="0"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Từ Ga/Trạm *</label>
              <select
                value={formData.fromStationId}
                onChange={(e) => setFormData({ ...formData, fromStationId: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                required
              >
                <option value="">-- Chọn ga/trạm xuất phát --</option>
                {stations.map((station) => (
                  <option key={station.id} value={station.id}>
                    {station.address} ({station.city})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Đến Ga/Trạm *</label>
              <select
                value={formData.toStationId}
                onChange={(e) => setFormData({ ...formData, toStationId: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                required
              >
                <option value="">-- Chọn ga/trạm đến --</option>
                {stations.map((station) => (
                  <option key={station.id} value={station.id}>
                    {station.address} ({station.city})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4">
            <p className="text-sm text-blue-700">
              <strong>💡 Tip:</strong> Xe khả dụng: {vehicles.length} chiếc | 
              Tuyến: {routes.length} | Ga/Trạm: {stations.length}
            </p>
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
                <th className="px-6 py-3 text-left text-sm font-semibold">Giá</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {prices.map((price) => (
                <tr key={price.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4">{price.fromStationAddress}</td>
                  <td className="px-6 py-4">{price.toStationAddress}</td>
                  <td className="px-6 py-4">{price.price.toLocaleString()} VND</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <ActionIconButton
                        icon="edit_square"
                        label="Sửa bảng giá"
                        onClick={() => handleEdit(price)}
                      />
                      <ActionIconButton
                        icon="delete"
                        label="Xóa bảng giá"
                        onClick={() => handleDelete(price.id)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {prices.length === 0 && (
            <div className="text-center py-8 text-gray-500">Không có bảng giá nào</div>
          )}
        </div>
      )}
    </div>
  );
}
