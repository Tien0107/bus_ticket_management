import React, { useState, useEffect } from "react";
import { getVehicles, createVehicle, updateVehicle, deleteVehicle, manageSeat, deleteVehicleSeat } from "../../api/company";
import { useToast } from "../../context/ToastContext";

export default function Vehicles() {
  const { addToast } = useToast();

  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [formData, setFormData] = useState({
    vehicleNumber: "",
    type: "seat",
    capacity: 24,
    model: "",
    year: new Date().getFullYear(),
    status: "active",
    description: "",
  });
  const [seats, setSeats] = useState([]);
  const [seatInput, setSeatInput] = useState("");

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const response = await getVehicles();
      setVehicles(Array.isArray(response.data?.vehicles) ? response.data.vehicles : []);
      setError(null);
    } catch (err) {
      console.error("Lỗi tải vehicles:", err);
      setError("Không thể tải danh sách xe");
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleAddSeat = () => {
    if (seatInput.trim()) {
      setSeats([...seats, seatInput]);
      setSeatInput("");
    }
  };

  const handleRemoveSeat = (idx) => {
    setSeats(seats.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Validate type field
      if (formData.type !== "seat" && formData.type !== "bed") {
        addToast("Loại xe phải là 'seat' hoặc 'bed'", "error");
        return;
      }

      // Map field names to API requirements
      const payload = {
        plateNumber: formData.vehicleNumber || "",
        type: formData.type,
        totalSeats: parseInt(formData.capacity) || 24,
        status: formData.status || "active",
        companyId: 1,
      };

      console.log("Payload gửi đi:", payload);

      if (editingVehicle) {
        await updateVehicle(editingVehicle.id, payload);
        addToast("Cập nhật xe thành công", "success");
      } else {
        await createVehicle(payload);
        addToast("Tạo xe mới thành công", "success");
      }

      // Add seats if any
      if (seats.length > 0 && !editingVehicle) {
        // POST seats after creating vehicle
        // This requires the new vehicle ID from response
      }

      setShowModal(false);
      setEditingVehicle(null);
      setSeats([]);
      fetchVehicles();
    } catch (err) {
      console.error("Lỗi lưu xe:", err);
      addToast("Lỗi lưu xe", "error");
    }
  };

  const handleEdit = (vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      vehicleNumber: vehicle.plateNumber || vehicle.vehicleNumber,
      type: vehicle.type,
      capacity: vehicle.totalSeats || vehicle.capacity,
      model: vehicle.model,
      year: vehicle.year,
      status: vehicle.status,
      description: vehicle.description,
    });
    setShowModal(true);
  };

  const handleDelete = async (vehicleId) => {
    if (!window.confirm("Bạn chắc chắn muốn xóa xe này?")) {
      return;
    }
    try {
      await deleteVehicle(vehicleId);
      addToast("Xóa xe thành công", "success");
      fetchVehicles();
    } catch (err) {
      console.error("Lỗi xóa xe:", err);
      addToast("Lỗi xóa xe", "error");
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingVehicle(null);
    setFormData({
      vehicleNumber: "",
      type: "seat",
      capacity: 24,
      model: "",
      year: new Date().getFullYear(),
      status: "active",
      description: "",
    });
    setSeats([]);
    setSeatInput("");
  };

  return (
    <div className="min-h-screen bg-surface p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-extrabold text-on-surface">Quản lý phương tiện</h1>
            <p className="text-on-surface-variant mt-2">Thêm, sửa, hoặc xóa xe của công ty</p>
          </div>
          <button
            onClick={() => {
              setEditingVehicle(null);
              setFormData({
                vehicleNumber: "",
                type: "seat",
                capacity: 24,
                model: "",
                year: new Date().getFullYear(),
                status: "active",
                description: "",
              });
              setShowModal(true);
            }}
            className="px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/80 flex items-center gap-2 transition-all"
          >
            <span className="material-symbols-outlined">add</span>
            <span>Thêm xe</span>
          </button>
        </div>

        {/* Vehicles Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            <p className="text-on-surface-variant mt-4">Đang tải...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-2xl">{error}</div>
        ) : vehicles.length === 0 ? (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-6xl text-on-surface-variant opacity-50">
              directions_bus
            </span>
            <p className="text-on-surface-variant mt-4">Chưa có xe nào</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vehicles.map((vehicle) => (
              <div key={vehicle.id} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-editorial transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-on-surface">{vehicle.plateNumber || vehicle.vehicleNumber}</h3>
                    <p className="text-on-surface-variant text-sm">{vehicle.model}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    vehicle.status === "active"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}>
                    {vehicle.status === "active" ? "Hoạt động" : "Không hoạt động"}
                  </span>
                </div>

                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">Loại xe:</span>
                    <span className="font-semibold">{vehicle.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">Sức chứa:</span>
                    <span className="font-semibold">{vehicle.totalSeats || vehicle.capacity} chỗ</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">Năm sản xuất:</span>
                    <span className="font-semibold">{vehicle.year}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(vehicle)}
                    className="flex-1 px-3 py-2 bg-primary/10 text-primary rounded-lg font-semibold hover:bg-primary/20 transition-all flex items-center justify-center gap-1"
                  >
                    <span className="material-symbols-outlined text-lg">edit</span>
                    <span>Sửa</span>
                  </button>
                  <button
                    onClick={() => handleDelete(vehicle.id)}
                    className="flex-1 px-3 py-2 bg-red-100 text-red-600 rounded-lg font-semibold hover:bg-red-200 transition-all flex items-center justify-center gap-1"
                  >
                    <span className="material-symbols-outlined text-lg">delete</span>
                    <span>Xóa</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="sticky top-0 bg-gradient-to-r from-primary to-primary-container text-white p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold">
                  {editingVehicle ? "Chỉnh sửa xe" : "Thêm xe mới"}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="text-white/80 hover:text-white transition-all"
                >
                  <span className="material-symbols-outlined text-2xl">close</span>
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-on-surface mb-2">Biển số xe *</label>
                    <input
                      type="text"
                      name="vehicleNumber"
                      value={formData.vehicleNumber}
                      onChange={handleFormChange}
                      className="w-full px-4 py-2 bg-surface-container-low border-0 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                      placeholder="29A-12345"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-on-surface mb-2">Mẫu xe *</label>
                    <input
                      type="text"
                      name="model"
                      value={formData.model}
                      onChange={handleFormChange}
                      className="w-full px-4 py-2 bg-surface-container-low border-0 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                      placeholder="Thaco Town"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-on-surface mb-2">Loại xe</label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleFormChange}
                      className="w-full px-4 py-2 bg-surface-container-low border-0 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    >
                      <option value="seat">Ghế ngồi (Seat)</option>
                      <option value="bed">Giường nằm (Bed)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-on-surface mb-2">Sức chứa</label>
                    <input
                      type="number"
                      name="capacity"
                      value={formData.capacity}
                      onChange={handleFormChange}
                      className="w-full px-4 py-2 bg-surface-container-low border-0 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-on-surface mb-2">Năm sản xuất</label>
                    <input
                      type="number"
                      name="year"
                      value={formData.year}
                      onChange={handleFormChange}
                      className="w-full px-4 py-2 bg-surface-container-low border-0 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-on-surface mb-2">Trạng thái</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleFormChange}
                    className="w-full px-4 py-2 bg-surface-container-low border-0 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  >
                    <option value="active">Hoạt động</option>
                    <option value="inactive">Không hoạt động</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-on-surface mb-2">Ghi chú</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleFormChange}
                    className="w-full px-4 py-2 bg-surface-container-low border-0 rounded-lg focus:ring-2 focus:ring-primary outline-none resize-none"
                    rows="3"
                    placeholder="Thêm ghi chú về xe..."
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 px-6 py-3 border-2 border-primary text-primary rounded-lg font-bold hover:bg-primary/10 transition-all"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-primary text-white rounded-lg font-bold hover:bg-primary/80 transition-all"
                  >
                    {editingVehicle ? "Cập nhật" : "Thêm xe"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
