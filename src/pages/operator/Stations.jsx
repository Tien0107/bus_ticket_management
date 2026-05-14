import React, { useState, useEffect } from "react";
import { getStations, createStation } from "../../api/operator";
import { useToast } from "../../context/ToastContext";

export default function Stations() {
  const { addToast } = useToast();
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    address: "",
    city: "",
  });

  useEffect(() => {
    fetchStations();
  }, []);

  const fetchStations = async () => {
    try {
      setLoading(true);
      const res = await getStations({ limit: 100 });
      setStations(res.data?.stations || []);
    } catch (err) {
      console.error("❌ Lỗi tải trạm:", err);
      addToast({
        type: "error",
        title: "Không tải được trạm",
        message: "Danh sách trạm chưa thể hiển thị. Hãy thử lại sau.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        // Note: API doesn't have PUT endpoint for stations, so just create new
        await createStation(formData);
        addToast({
          type: "success",
          title: "Cập nhật trạm thành công",
        });
      } else {
        await createStation(formData);
        addToast({
          type: "success",
          title: "Tạo trạm thành công",
        });
      }
      setFormData({ address: "", city: "" });
      setShowForm(false);
      setEditingId(null);
      fetchStations();
    } catch (err) {
      addToast({
        type: "error",
        title: "Không lưu được trạm",
        message: err?.response?.data?.message || "Vui lòng kiểm tra địa chỉ và thành phố.",
      });
    }
  };

  const handleEdit = (station) => {
    setEditingId(station.id);
    setFormData({
      address: station.address,
      city: station.city,
    });
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ address: "", city: "" });
  };

  // Note: API does not support PUT/DELETE for stations, only CREATE

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Quản lý Trạm</h1>
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
          {showForm ? "Hủy" : "+ Trạm mới"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg mb-6 shadow-sm">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Địa chỉ</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                placeholder="VD: 123 Đường Nguyễn Huệ"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Thành phố</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                placeholder="VD: TP. Hồ Chí Minh"
                required
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700">
              {editingId ? "Cập nhật" : "Tạo trạm"}
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
                <th className="px-6 py-3 text-left text-sm font-semibold">Địa chỉ</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Thành phố</th>
              </tr>
            </thead>
            <tbody>
              {stations.map((station) => (
                <tr key={station.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4">{station.address}</td>
                  <td className="px-6 py-4">{station.city}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {stations.length === 0 && (
            <div className="text-center py-8 text-gray-500">Không có trạm nào</div>
          )}
        </div>
      )}
    </div>
  );
}
