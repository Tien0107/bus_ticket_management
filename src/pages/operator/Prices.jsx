import React, { useState, useEffect } from "react";
import { getTripPrices, createTripPrice, updateTripPrice, deleteTripPrice } from "../../api/operator";
import { useToast } from "../../context/ToastContext";

export default function Prices() {
  const { addToast } = useToast();
  const [prices, setPrices] = useState([]);
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
  }, []);

  const fetchPrices = async () => {
    try {
      setLoading(true);
      const res = await getTripPrices({ limit: 100 });
      setPrices(res.data?.prices || []);
    } catch (err) {
      console.error("❌ Lỗi tải bảng giá:", err);
      addToast("Không thể tải danh sách giá", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateTripPrice(editingId, formData);
        addToast("Cập nhật giá thành công", "success");
      } else {
        await createTripPrice(formData);
        addToast("Tạo giá mới thành công", "success");
      }
      setFormData({ routeId: 0, fromStationId: 0, toStationId: 0, price: 0, status: true });
      setShowForm(false);
      setEditingId(null);
      fetchPrices();
    } catch (err) {
      addToast("Lỗi khi lưu giá", "error");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Xóa bảng giá này?")) {
      try {
        await deleteTripPrice(id);
        addToast("Xóa giá thành công", "success");
        fetchPrices();
      } catch (err) {
        addToast("Lỗi khi xóa giá", "error");
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
          <h3 className="text-lg font-semibold mb-4">{editingId ? "Cập nhật Giá #" + editingId : "Tạo Giá Mới"}</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Route ID</label>
              <input
                type="number"
                value={formData.routeId}
                onChange={(e) => setFormData({ ...formData, routeId: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Giá (VND)</label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">From Station ID</label>
              <input
                type="number"
                value={formData.fromStationId}
                onChange={(e) => setFormData({ ...formData, fromStationId: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">To Station ID</label>
              <input
                type="number"
                value={formData.toStationId}
                onChange={(e) => setFormData({ ...formData, toStationId: parseInt(e.target.value) })}
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
                  <td className="px-6 py-4 space-x-2 flex">
                    <button
                      onClick={() => handleEdit(price)}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(price.id)}
                      className="text-red-600 hover:text-red-800 font-medium"
                    >
                      Xóa
                    </button>
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
