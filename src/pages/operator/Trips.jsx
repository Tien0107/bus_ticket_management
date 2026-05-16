import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { getDrivers, getRoutes, getTrips, getVehicles, updateTrip } from "../../api/operator";
import { createNotification } from "../../api/notification";
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
  ToolbarCard,
  inputClass,
} from "./OperatorUI";

const today = () => new Date().toISOString().split("T")[0];

const statusLabel = {
  scheduled: "Sắp chạy",
  running: "Đang chạy",
  completed: "Hoàn thành",
  cancelled: "Đã hủy",
};

const statusTone = {
  scheduled: "blue",
  running: "amber",
  completed: "emerald",
  cancelled: "red",
};

const emptyForm = {
  vehicleId: "",
  driverId: "",
  departureDate: today(),
  status: "scheduled",
};

const findRouteByLocations = (source, routes) => {
  if (!source) return null;
  return routes.find(
    (route) =>
      String(route.fromLocation || "").toLowerCase() === String(source.fromLocation || "").toLowerCase() &&
      String(route.toLocation || "").toLowerCase() === String(source.toLocation || "").toLowerCase()
  );
};

const formatTripDate = (value) => {
  if (!value) return "chưa có ngày";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export default function Trips() {
  const { scheduleId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [trips, setTrips] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [schedule] = useState(location.state?.schedule || null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDate, setFilterDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingTrip, setEditingTrip] = useState(null);
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    if (scheduleId) {
      fetchTrips();
      fetchOptions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scheduleId, filterStatus, filterDate]);

  const fetchOptions = async () => {
    try {
      const [driversRes, vehiclesRes, routesRes] = await Promise.all([
        getDrivers({ limit: 100, status: "active" }),
        getVehicles({ limit: 100, status: "active" }),
        getRoutes({ limit: 100 }),
      ]);
      setDrivers(Array.isArray(driversRes.data?.drivers) ? driversRes.data.drivers : []);
      setVehicles(Array.isArray(vehiclesRes.data?.vehicles) ? vehiclesRes.data.vehicles : []);
      setRoutes(Array.isArray(routesRes.data?.routes) ? routesRes.data.routes : []);
    } catch (err) {
      console.error("Lỗi tải tài xế/xe/tuyến:", err);
      addToast({ type: "error", title: "Không tải được tài xế hoặc xe" });
    }
  };

  const fetchTrips = async () => {
    try {
      setLoading(true);
      const params = {
        limit: 100,
        orderBy: "asc",
        status: filterStatus !== "all" ? filterStatus : undefined,
        date: filterDate || undefined,
      };
      Object.keys(params).forEach((key) => params[key] === undefined && delete params[key]);

      const response = await getTrips(scheduleId, params);
      setTrips(Array.isArray(response.data?.trips) ? response.data.trips : []);
      setError("");
    } catch (err) {
      console.error("Lỗi tải chuyến:", err);
      setError("Không thể tải danh sách chuyến.");
      addToast({ type: "error", title: "Không tải được chuyến" });
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => [
    { icon: "directions_bus", label: "Tổng chuyến", value: trips.length, tone: "primary" },
    { icon: "pending_actions", label: "Sắp chạy", value: trips.filter((trip) => trip.status === "scheduled").length, tone: "blue" },
    { icon: "route", label: "Đang chạy", value: trips.filter((trip) => trip.status === "running").length, tone: "amber" },
    { icon: "check_circle", label: "Hoàn thành", value: trips.filter((trip) => trip.status === "completed").length, tone: "emerald" },
  ], [trips]);

  const closeModal = () => {
    setShowModal(false);
    setEditingTrip(null);
    setFormData(emptyForm);
  };

  const openEditModal = (trip) => {
    setEditingTrip(trip);
    setFormData({
      vehicleId: trip.vehicleId || "",
      driverId: trip.driverId || "",
      departureDate: trip.departureDate ? trip.departureDate.split("T")[0] : filterDate || today(),
      status: trip.status || "scheduled",
    });
    setShowModal(true);
  };

  const handleChange = (field, value) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const handleSave = async () => {
    if (!editingTrip) return;
    if (!formData.vehicleId || !formData.driverId || !formData.departureDate) {
      addToast({ type: "warning", title: "Thiếu xe, tài xế hoặc ngày chạy" });
      return;
    }

    const matchedRoute = findRouteByLocations(editingTrip, routes) || findRouteByLocations(schedule, routes);
    if (!matchedRoute) {
      addToast({ type: "error", title: "Không xác định được tuyến của chuyến" });
      return;
    }

    const payload = {
      routeId: Number(matchedRoute.id),
      vehicleId: Number(formData.vehicleId),
      driverId: Number(formData.driverId),
      scheduleId: Number(scheduleId),
      departureDate: formData.departureDate,
      status: formData.status,
    };

    try {
      await updateTrip(scheduleId, editingTrip.id, payload);
      const assignedDriverId = Number(formData.driverId);
      const previousDriverId = Number(editingTrip.driverId || 0);
      const driverChanged = assignedDriverId && assignedDriverId !== previousDriverId;

      if (driverChanged) {
        try {
          const tripTitle = `${editingTrip.fromLocation || schedule?.fromLocation || "Điểm đi"} → ${
            editingTrip.toLocation || schedule?.toLocation || "Điểm đến"
          }`;

          await createNotification({
            userId: assignedDriverId,
            title: "Bạn vừa được gán một chuyến",
            body: `Dispatcher đã gán cho bạn chuyến ${tripTitle} ngày ${formatTripDate(formData.departureDate)}.`,
            data: JSON.stringify({
              type: "trip_assigned",
              tripId: Number(editingTrip.id),
              scheduleId: Number(scheduleId),
              path: `/driver/trip/${editingTrip.id}`,
            }),
          });
        } catch (notificationError) {
          console.warn("Không thể gửi thông báo gán chuyến cho tài xế:", notificationError);
          addToast({
            type: "warning",
            title: "Đã cập nhật chuyến nhưng chưa gửi được thông báo cho tài xế",
          });
        }
      }

      addToast({ type: "success", title: "Cập nhật chuyến thành công" });
      closeModal();
      fetchTrips();
    } catch (err) {
      console.error("Lỗi cập nhật chuyến:", err);
      addToast({
        type: "error",
        title: "Không cập nhật được chuyến",
        message: err.response?.data?.message || "Vui lòng kiểm tra dữ liệu chuyến.",
      });
    }
  };

  if (!scheduleId) {
    return (
      <OperatorPageShell title="Chuyến" description="Không tìm thấy lịch biểu.">
        <ErrorState message="Vui lòng chọn lịch biểu trước." />
      </OperatorPageShell>
    );
  }

  return (
    <OperatorPageShell
      eyebrow="Trips"
      title="Quản lý chuyến"
      description={schedule ? `${schedule.fromLocation} → ${schedule.toLocation}` : "Danh sách chuyến theo lịch biểu."}
      actions={<IconButton icon="arrow_back" label="Quay lại lịch biểu" onClick={() => navigate("/operator/schedules")} />}
    >
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <ToolbarCard>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[220px_220px_auto]">
          <SelectControl value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">Tất cả trạng thái</option>
            <option value="scheduled">Sắp chạy</option>
            <option value="running">Đang chạy</option>
            <option value="completed">Hoàn thành</option>
            <option value="cancelled">Đã hủy</option>
          </SelectControl>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className={inputClass}
          />
          <SecondaryButton icon="refresh" onClick={() => {
            setFilterStatus("all");
            setFilterDate("");
          }}>
            Đặt lại
          </SecondaryButton>
        </div>
      </ToolbarCard>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} />
      ) : trips.length === 0 ? (
        <EmptyState icon="directions_bus" title="Không có chuyến" description="Thử đổi bộ lọc hoặc quay lại lịch biểu khác." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-outline-variant/30 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-sm">
              <thead className="bg-surface-container-low">
                <tr>
                  <th className="px-5 py-3 text-left font-bold text-on-surface-variant">Chuyến</th>
                  <th className="px-5 py-3 text-left font-bold text-on-surface-variant">Tuyến</th>
                  <th className="px-5 py-3 text-left font-bold text-on-surface-variant">Xe</th>
                  <th className="px-5 py-3 text-left font-bold text-on-surface-variant">Sức chứa</th>
                  <th className="px-5 py-3 text-left font-bold text-on-surface-variant">Trạng thái</th>
                  <th className="px-5 py-3 text-right font-bold text-on-surface-variant">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/15">
                {trips.map((trip) => (
                  <tr key={trip.id} className="hover:bg-surface-container-low/70">
                    <td className="px-5 py-4">
                      <p className="font-extrabold text-on-surface">#{trip.id}</p>
                      <p className="mt-1 text-xs text-on-surface-variant">{trip.companyName || "—"}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-bold text-on-surface">{trip.fromLocation} → {trip.toLocation}</p>
                      <p className="mt-1 text-xs text-on-surface-variant">{Number(trip.distanceKm || 0).toLocaleString("vi-VN")} km</p>
                    </td>
                    <td className="px-5 py-4 font-medium text-on-surface">{trip.plateNumber || "Chưa gán xe"}</td>
                    <td className="px-5 py-4 text-on-surface-variant">
                      {trip.totalSeats || 0} ghế · {trip.type || "—"}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge tone={statusTone[trip.status] || "slate"}>
                        {statusLabel[trip.status] || trip.status || "—"}
                      </StatusBadge>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end">
                        <IconButton icon="edit" label="Sửa chuyến" variant="primary" onClick={() => openEditModal(trip)} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && editingTrip && (
        <ModalShell
          title="Cập nhật chuyến"
          subtitle={`Chuyến #${editingTrip.id}`}
          onClose={closeModal}
          footer={
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <SecondaryButton onClick={closeModal}>Hủy</SecondaryButton>
              <PrimaryButton icon="save" onClick={handleSave}>Cập nhật</PrimaryButton>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Tài xế">
                <SelectControl value={formData.driverId} onChange={(e) => handleChange("driverId", e.target.value)}>
                  <option value="">Chọn tài xế</option>
                  {drivers.map((driver) => (
                    <option key={driver.id} value={driver.id}>
                      {driver.fullName} - {driver.phone}
                    </option>
                  ))}
                </SelectControl>
              </Field>
              <Field label="Xe">
                <SelectControl value={formData.vehicleId} onChange={(e) => handleChange("vehicleId", e.target.value)}>
                  <option value="">Chọn xe</option>
                  {vehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.plateNumber} - {vehicle.totalSeats} ghế
                    </option>
                  ))}
                </SelectControl>
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Ngày chạy">
                <input
                  type="date"
                  value={formData.departureDate}
                  onChange={(e) => handleChange("departureDate", e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="Trạng thái">
                <SelectControl value={formData.status} onChange={(e) => handleChange("status", e.target.value)}>
                  <option value="scheduled">Sắp chạy</option>
                  <option value="running">Đang chạy</option>
                  <option value="completed">Hoàn thành</option>
                  <option value="cancelled">Đã hủy</option>
                </SelectControl>
              </Field>
            </div>
          </div>
        </ModalShell>
      )}
    </OperatorPageShell>
  );
}
