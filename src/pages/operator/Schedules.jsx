import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createTripSchedule,
  deleteTripSchedule,
  getRoutes,
  getStoppingPoints,
  getTrips,
  getTripSchedules,
  updateTripSchedule,
} from "../../api/operator";
import { useToast } from "../../context/ToastContext";
import {
  EmptyState,
  ErrorState,
  Field,
  IconButton,
  LoadingState,
  ModalShell,
  OperatorPageShell,
  PrimaryButton,
  SecondaryButton,
  SelectControl,
  StatCard,
  inputClass,
} from "./OperatorUI";

const today = () => new Date().toISOString().split("T")[0];

const toDateInputValue = (value) => {
  if (!value) return today();
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).split("T")[0] || today();
  return date.toISOString().split("T")[0];
};

const emptyForm = {
  routeId: "",
  departureTime: "06:00",
  startDate: today(),
  endDate: today(),
  status: true,
};

const getStoredCompanyId = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return user.companyId || null;
  } catch {
    return null;
  }
};

export default function Schedules() {
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [schedules, setSchedules] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [schedulesRes, routesRes] = await Promise.all([
        getTripSchedules({ limit: 10, orderBy: "asc" }),
        getRoutes({ limit: 10 }),
      ]);
      setSchedules(Array.isArray(schedulesRes.data?.trip) ? schedulesRes.data.trip : []);
      setRoutes(Array.isArray(routesRes.data?.routes) ? routesRes.data.routes : []);
      setError("");
    } catch (err) {
      console.error("Lỗi tải lịch biểu:", err);
      setError("Không thể tải danh sách lịch biểu.");
      addToast({ type: "error", title: "Không tải được lịch biểu" });
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const routeCount = new Set(schedules.map((schedule) => `${schedule.fromLocation}-${schedule.toLocation}`)).size;
    const averageDuration = schedules.length
      ? Math.round(schedules.reduce((sum, schedule) => sum + Number(schedule.durationMinutes || 0), 0) / schedules.length)
      : 0;

    return [
      { icon: "calendar_month", label: "Lịch biểu", value: schedules.length, tone: "primary" },
      { icon: "route", label: "Tuyến có lịch", value: routeCount, tone: "blue" },
      { icon: "schedule", label: "Phút trung bình", value: averageDuration, tone: "amber" },
    ];
  }, [schedules]);

  const closeModal = () => {
    setShowModal(false);
    setEditingSchedule(null);
    setFormData(emptyForm);
  };

  const openCreateModal = () => {
    setEditingSchedule(null);
    setFormData(emptyForm);
    setShowModal(true);
  };

  const openEditModal = (schedule) => {
    setEditingSchedule(schedule);
    setFormData({
      routeId: "",
      departureTime: schedule.departureTime || "06:00",
      startDate: toDateInputValue(schedule.startDate),
      endDate: toDateInputValue(schedule.endDate),
      status: schedule.status ?? true,
    });
    setShowModal(true);
  };

  const handleChange = (field, value) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const handleSave = async () => {
    if (!formData.departureTime || !formData.startDate || !formData.endDate) {
      addToast({ type: "warning", title: "Thiếu thời gian lịch biểu" });
      return;
    }

    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      addToast({ type: "warning", title: "Ngày kết thúc phải sau ngày bắt đầu" });
      return;
    }

    try {
      if (editingSchedule) {
        await updateTripSchedule(editingSchedule.id, {
          departureTime: formData.departureTime,
          startDate: formData.startDate,
          endDate: formData.endDate,
          status: Boolean(formData.status),
        });
        addToast({ type: "success", title: "Cập nhật lịch biểu thành công" });
      } else {
        const companyId = getStoredCompanyId();
        if (!companyId) {
          addToast({ type: "error", title: "Không tìm thấy công ty để tạo lịch biểu" });
          return;
        }
        if (!formData.routeId) {
          addToast({ type: "warning", title: "Chưa chọn tuyến đường" });
          return;
        }

        await createTripSchedule({
          routeId: Number(formData.routeId),
          companyId: Number(companyId),
          departureTime: formData.departureTime,
          startDate: formData.startDate,
          endDate: formData.endDate,
          status: Boolean(formData.status),
        });
        addToast({ type: "success", title: "Tạo lịch biểu thành công" });
      }

      closeModal();
      fetchData();
    } catch (err) {
      console.error("Lỗi lưu lịch biểu:", err);
      addToast({
        type: "error",
        title: "Không lưu được lịch biểu",
        message: err.response?.data?.message || "Vui lòng kiểm tra dữ liệu lịch biểu.",
      });
    }
  };

  const handleDelete = async (schedule) => {
    try {
      const [tripsRes, stopsRes] = await Promise.allSettled([
        getTrips(schedule.id, { limit: 1, orderBy: "asc" }),
        getStoppingPoints(schedule.id),
      ]);

      const trips = tripsRes.status === "fulfilled" ? tripsRes.value.data?.trips || [] : [];
      const stops = stopsRes.status === "fulfilled" ? stopsRes.value.data?.stoppingPoints || [] : [];

      if (trips.length || stops.length) {
        const details = [
          trips.length ? "chuyến" : "",
          stops.length ? "điểm dừng" : "",
        ].filter(Boolean).join(" và ");

        addToast({
          type: "warning",
          title: "Không thể xóa lịch biểu",
          message: `Lịch biểu này còn ${details}. Hãy xử lý dữ liệu liên quan trước khi xóa.`,
        });
        return;
      }
    } catch (err) {
      console.error("Lỗi kiểm tra dữ liệu liên quan trước khi xóa lịch biểu:", err);
      addToast({
        type: "error",
        title: "Không kiểm tra được lịch biểu",
        message: "Vui lòng thử lại sau.",
      });
      return;
    }

    if (!window.confirm(`Xóa lịch biểu ${schedule.fromLocation || ""} → ${schedule.toLocation || ""}?`)) return;

    try {
      await deleteTripSchedule(schedule.id);
      addToast({ type: "success", title: "Xóa lịch biểu thành công" });
      fetchData();
    } catch (err) {
      console.error("Lỗi xóa lịch biểu:", err);
      addToast({
        type: "error",
        title: "Không xóa được lịch biểu",
        message:
          err.response?.status === 500
            ? "Backend từ chối xóa lịch biểu. Thường là do còn dữ liệu liên quan trong hệ thống."
            : err.response?.data?.message || "Vui lòng thử lại sau.",
      });
    }
  };

  return (
    <OperatorPageShell
      eyebrow="Schedules"
      title="Quản lý lịch biểu"
      description="Tạo lịch chạy theo tuyến, quản lý điểm dừng và các chuyến phát sinh."
      actions={<IconButton icon="add" label="Thêm lịch biểu" variant="primary" onClick={openCreateModal} />}
    >
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} />
      ) : schedules.length === 0 ? (
        <EmptyState icon="calendar_month" title="Chưa có lịch biểu" description="Tạo lịch biểu đầu tiên để mở điểm dừng và chuyến." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-outline-variant/30 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-sm">
              <thead className="bg-surface-container-low">
                <tr>
                  <th className="px-5 py-3 text-left font-bold text-on-surface-variant">Lịch biểu</th>
                  <th className="px-5 py-3 text-left font-bold text-on-surface-variant">Giờ xuất bến</th>
                  <th className="px-5 py-3 text-left font-bold text-on-surface-variant">Khoảng cách</th>
                  <th className="px-5 py-3 text-left font-bold text-on-surface-variant">Công ty</th>
                  <th className="px-5 py-3 text-right font-bold text-on-surface-variant">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/15">
                {schedules.map((schedule) => (
                  <tr key={schedule.id} className="hover:bg-surface-container-low/70">
                    <td className="px-5 py-4">
                      <p className="font-bold text-on-surface">{schedule.fromLocation} → {schedule.toLocation}</p>
                      <p className="mt-1 text-xs text-on-surface-variant">ID: {schedule.id}</p>
                    </td>
                    <td className="px-5 py-4 font-medium text-on-surface">{schedule.departureTime || "—"}</td>
                    <td className="px-5 py-4 text-on-surface-variant">
                      {Number(schedule.distanceKm || 0).toLocaleString("vi-VN")} km · {Number(schedule.durationMinutes || 0).toLocaleString("vi-VN")} phút
                    </td>
                    <td className="px-5 py-4 text-on-surface-variant">{schedule.name || `#${schedule.companyId || "—"}`}</td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <IconButton
                          icon="pin_drop"
                          label="Điểm dừng"
                          onClick={() => navigate(`/operator/schedules/${schedule.id}/stopping-points`, { state: { schedule } })}
                        />
                        <IconButton
                          icon="directions_bus"
                          label="Chuyến"
                          onClick={() => navigate(`/operator/schedules/${schedule.id}/trips`, { state: { schedule } })}
                        />
                        <IconButton icon="edit" label="Sửa lịch biểu" variant="primary" onClick={() => openEditModal(schedule)} />
                        <IconButton icon="delete_outline" label="Xóa lịch biểu" variant="danger" onClick={() => handleDelete(schedule)} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <ModalShell
          title={editingSchedule ? "Sửa lịch biểu" : "Thêm lịch biểu"}
          subtitle={editingSchedule ? `${editingSchedule.fromLocation} → ${editingSchedule.toLocation}` : "Lịch chạy theo tuyến."}
          onClose={closeModal}
          footer={
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <SecondaryButton onClick={closeModal}>Hủy</SecondaryButton>
              <PrimaryButton icon={editingSchedule ? "save" : "add"} onClick={handleSave}>
                {editingSchedule ? "Cập nhật" : "Tạo lịch biểu"}
              </PrimaryButton>
            </div>
          }
        >
          <div className="space-y-4">
            {!editingSchedule && (
              <Field label="Tuyến đường">
                <SelectControl value={formData.routeId} onChange={(e) => handleChange("routeId", e.target.value)}>
                  <option value="">Chọn tuyến</option>
                  {routes.map((route) => (
                    <option key={route.id} value={route.id}>
                      {route.fromLocation} → {route.toLocation}
                    </option>
                  ))}
                </SelectControl>
              </Field>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Giờ xuất bến">
                <input
                  type="time"
                  value={formData.departureTime}
                  onChange={(e) => handleChange("departureTime", e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="Ngày bắt đầu">
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleChange("startDate", e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="Ngày kết thúc">
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleChange("endDate", e.target.value)}
                  className={inputClass}
                />
              </Field>
            </div>

            <Field label="Trạng thái">
              <SelectControl
                value={formData.status ? "true" : "false"}
                onChange={(e) => handleChange("status", e.target.value === "true")}
              >
                <option value="true">Hoạt động</option>
                <option value="false">Tạm tắt</option>
              </SelectControl>
            </Field>
          </div>
        </ModalShell>
      )}
    </OperatorPageShell>
  );
}
