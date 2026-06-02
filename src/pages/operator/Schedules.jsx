import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createTripSchedule,
  deleteTripSchedule,
  getAllRoutes,
  getAllTripSchedules,
  getStoppingPoints,
  getTrips,
  updateTripSchedule } from
"../../api/operator";
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
  inputClass } from
"./OperatorUI";
import { getStoredUser } from "../../utils/authStorage";

const today = () => new Date().toISOString().split("T")[0];

const toOptionalDateInputValue = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).split("T")[0] || "";
  return date.toISOString().split("T")[0];
};

const toDateInputValue = (value) => toOptionalDateInputValue(value) || today();

const toScheduleDatePayload = (value) => `${toDateInputValue(value)}T00:00:00.000Z`;

const formatDate = (value) => {
  const normalizedDate = toOptionalDateInputValue(value);
  if (!normalizedDate) return "";

  const [year, month, day] = normalizedDate.split("-");
  return `${day}/${month}/${year}`;
};

const formatDateRange = (startDate, endDate) => {
  const start = formatDate(startDate);
  const end = formatDate(endDate);

  if (!start && !end) return "";
  if (!end || start === end) return start;
  return `${start} - ${end}`;
};

const getScheduleStartDate = (schedule = {}) =>
schedule.startDate ??
schedule.start_date ??
schedule.scheduleStartDate ??
schedule.schedule_start_date ??
schedule.fromDate ??
schedule.from_date ??
schedule.validFrom ??
schedule.valid_from ??
"";

const getScheduleEndDate = (schedule = {}) =>
schedule.endDate ??
schedule.end_date ??
schedule.scheduleEndDate ??
schedule.schedule_end_date ??
schedule.toDate ??
schedule.to_date ??
schedule.validTo ??
schedule.valid_to ??
"";

const hydrateScheduleDates = (schedule = {}) => {
  const startDate = getScheduleStartDate(schedule);
  const endDate = getScheduleEndDate(schedule);

  return {
    ...schedule,
    startDate,
    endDate
  };
};

const emptyForm = {
  routeId: "",
  departureTime: "06:00",
  startDate: today(),
  endDate: today(),
  status: true
};

const getStoredCompanyId = () => {
  const user = getStoredUser();
  return user.companyId || null;
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

  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [schedulesRes, routesRes] = await Promise.all([
      getAllTripSchedules({ orderBy: "asc" }),
      getAllRoutes()]
      );
      const schedulesData = Array.isArray(schedulesRes.data?.trip) ? schedulesRes.data.trip : [];
      setSchedules(schedulesData.map(hydrateScheduleDates));
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
    const averageDuration = schedules.length ?
    Math.round(schedules.reduce((sum, schedule) => sum + Number(schedule.durationMinutes || 0), 0) / schedules.length) :
    0;

    return [
    { icon: "calendar_month", label: "Lịch biểu", value: schedules.length, tone: "primary" },
    { icon: "route", label: "Tuyến có lịch", value: routeCount, tone: "blue" },
    { icon: "schedule", label: "Phút trung bình", value: averageDuration, tone: "amber" }];

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
      startDate: toDateInputValue(getScheduleStartDate(schedule)),
      endDate: toDateInputValue(getScheduleEndDate(schedule)),
      status: schedule.status ?? true
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
        const payload = {
          departureTime: formData.departureTime,
          startDate: toScheduleDatePayload(formData.startDate),
          endDate: toScheduleDatePayload(formData.endDate),
          status: Boolean(formData.status)
        };
        const response = await updateTripSchedule(editingSchedule.id, payload);
        const updatedSchedule = response.data?.tripSchedule || response.data?.data?.tripSchedule || {};

        setSchedules((current) =>
        current.map((schedule) =>
        Number(schedule.id) === Number(editingSchedule.id) ?
        {
          ...schedule,
          ...updatedSchedule,
          departureTime: updatedSchedule.departureTime || payload.departureTime,
          startDate: updatedSchedule.startDate || updatedSchedule.start_date || payload.startDate,
          endDate: updatedSchedule.endDate || updatedSchedule.end_date || payload.endDate,
          status: updatedSchedule.status ?? payload.status
        } :
        schedule
        )
        );
        closeModal();
        addToast({ type: "success", title: "Cập nhật lịch biểu thành công" });
        return;
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
          startDate: toScheduleDatePayload(formData.startDate),
          endDate: toScheduleDatePayload(formData.endDate),
          status: Boolean(formData.status)
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
        message: err.response?.data?.message || "Vui lòng kiểm tra dữ liệu lịch biểu."
      });
    }
  };

  const handleDelete = async (schedule) => {
    try {
      const [tripsRes, stopsRes] = await Promise.allSettled([
      getTrips(schedule.id, { limit: 1, orderBy: "asc" }),
      getStoppingPoints(schedule.id)]
      );

      const trips = tripsRes.status === "fulfilled" ? tripsRes.value.data?.trips || [] : [];
      const stops = stopsRes.status === "fulfilled" ? stopsRes.value.data?.stoppingPoints || [] : [];

      if (trips.length || stops.length) {
        const details = [
        trips.length ? "chuyến" : "",
        stops.length ? "điểm dừng" : ""].
        filter(Boolean).join(" và ");

        addToast({
          type: "warning",
          title: "Không thể xóa lịch biểu",
          message: `Lịch biểu này còn ${details}. Hãy xử lý dữ liệu liên quan trước khi xóa.`
        });
        return;
      }
    } catch (err) {
      console.error("Lỗi kiểm tra dữ liệu liên quan trước khi xóa lịch biểu:", err);
      addToast({
        type: "error",
        title: "Không kiểm tra được lịch biểu",
        message: "Vui lòng thử lại sau."
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
        err.response?.status === 500 ?
        "Backend từ chối xóa lịch biểu. Thường là do còn dữ liệu liên quan trong hệ thống." :
        err.response?.data?.message || "Vui lòng thử lại sau."
      });
    }
  };

  return (
    <OperatorPageShell
      eyebrow="Schedules"
      title="Quản lý lịch biểu"
      description="Tạo lịch chạy theo tuyến, quản lý điểm dừng và các chuyến phát sinh."
      actions={<IconButton icon="add" label="Thêm lịch biểu" variant="primary" onClick={openCreateModal} />}>
      
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((stat) =>
        <StatCard key={stat.label} {...stat} />
        )}
      </div>

      {loading ?
      <LoadingState /> :
      error ?
      <ErrorState message={error} /> :
      schedules.length === 0 ?
      <EmptyState icon="calendar_month" title="Chưa có lịch biểu" description="Tạo lịch biểu đầu tiên để mở điểm dừng và chuyến." /> :

      <div className="overflow-hidden rounded-xl border border-outline-variant/30 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-sm">
              <thead className="bg-surface-container-low">
                <tr>
                  <th className="px-4 py-2.5 text-left font-bold text-on-surface-variant">Lịch biểu</th>
                  <th className="px-4 py-2.5 text-left font-bold text-on-surface-variant">Giờ xuất bến</th>
                  <th className="px-4 py-2.5 text-left font-bold text-on-surface-variant">Khoảng cách</th>
                  <th className="px-4 py-2.5 text-left font-bold text-on-surface-variant">Công ty</th>
                  <th className="px-4 py-2.5 text-right font-bold text-on-surface-variant">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/15">
                {schedules.map((schedule) => {
                const dateRange = formatDateRange(getScheduleStartDate(schedule), getScheduleEndDate(schedule));

                return (
                  <tr key={schedule.id} className="hover:bg-surface-container-low/70">
                    <td className="px-4 py-2.5">
                      <p className="font-bold text-on-surface">{schedule.fromLocation} → {schedule.toLocation}</p>
                    </td>
                    <td className="px-4 py-2.5">
                      <p className="font-medium text-on-surface">{schedule.departureTime || "—"}</p>
                      {dateRange &&
                      <p className="mt-1 text-xs text-on-surface-variant">
                          {dateRange}
                        </p>
                      }
                    </td>
                    <td className="px-4 py-2.5 text-on-surface-variant">
                      {Number(schedule.distanceKm || 0).toLocaleString("vi-VN")} km · {Number(schedule.durationMinutes || 0).toLocaleString("vi-VN")} phút
                    </td>
                    <td className="px-4 py-2.5 text-on-surface-variant">{schedule.name || `#${schedule.companyId || "—"}`}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex justify-end gap-2">
                        <IconButton
                          icon="pin_drop"
                          label="Điểm dừng"
                          onClick={() => navigate(`/operator/schedules/${schedule.id}/stopping-points`, { state: { schedule } })} />
                        
                        <IconButton
                          icon="directions_bus"
                          label="Chuyến"
                          onClick={() => navigate(`/operator/schedules/${schedule.id}/trips`, { state: { schedule } })} />
                        
                        <IconButton icon="edit" label="Sửa lịch biểu" variant="primary" onClick={() => openEditModal(schedule)} />
                        <IconButton icon="delete_outline" label="Xóa lịch biểu" variant="danger" onClick={() => handleDelete(schedule)} />
                      </div>
                    </td>
                  </tr>);

              })}
              </tbody>
            </table>
          </div>
        </div>
      }

      {showModal &&
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
        }>
        
          <div className="space-y-4">
            {!editingSchedule &&
          <Field label="Tuyến đường">
                <SelectControl value={formData.routeId} onChange={(e) => handleChange("routeId", e.target.value)}>
                  <option value="">Chọn tuyến</option>
                  {routes.map((route) =>
              <option key={route.id} value={route.id}>
                      {route.fromLocation} → {route.toLocation}
                    </option>
              )}
                </SelectControl>
              </Field>
          }

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Giờ xuất bến">
                <input
                type="time"
                value={formData.departureTime}
                onChange={(e) => handleChange("departureTime", e.target.value)}
                className={inputClass} />
              
              </Field>
              <Field label="Ngày bắt đầu">
                <input
                type="date"
                value={formData.startDate}
                onChange={(e) => handleChange("startDate", e.target.value)}
                className={inputClass} />
              
              </Field>
              <Field label="Ngày kết thúc">
                <input
                type="date"
                value={formData.endDate}
                onChange={(e) => handleChange("endDate", e.target.value)}
                className={inputClass} />
              
              </Field>
            </div>

            <Field label="Trạng thái">
              <SelectControl
              value={formData.status ? "true" : "false"}
              onChange={(e) => handleChange("status", e.target.value === "true")}>
              
                <option value="true">Hoạt động</option>
                <option value="false">Tạm tắt</option>
              </SelectControl>
            </Field>
          </div>
        </ModalShell>
      }
    </OperatorPageShell>);

}
