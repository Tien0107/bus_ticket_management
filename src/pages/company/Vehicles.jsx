import React, { useEffect, useMemo, useState } from "react";
import { createVehicle, deleteVehicleSeat, getCompanyInfo, getVehicles, manageSeat, updateVehicle } from "../../api/company";
import { useToast } from "../../context/ToastContext";
import {
  CompanyPageShell,
  EmptyState,
  ErrorState,
  Field,
  IconButton,
  LoadingState,
  ModalShell,
  PrimaryButton,
  SecondaryButton,
  SelectControl,
  StatCard,
  StatusBadge,
  inputClass,
} from "./CompanyUI";

const defaultForm = {
  vehicleNumber: "",
  type: "seat",
  capacity: 24,
  status: "active",
};

const vehicleTypeLabel = {
  seat: "Ghế ngồi",
  bed: "Giường nằm",
};

const vehicleStatusLabel = {
  active: "Hoạt động",
  maintenance: "Bảo trì",
  inactive: "Tạm ngừng",
};

const vehicleStatusTone = {
  active: "emerald",
  maintenance: "amber",
  inactive: "red",
};

const getStoredCompanyId = () => {
  try {
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    return storedUser.companyId || null;
  } catch {
    return null;
  }
};

export default function Vehicles() {
  const { addToast } = useToast();

  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [formData, setFormData] = useState(defaultForm);
  const [companyId, setCompanyId] = useState(getStoredCompanyId());

  useEffect(() => {
    fetchVehicles();
    fetchCompanyId();
  }, []);

  const fetchCompanyId = async () => {
    try {
      const response = await getCompanyInfo();
      const company = response.data?.company || response.data;
      if (company?.id) setCompanyId(company.id);
    } catch {
      // Giữ companyId đã lưu local nếu API hồ sơ công ty không tải được.
    }
  };

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const response = await getVehicles({ limit: 100 });
      setVehicles(Array.isArray(response.data?.vehicles) ? response.data.vehicles : []);
      setError("");
    } catch {
      setError("Không thể tải danh sách xe.");
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const active = vehicles.filter((vehicle) => vehicle.status === "active").length;
    const seats = vehicles.reduce((sum, vehicle) => sum + Number(vehicle.totalSeats || vehicle.capacity || 0), 0);

    return [
      { icon: "directions_bus", label: "Tổng phương tiện", value: vehicles.length, tone: "primary" },
      { icon: "verified", label: "Đang hoạt động", value: active, tone: "emerald" },
      { icon: "event_busy", label: "Tạm ngừng", value: vehicles.length - active, tone: "amber" },
      { icon: "airline_seat_recline_normal", label: "Tổng số ghế", value: seats, tone: "slate" },
    ];
  }, [vehicles]);

  const resetForm = () => {
    setEditingVehicle(null);
    setFormData(defaultForm);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleOpenCreate = () => {
    resetForm();
    setShowModal(true);
  };

  const handleEdit = (vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      vehicleNumber: vehicle.plateNumber || vehicle.vehicleNumber || "",
      type: vehicle.type || "seat",
      capacity: vehicle.totalSeats || vehicle.capacity || 24,
      status: vehicle.status || "active",
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!["seat", "bed"].includes(formData.type)) {
      addToast("Loại xe không hợp lệ", "error");
      return;
    }

    const resolvedCompanyId = companyId || getStoredCompanyId();
    if (!resolvedCompanyId) {
      addToast("Không tìm thấy công ty để lưu xe", "error");
      return;
    }

    try {
      const payload = {
        plateNumber: formData.vehicleNumber.trim(),
        type: formData.type,
        totalSeats: Number.parseInt(formData.capacity, 10) || 24,
        status: formData.status || "active",
        companyId: resolvedCompanyId,
      };

      if (editingVehicle) {
        await updateVehicle(editingVehicle.id, payload);
        addToast("Cập nhật xe thành công", "success");
      } else {
        const createResponse = await createVehicle(payload);
        const vehicleId = createResponse.data?.vehicle?.id;

        if (vehicleId) {
          try {
            await manageSeat({
              vehicleId,
              seatCount: String(payload.totalSeats),
            });
          } catch {
            // Xe vẫn đã được tạo, ghế có thể cấu hình lại sau.
          }
        }

        addToast("Tạo xe mới thành công", "success");
      }

      handleCloseModal();
      fetchVehicles();
    } catch (err) {
      addToast(err.response?.data?.message || "Lỗi lưu xe", "error");
    }
  };

  const handleDeleteSeats = async (vehicleId) => {
    if (!window.confirm("Bạn chắc chắn muốn xóa toàn bộ ghế của xe này?")) return;

    try {
      await deleteVehicleSeat(vehicleId);
      addToast("Xóa ghế xe thành công", "success");
      fetchVehicles();
    } catch (err) {
      addToast(err.response?.data?.message || "Lỗi xóa ghế xe", "error");
    }
  };

  return (
    <CompanyPageShell
      eyebrow="Fleet"
      title="Quản lý phương tiện"
      description="Theo dõi biển số, cấu hình ghế và trạng thái hoạt động của toàn bộ đội xe."
      actions={<IconButton icon="add" label="Thêm xe" variant="primary" onClick={handleOpenCreate} />}
    >
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} />
      ) : vehicles.length === 0 ? (
        <EmptyState icon="directions_bus" title="Chưa có phương tiện" description="Thêm xe đầu tiên để bắt đầu cấu hình đội xe." />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {vehicles.map((vehicle) => {
            const seatCount = vehicle.totalSeats || vehicle.capacity || 0;
            const status = vehicle.status || "inactive";

            return (
              <article key={vehicle.id} className="rounded-xl border border-outline-variant/30 bg-white p-5 shadow-sm transition-all hover:border-primary/40 hover:shadow-md">
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate text-2xl font-extrabold text-on-surface">
                      {vehicle.plateNumber || vehicle.vehicleNumber || "Chưa có biển số"}
                    </p>
                    <p className="mt-1 text-sm text-on-surface-variant">
                      {vehicleTypeLabel[vehicle.type] || vehicle.type || "Chưa phân loại"}
                    </p>
                  </div>
                  <StatusBadge tone={vehicleStatusTone[status] || "slate"}>
                    {vehicleStatusLabel[status] || status}
                  </StatusBadge>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-surface-container-low p-3">
                    <p className="text-xs font-medium text-on-surface-variant">Sức chứa</p>
                    <p className="mt-1 font-extrabold text-on-surface">{seatCount} ghế</p>
                  </div>
                  <div className="rounded-lg bg-surface-container-low p-3">
                    <p className="text-xs font-medium text-on-surface-variant">Trạng thái</p>
                    <p className="mt-1 font-extrabold text-on-surface">{vehicleStatusLabel[status] || status}</p>
                  </div>
                </div>

                <div className="mt-5 flex justify-end gap-2">
                  <IconButton icon="edit" label="Sửa xe" onClick={() => handleEdit(vehicle)} />
                  <IconButton icon="delete_outline" label="Xóa ghế" variant="danger" onClick={() => handleDeleteSeats(vehicle.id)} />
                </div>
              </article>
            );
          })}
        </div>
      )}

      {showModal && (
        <ModalShell
          title={editingVehicle ? "Chỉnh sửa xe" : "Thêm xe mới"}
          subtitle="Cấu hình thông tin nhận diện và số lượng ghế."
          onClose={handleCloseModal}
          footer={
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <SecondaryButton onClick={handleCloseModal}>Hủy</SecondaryButton>
              <PrimaryButton onClick={handleSubmit} icon={editingVehicle ? "save" : "add"}>
                {editingVehicle ? "Cập nhật" : "Thêm xe"}
              </PrimaryButton>
            </div>
          }
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Biển số xe">
              <input
                type="text"
                name="vehicleNumber"
                value={formData.vehicleNumber}
                onChange={handleFormChange}
                className={inputClass}
                placeholder="47B-42489"
                required
              />
            </Field>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Loại xe">
                <SelectControl name="type" value={formData.type} onChange={handleFormChange}>
                  <option value="seat">Ghế ngồi</option>
                  <option value="bed">Giường nằm</option>
                </SelectControl>
              </Field>
              <Field label="Sức chứa">
                <input
                  type="number"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleFormChange}
                  className={inputClass}
                  min="1"
                />
              </Field>
            </div>

            <Field label="Trạng thái">
              <SelectControl name="status" value={formData.status} onChange={handleFormChange}>
                <option value="active">Hoạt động</option>
                <option value="maintenance">Bảo trì</option>
                <option value="inactive">Tạm ngừng</option>
              </SelectControl>
            </Field>
          </form>
        </ModalShell>
      )}
    </CompanyPageShell>
  );
}
