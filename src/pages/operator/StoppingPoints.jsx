import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  createStoppingPoint,
  getRoutes,
  getStations,
  getStoppingPoints,
  getTripSchedules,
  updateStoppingPoint } from
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
  StatusBadge,
  inputClass } from
"./OperatorUI";

const emptyForm = {
  stationId: "",
  allowPickup: true,
  allowDropoff: true,
  stopOrder: ""
};

const findRouteForSchedule = (schedule, routes) => {
  if (!schedule) return null;
  return routes.find(
    (route) =>
    String(route.fromLocation || "").toLowerCase() === String(schedule.fromLocation || "").toLowerCase() &&
    String(route.toLocation || "").toLowerCase() === String(schedule.toLocation || "").toLowerCase()
  );
};

const getStoredCompanyId = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return user.companyId || null;
  } catch {
    return null;
  }
};

export default function StoppingPoints() {
  const { scheduleId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [stoppingPoints, setStoppingPoints] = useState([]);
  const [stations, setStations] = useState([]);
  const [schedule, setSchedule] = useState(location.state?.schedule || null);
  const [routeId, setRouteId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingPoint, setEditingPoint] = useState(null);
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    if (scheduleId) {
      fetchData();
    }

  }, [scheduleId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [stationsRes, schedulesRes, routesRes] = await Promise.all([
      getStations({ limit: 10 }),
      getTripSchedules({ limit: 10, orderBy: "asc" }),
      getRoutes({ limit: 10 })]
      );

      const stationList = Array.isArray(stationsRes.data?.stations) ? stationsRes.data.stations : [];
      const scheduleList = Array.isArray(schedulesRes.data?.trip) ? schedulesRes.data.trip : [];
      const routeList = Array.isArray(routesRes.data?.routes) ? routesRes.data.routes : [];
      const currentSchedule = schedule || scheduleList.find((item) => Number(item.id) === Number(scheduleId));
      const matchedRoute = findRouteForSchedule(currentSchedule, routeList);
      const resolvedRouteId = matchedRoute?.id || null;

      setStations(stationList);
      setSchedule(currentSchedule || null);
      setRouteId(resolvedRouteId);

      const pointsRes = await getStoppingPoints(scheduleId, resolvedRouteId ? { routeId: resolvedRouteId } : {});
      const points = Array.isArray(pointsRes.data?.stoppingPoints) ? pointsRes.data.stoppingPoints : [];
      setStoppingPoints([...points].sort((a, b) => Number(a.stopOrder || 0) - Number(b.stopOrder || 0)));
      setError("");
    } catch (err) {
      console.error("Lỗi tải điểm dừng:", err);
      setError("Không thể tải danh sách điểm dừng.");
      addToast({ type: "error", title: "Không tải được điểm dừng" });
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => [
  { icon: "pin_drop", label: "Điểm dừng", value: stoppingPoints.length, tone: "primary" },
  { icon: "hail", label: "Cho đón", value: stoppingPoints.filter((point) => point.allowPickup).length, tone: "emerald" },
  { icon: "transfer_within_a_station", label: "Cho trả", value: stoppingPoints.filter((point) => point.allowDropoff).length, tone: "blue" }],
  [stoppingPoints]);

  const closeModal = () => {
    setShowModal(false);
    setEditingPoint(null);
    setFormData(emptyForm);
  };

  const openCreateModal = () => {
    setEditingPoint(null);
    setFormData({
      ...emptyForm,
      stopOrder: stoppingPoints.length ? Math.max(...stoppingPoints.map((point) => Number(point.stopOrder || 0))) + 1 : 1
    });
    setShowModal(true);
  };

  const openEditModal = (point) => {
    setEditingPoint(point);
    setFormData({
      stationId: point.stationId || "",
      allowPickup: Boolean(point.allowPickup),
      allowDropoff: Boolean(point.allowDropoff),
      stopOrder: point.stopOrder ?? ""
    });
    setShowModal(true);
  };

  const handleChange = (field, value) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const handleSave = async () => {
    if (!routeId) {
      addToast({ type: "error", title: "Không xác định được tuyến của lịch biểu" });
      return;
    }

    if (!formData.stationId || formData.stopOrder === "") {
      addToast({ type: "warning", title: "Thiếu trạm hoặc thứ tự dừng" });
      return;
    }

    const companyId = editingPoint?.companyId || schedule?.companyId || getStoredCompanyId();
    if (!companyId) {
      addToast({ type: "error", title: "Không tìm thấy công ty để lưu điểm dừng" });
      return;
    }

    const payload = {
      companyId: Number(companyId),
      scheduleId: Number(scheduleId),
      allowPickup: Boolean(formData.allowPickup),
      allowDropoff: Boolean(formData.allowDropoff),
      routeId: Number(routeId),
      stopOrder: Number(formData.stopOrder),
      stationId: Number(formData.stationId)
    };

    try {
      if (editingPoint) {
        await updateStoppingPoint(scheduleId, editingPoint.id, payload);
        addToast({ type: "success", title: "Cập nhật điểm dừng thành công" });
      } else {
        await createStoppingPoint(scheduleId, payload);
        addToast({ type: "success", title: "Thêm điểm dừng thành công" });
      }

      closeModal();
      fetchData();
    } catch (err) {
      console.error("Lỗi lưu điểm dừng:", err);
      addToast({
        type: "error",
        title: "Không lưu được điểm dừng",
        message: err.response?.data?.message || "Vui lòng kiểm tra thông tin điểm dừng."
      });
    }
  };

  if (!scheduleId) {
    return (
      <OperatorPageShell title="Điểm dừng" description="Không tìm thấy lịch biểu.">
        <ErrorState message="Vui lòng chọn lịch biểu trước." />
      </OperatorPageShell>);

  }

  return (
    <OperatorPageShell
      eyebrow="Stopping Points"
      title="Quản lý điểm dừng"
      description={schedule ? `${schedule.fromLocation} → ${schedule.toLocation}` : "Danh sách điểm dừng của lịch biểu."}
      actions={
      <div className="flex gap-2">
          <IconButton icon="arrow_back" label="Quay lại lịch biểu" onClick={() => navigate("/operator/schedules")} />
          <IconButton icon="add" label="Thêm điểm dừng" variant="primary" onClick={openCreateModal} />
        </div>
      }>
      
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((stat) =>
        <StatCard key={stat.label} {...stat} />
        )}
      </div>

      {loading ?
      <LoadingState /> :
      error ?
      <ErrorState message={error} /> :
      stoppingPoints.length === 0 ?
      <EmptyState icon="pin_drop" title="Chưa có điểm dừng" description="Thêm điểm dừng đầu tiên cho lịch biểu này." /> :

      <div className="overflow-hidden rounded-xl border border-outline-variant/30 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead className="bg-surface-container-low">
                <tr>
                  <th className="px-5 py-3 text-left font-bold text-on-surface-variant">Thứ tự</th>
                  <th className="px-5 py-3 text-left font-bold text-on-surface-variant">Trạm</th>
                  <th className="px-5 py-3 text-left font-bold text-on-surface-variant">Đón</th>
                  <th className="px-5 py-3 text-left font-bold text-on-surface-variant">Trả</th>
                  <th className="px-5 py-3 text-right font-bold text-on-surface-variant">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/15">
                {stoppingPoints.map((point) =>
              <tr key={point.id} className="hover:bg-surface-container-low/70">
                    <td className="px-5 py-4 font-extrabold text-on-surface">#{point.stopOrder}</td>
                    <td className="px-5 py-4">
                      <p className="font-bold text-on-surface">{point.address || "—"}</p>
                      <p className="mt-1 text-xs text-on-surface-variant">{point.city || "—"} · ID: {point.id}</p>
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge tone={point.allowPickup ? "emerald" : "slate"}>
                        {point.allowPickup ? "Cho phép" : "Không"}
                      </StatusBadge>
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge tone={point.allowDropoff ? "blue" : "slate"}>
                        {point.allowDropoff ? "Cho phép" : "Không"}
                      </StatusBadge>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end">
                        <IconButton icon="edit" label="Sửa điểm dừng" variant="primary" onClick={() => openEditModal(point)} />
                      </div>
                    </td>
                  </tr>
              )}
              </tbody>
            </table>
          </div>
        </div>
      }

      {showModal &&
      <ModalShell
        title={editingPoint ? "Sửa điểm dừng" : "Thêm điểm dừng"}
        subtitle="Trạm và quyền đón trả."
        onClose={closeModal}
        footer={
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <SecondaryButton onClick={closeModal}>Hủy</SecondaryButton>
              <PrimaryButton icon={editingPoint ? "save" : "add"} onClick={handleSave}>
                {editingPoint ? "Cập nhật" : "Thêm điểm dừng"}
              </PrimaryButton>
            </div>
        }>
        
          <div className="space-y-4">
            <Field label="Trạm">
              <SelectControl value={formData.stationId} onChange={(e) => handleChange("stationId", e.target.value)}>
                <option value="">Chọn trạm</option>
                {stations.map((station) =>
              <option key={station.id} value={station.id}>
                    {station.address} - {station.city}
                  </option>
              )}
              </SelectControl>
            </Field>

            <Field label="Thứ tự dừng">
              <input
              type="number"
              min="0"
              value={formData.stopOrder}
              onChange={(e) => handleChange("stopOrder", e.target.value)}
              className={inputClass} />
            
            </Field>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="flex items-center gap-3 rounded-lg border border-outline-variant/40 p-4">
                <input
                type="checkbox"
                checked={formData.allowPickup}
                onChange={(e) => handleChange("allowPickup", e.target.checked)}
                className="h-4 w-4 accent-primary" />
              
                <span className="text-sm font-bold text-on-surface">Cho phép đón khách</span>
              </label>
              <label className="flex items-center gap-3 rounded-lg border border-outline-variant/40 p-4">
                <input
                type="checkbox"
                checked={formData.allowDropoff}
                onChange={(e) => handleChange("allowDropoff", e.target.checked)}
                className="h-4 w-4 accent-primary" />
              
                <span className="text-sm font-bold text-on-surface">Cho phép trả khách</span>
              </label>
            </div>
          </div>
        </ModalShell>
      }
    </OperatorPageShell>);

}