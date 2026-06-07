import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { dedupeDriversByContact, getAllDrivers, getAllRoutes, getAllTrips, getAllVehicles, updateTrip } from "../../api/operator";
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
  inputClass } from
"./OperatorUI";

const today = () => new Date().toISOString().split("T")[0];

const statusLabel = {
  scheduled: "Sắp chạy",
  running: "Đang chạy",
  completed: "Hoàn thành",
  cancelled: "Đã hủy"
};

const statusTone = {
  scheduled: "blue",
  running: "amber",
  completed: "emerald",
  cancelled: "red"
};

const filterStatuses = new Set(Object.keys(statusLabel));

const getTripFilterStorageKey = (scheduleId) => `operatorTripFilters:${scheduleId || "unknown"}`;

const readStoredTripFilters = (scheduleId) => {
  try {
    const filters = JSON.parse(sessionStorage.getItem(getTripFilterStorageKey(scheduleId)) || "{}");
    return filters && typeof filters === "object" ? filters : {};
  } catch {
    return {};
  }
};

const saveStoredTripFilters = (scheduleId, filters) => {
  try {
    const hasFilters = filters.status && filters.status !== "all" || filters.date;
    const storageKey = getTripFilterStorageKey(scheduleId);

    if (hasFilters) {
      sessionStorage.setItem(storageKey, JSON.stringify(filters));
    } else {
      sessionStorage.removeItem(storageKey);
    }
  } catch {

  }
};

const emptyForm = {
  vehicleId: "",
  driverIds: [],
  departureDate: today(),
  status: "scheduled"
};

const getTripVehicleId = (trip = {}) => trip.vehicleId ?? trip.vehicle_id ?? trip.vehicle?.id ?? "";
const getDriverIdCandidates = (driver = {}) =>
[driver.id, driver.driverId, driver.driver_id, driver.userId, driver.user_id, driver.user?.id].
map((id) => Number(id)).
filter((id) => Number.isFinite(id) && id > 0).
filter((id, index, list) => list.indexOf(id) === index);
const getDriverPrimaryId = (driver = {}) => getDriverIdCandidates(driver)[0] || null;
const driverMatchesId = (driver, driverId) => getDriverIdCandidates(driver).includes(Number(driverId));
const getDriverSelectedId = (driver, selectedIds = []) => {
  const candidates = getDriverIdCandidates(driver);
  return candidates.find((id) => selectedIds.includes(id)) || candidates[0] || null;
};
const getDriverDisplayName = (driver = {}) =>
driver.fullName ?? driver.full_name ?? driver.name ?? driver.driverName ?? driver.driver_name ?? "Chưa có tên";
const getDriverPhone = (driver = {}) =>
driver.phone ?? driver.phoneNumber ?? driver.phone_number ?? driver.contactInfo?.phone ?? "Chưa có số điện thoại";
const normalizeDriverIds = (ids) =>
[...(Array.isArray(ids) ? ids : [ids])].
map((id) => Number(id)).
filter((id) => Number.isFinite(id) && id > 0).
filter((id, index, list) => list.indexOf(id) === index);
const resolveDriversByIds = (driverIds, driverList) =>
normalizeDriverIds(driverIds).
map((driverId) => driverList.find((driver) => driverMatchesId(driver, driverId))).
filter(Boolean).
filter((driver, index, list) => {
  const driverId = getDriverPrimaryId(driver);
  return driverId ? list.findIndex((item) => getDriverPrimaryId(item) === driverId) === index : true;
});
const getTripDriverIds = (trip = {}) => {
  if (Array.isArray(trip.driverIds) || trip.driverIds) return normalizeDriverIds(trip.driverIds);
  if (Array.isArray(trip.driver_ids) || trip.driver_ids) return normalizeDriverIds(trip.driver_ids);
  if (Array.isArray(trip.drivers)) return trip.drivers.map((driver) => driver?.id ?? driver?.userId).filter(Boolean);
  if (trip.driverId || trip.driver_id || trip.driver?.id) {
    return [trip.driverId ?? trip.driver_id ?? trip.driver?.id];
  }
  return [];
};
const getTripDriverNames = (trip = {}) => {
  if (Array.isArray(trip.driverNames)) return trip.driverNames.filter(Boolean);
  if (Array.isArray(trip.driver_names)) return trip.driver_names.filter(Boolean);
  if (Array.isArray(trip.drivers)) {
    return trip.drivers.
    map((driver) => driver?.fullName || driver?.full_name || driver?.name).
    filter(Boolean);
  }
  return [];
};
const getTripDriverName = (trip = {}) =>
trip.driverName ??
trip.driver_name ??
trip.driver?.fullName ??
trip.driver?.full_name ??
trip.fullName ??
trip.companyName ??
"";
const getTripDepartureDate = (trip = {}) =>
trip.departureDate ??
trip.departure_date ??
trip.tripDepartureDate ??
trip.trip_departure_date ??
trip.departureAt ??
trip.departure_at ??
trip.departureDay ??
trip.departure_day ??
trip.tripDate ??
trip.trip_date ??
trip.startDate ??
trip.start_date ??
trip.date ??
"";
const getTripPlateNumber = (trip = {}) =>
trip.plateNumber ?? trip.plate_number ?? trip.vehicle?.plateNumber ?? trip.vehicle?.plate_number ?? "";
const getTripTotalSeats = (trip = {}) =>
trip.totalSeats ?? trip.total_seats ?? trip.vehicle?.totalSeats ?? trip.vehicle?.total_seats ?? 0;
const getVehiclePlateNumber = (vehicle = {}) => vehicle.plateNumber ?? vehicle.plate_number ?? "";
const canEditTrip = (trip = {}) => trip.status === "scheduled";

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
    year: "numeric"
  });
};

export default function Trips() {
  const { scheduleId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToast } = useToast();

  const [trips, setTrips] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [schedule] = useState(location.state?.schedule || null);
  const [filterStatus, setFilterStatus] = useState(() => {
    const storedFilters = readStoredTripFilters(scheduleId);
    const status = searchParams.get("status") || storedFilters.status;
    return filterStatuses.has(status) ? status : "all";
  });
  const [filterDate, setFilterDate] = useState(() => {
    const storedFilters = readStoredTripFilters(scheduleId);
    return searchParams.get("date") || storedFilters.date || today();
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingTrip, setEditingTrip] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [driverMenuOpen, setDriverMenuOpen] = useState(false);
  const [driverMenuPosition, setDriverMenuPosition] = useState(null);
  const driverDropdownRef = useRef(null);
  const driverTriggerRef = useRef(null);
  const driverMenuRef = useRef(null);
  const selectedDrivers = useMemo(
    () => {
      return resolveDriversByIds(formData.driverIds, drivers);
    },
    [drivers, formData.driverIds]
  );
  const selectedVehicle = useMemo(() => {
    const vehicleId = Number(formData.vehicleId);
    const matchedVehicle = vehicles.find((vehicle) => Number(vehicle.id) === vehicleId);
    if (matchedVehicle) return matchedVehicle;
    if (!editingTrip) return null;

    const tripPlateNumber = String(getTripPlateNumber(editingTrip)).trim();
    const matchedByPlate = vehicles.find(
      (vehicle) =>
      tripPlateNumber &&
      String(getVehiclePlateNumber(vehicle)).trim().toLowerCase() === tripPlateNumber.toLowerCase()
    );
    if (matchedByPlate) return matchedByPlate;
    if (!vehicleId && !tripPlateNumber) return null;

    return {
      id: vehicleId || "",
      plateNumber: tripPlateNumber || "Xe hiện tại",
      totalSeats: getTripTotalSeats(editingTrip)
    };
  }, [editingTrip, formData.vehicleId, vehicles]);

  useEffect(() => {
    if (!driverMenuOpen) return undefined;

    const handlePointerDown = (event) => {
      const clickedTrigger = driverDropdownRef.current?.contains(event.target);
      const clickedMenu = driverMenuRef.current?.contains(event.target);

      if (!clickedTrigger && !clickedMenu) {
        setDriverMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [driverMenuOpen]);

  useEffect(() => {
    if (!driverMenuOpen) {
      setDriverMenuPosition(null);
      return undefined;
    }

    const updateMenuPosition = () => {
      const trigger = driverTriggerRef.current;
      if (!trigger) return;

      const rect = trigger.getBoundingClientRect();
      const gap = 8;
      const estimatedMenuHeight = Math.min(256, Math.max(88, drivers.length * 64 + 16));
      const spaceBelow = window.innerHeight - rect.bottom - gap;
      const spaceAbove = rect.top - gap;
      const openUp = spaceBelow < estimatedMenuHeight && spaceAbove > spaceBelow;
      const availableSpace = openUp ? spaceAbove : spaceBelow;
      const maxHeight = Math.max(128, Math.min(256, availableSpace - 8));
      const top = openUp ?
      Math.max(8, rect.top - gap - Math.min(estimatedMenuHeight, maxHeight)) :
      Math.min(rect.bottom + gap, window.innerHeight - maxHeight - 8);

      setDriverMenuPosition({
        left: rect.left,
        top,
        width: rect.width,
        maxHeight
      });
    };

    updateMenuPosition();
    const frameId = window.requestAnimationFrame(updateMenuPosition);
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [driverMenuOpen, drivers.length]);

  useEffect(() => {
    if (scheduleId) {
      fetchTrips();
      fetchOptions();
    }

  }, [scheduleId, filterStatus, filterDate]);

  const fetchOptions = async () => {
    try {
      const [driversRes, vehiclesRes, routesRes] = await Promise.all([
      getAllDrivers({ status: "active" }),
      getAllVehicles({ status: "active" }),
      getAllRoutes()]
      );
      setDrivers(dedupeDriversByContact(Array.isArray(driversRes.data?.drivers) ? driversRes.data.drivers : []));
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
        orderBy: "asc",
        status: filterStatus !== "all" ? filterStatus : undefined,
        date: filterDate || undefined
      };
      Object.keys(params).forEach((key) => params[key] === undefined && delete params[key]);

      const response = await getAllTrips(scheduleId, params);
      const tripItems = Array.isArray(response.data?.trips) ?
      response.data.trips :
      Array.isArray(response.data?.trip) ?
      response.data.trip :
      Array.isArray(response.data?.data?.trips) ?
      response.data.data.trips :
      Array.isArray(response.data?.data?.trip) ?
      response.data.data.trip :
      [];
      setTrips(tripItems);
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
  { icon: "check_circle", label: "Hoàn thành", value: trips.filter((trip) => trip.status === "completed").length, tone: "emerald" }],
  [trips]);

  const closeModal = () => {
    setDriverMenuOpen(false);
    setShowModal(false);
    setEditingTrip(null);
    setFormData(emptyForm);
  };

  const openEditModal = (trip) => {
    if (!canEditTrip(trip)) {
      addToast({
        type: "warning",
        title: "Không thể cập nhật chuyến",
        message: "Chỉ có thể cập nhật chuyến khi còn ở trạng thái sắp chạy."
      });
      return;
    }

    const departureDate = getTripDepartureDate(trip);
    const tripPlateNumber = String(getTripPlateNumber(trip)).trim();
    const matchedVehicle = vehicles.find(
      (vehicle) =>
      tripPlateNumber &&
      String(getVehiclePlateNumber(vehicle)).trim().toLowerCase() === tripPlateNumber.toLowerCase()
    );

    setEditingTrip(trip);
    setFormData({
      vehicleId: getTripVehicleId(trip) || matchedVehicle?.id || "",
      driverIds: normalizeDriverIds(getTripDriverIds(trip)),
      departureDate: departureDate ? String(departureDate).split("T")[0] : filterDate || today(),
      status: trip.status || "scheduled"
    });
    setShowModal(true);
  };

  const handleChange = (field, value) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const handleSelectDriver = (driverId) => {
    const normalizedDriverId = Number(driverId);
    if (!Number.isFinite(normalizedDriverId) || normalizedDriverId <= 0) return;

    setFormData((current) => {
      const currentIds = normalizeDriverIds(current.driverIds);
      const exists = currentIds.includes(normalizedDriverId);
      return {
        ...current,
        driverIds: exists ?
        currentIds.filter((id) => id !== normalizedDriverId) :
        [...currentIds, normalizedDriverId]
      };
    });
  };

  const updateFilters = ({ status = filterStatus, date = filterDate } = {}) => {
    setFilterStatus(status);
    setFilterDate(date);
    saveStoredTripFilters(scheduleId, { status, date });

    const nextParams = new URLSearchParams(searchParams);
    if (status && status !== "all") {
      nextParams.set("status", status);
    } else {
      nextParams.delete("status");
    }

    if (date) {
      nextParams.set("date", date);
    } else {
      nextParams.delete("date");
    }

    setSearchParams(nextParams, { replace: true });
  };

  const handleSave = async () => {
    if (!editingTrip) return;

    if (!canEditTrip(editingTrip)) {
      addToast({
        type: "warning",
        title: "Không thể cập nhật chuyến",
        message: "Chuyến đã bắt đầu chạy nên không thể cập nhật tài xế hoặc thông tin chuyến."
      });
      return;
    }

    const selectedDriverIds = normalizeDriverIds(formData.driverIds);

    if (!selectedDriverIds.length || !formData.departureDate) {
      addToast({ type: "warning", title: "Thiếu tài xế hoặc ngày chạy" });
      return;
    }

    if (!formData.vehicleId) {
      addToast({
        type: "error",
        title: "Không xác định được xe hiện tại",
        message: "Backend chưa trả vehicle_id và frontend không tìm được xe theo biển số."
      });
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
      driverIds: selectedDriverIds,
      scheduleId: Number(scheduleId),
      departureDate: formData.departureDate,
      status: formData.status
    };

    try {
      const response = await updateTrip(scheduleId, editingTrip.id, payload);
      const responseTrip = response.data?.trip || response.data?.data?.trip || {};
      const responseDriverIds = normalizeDriverIds(
        responseTrip.driverIds || responseTrip.driver_ids || selectedDriverIds
      );
      setTrips((currentTrips) =>
      currentTrips.map((trip) =>
      Number(trip.id) === Number(editingTrip.id) ?
      { ...trip, ...responseTrip, driverIds: responseDriverIds.length ? responseDriverIds : selectedDriverIds } :
      trip
      )
      );
      const previousDriverIds = normalizeDriverIds(getTripDriverIds(editingTrip));
      const newlyAssignedDriverIds = selectedDriverIds.filter((driverId) => !previousDriverIds.includes(driverId));
      const driverChanged = newlyAssignedDriverIds.length > 0;

      if (driverChanged) {
        try {
          const tripTitle = `${editingTrip.fromLocation || schedule?.fromLocation || "Điểm đi"} → ${
          editingTrip.toLocation || schedule?.toLocation || "Điểm đến"}`;


          await Promise.all(
            newlyAssignedDriverIds.map((driverId) =>
            createNotification({
              userId: driverId,
              title: "Bạn vừa được gán một chuyến",
              body: `Dispatcher đã gán cho bạn chuyến ${tripTitle} ngày ${formatTripDate(formData.departureDate)}.`,
              data: JSON.stringify({
                type: "trip_assigned",
                tripId: Number(editingTrip.id),
                scheduleId: Number(scheduleId),
                path: `/driver/trip/${editingTrip.id}`
              })
            })
            )
          );
        } catch (notificationError) {
          console.warn("Không thể gửi thông báo gán chuyến cho tài xế:", notificationError);
          addToast({
            type: "warning",
            title: "Đã cập nhật chuyến nhưng chưa gửi được thông báo cho tài xế"
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
        message: err.response?.data?.message || "Vui lòng kiểm tra dữ liệu chuyến."
      });
    }
  };

  if (!scheduleId) {
    return (
      <OperatorPageShell title="Chuyến" description="Không tìm thấy lịch biểu.">
        <ErrorState message="Vui lòng chọn lịch biểu trước." />
      </OperatorPageShell>);

  }

  return (
    <OperatorPageShell
      eyebrow="Trips"
      title="Quản lý chuyến"
      description={schedule ? `${schedule.fromLocation} → ${schedule.toLocation}` : "Danh sách chuyến theo lịch biểu."}
      actions={<IconButton icon="arrow_back" label="Quay lại lịch biểu" onClick={() => navigate("/operator/schedules")} />}>
      
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) =>
        <StatCard key={stat.label} {...stat} />
        )}
      </div>

      <ToolbarCard>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[220px_220px_auto]">
          <SelectControl value={filterStatus} onChange={(e) => updateFilters({ status: e.target.value })}>
            <option value="all">Tất cả trạng thái</option>
            <option value="scheduled">Sắp chạy</option>
            <option value="running">Đang chạy</option>
            <option value="completed">Hoàn thành</option>
          </SelectControl>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => updateFilters({ date: e.target.value })}
            className={inputClass} />
          
          <SecondaryButton icon="refresh" onClick={() => {
            updateFilters({ status: "all", date: today() });
          }}>
            Đặt lại
          </SecondaryButton>
        </div>
      </ToolbarCard>

      {loading ?
      <LoadingState /> :
      error ?
      <ErrorState message={error} /> :
      trips.length === 0 ?
      <EmptyState icon="directions_bus" title="Không có chuyến" description="Thử đổi bộ lọc hoặc quay lại lịch biểu khác." /> :

      <div className="overflow-hidden rounded-xl border border-outline-variant/30 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="bg-surface-container-low">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-extrabold uppercase tracking-wide text-on-surface-variant">Chuyến</th>
                  <th className="px-4 py-2.5 text-left text-xs font-extrabold uppercase tracking-wide text-on-surface-variant">Tuyến</th>
                  <th className="px-4 py-2.5 text-left text-xs font-extrabold uppercase tracking-wide text-on-surface-variant">Xe</th>
                  <th className="px-4 py-2.5 text-left text-xs font-extrabold uppercase tracking-wide text-on-surface-variant">Trạng thái</th>
                  <th className="px-4 py-2.5 text-right text-xs font-extrabold uppercase tracking-wide text-on-surface-variant">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/15">
                {trips.map((trip) => {
                const displayDate = getTripDepartureDate(trip) || filterDate;
                const tripDriverIds = normalizeDriverIds(getTripDriverIds(trip));
                const driverNamesFromList = resolveDriversByIds(tripDriverIds, drivers).
                map((driver) => getDriverDisplayName(driver)).
                filter(Boolean);
                const driverNames = getTripDriverNames(trip);
                const driverName =
                (driverNamesFromList.length ? driverNamesFromList : driverNames).join(", ") ||
                getTripDriverName(trip);
                const editable = canEditTrip(trip);

                return (
                  <tr key={trip.id} className="hover:bg-surface-container-low/70">
                    <td className="px-4 py-2.5.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-primary ring-1 ring-emerald-100">
                          <span className="material-symbols-outlined text-xl">directions_bus</span>
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-on-surface">
                            {driverName || "Chưa gán tài xế"}
                          </p>
                          <p className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant">
                            <span className="material-symbols-outlined text-[15px] text-primary">event</span>
                            {displayDate ? formatTripDate(displayDate) : "Chưa có ngày"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2.5.5">
                      <p className="font-bold text-on-surface">{trip.fromLocation} → {trip.toLocation}</p>
                      <p className="mt-1 text-xs font-medium text-on-surface-variant">
                        {Number(trip.distanceKm || 0).toLocaleString("vi-VN")} km
                      </p>
                    </td>
                    <td className="px-4 py-2.5.5">
                      <p className="font-bold text-on-surface">{trip.plateNumber || "Chưa gán xe"}</p>
                      <p className="mt-1 text-xs font-medium text-on-surface-variant">
                        {trip.totalSeats || 0} ghế · {trip.type || "—"}
                      </p>
                    </td>
                    <td className="px-4 py-2.5.5">
                      <StatusBadge tone={statusTone[trip.status] || "slate"}>
                        {statusLabel[trip.status] || trip.status || "—"}
                      </StatusBadge>
                    </td>
                    <td className="px-4 py-2.5.5">
                      <div className="flex justify-end">
                        <IconButton
                          icon="edit"
                          label={editable ? "Sửa chuyến" : "Chỉ sửa được chuyến sắp chạy"}
                          variant={editable ? "primary" : "secondary"}
                          disabled={!editable}
                          onClick={() => openEditModal(trip)}
                        />
                      </div>
                    </td>
                  </tr>);

              })}
              </tbody>
            </table>
          </div>
        </div>
      }

      {showModal && editingTrip &&
      <ModalShell
        title="Cập nhật chuyến"
        subtitle="Chi tiết chuyến"
        onClose={closeModal}
        footer={
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <SecondaryButton onClick={closeModal}>Hủy</SecondaryButton>
              <PrimaryButton icon="save" onClick={handleSave}>Cập nhật</PrimaryButton>
            </div>
        }>
        
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div ref={driverDropdownRef} className="block">
                <span className="mb-2 block text-sm font-bold text-on-surface">Tài xế</span>
                <div className="relative">
                  <button
                  ref={driverTriggerRef}
                  type="button"
                  onClick={() => setDriverMenuOpen((current) => !current)}
                  className="flex min-h-[50px] w-full items-center justify-between gap-3 rounded-lg border border-outline-variant/50 bg-white px-4 py-3 text-left text-sm font-medium text-on-surface outline-none transition-all hover:border-primary/60 focus:border-primary focus:ring-4 focus:ring-primary/10"
                  aria-expanded={driverMenuOpen}>
                  
                    <span className="min-w-0 flex-1">
                      {selectedDrivers.length ?
                    <>
                          <span className="block truncate font-bold">
                            {selectedDrivers.map((driver) => getDriverDisplayName(driver)).join(", ")}
                          </span>
                          <span className="mt-0.5 block truncate text-xs font-medium text-on-surface-variant">
                            {selectedDrivers.length} tài xế đã chọn
                          </span>
                        </> :

                    <span className="text-on-surface-variant">Chọn một hoặc nhiều tài xế</span>
                    }
                    </span>
                    {selectedDrivers.length > 0 &&
                  <span className="hidden shrink-0 items-center gap-1.5 sm:flex">
                        <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-extrabold text-primary ring-1 ring-primary/20">
                          <span className="material-symbols-outlined align-[-3px] text-[15px]">groups</span>
                          <span className="ml-1">{selectedDrivers.length}</span>
                        </span>
                      </span>
                  }
                    <span className="material-symbols-outlined shrink-0 text-[22px] text-on-surface-variant">
                      {driverMenuOpen ? "expand_less" : "expand_more"}
                    </span>
                  </button>

                  {driverMenuOpen &&
                driverMenuPosition &&
                createPortal(
                  <div
                    ref={driverMenuRef}
                    style={{
                      left: driverMenuPosition.left,
                      top: driverMenuPosition.top,
                      width: driverMenuPosition.width,
                      maxHeight: driverMenuPosition.maxHeight
                    }}
                    className="fixed z-[80] overflow-y-auto rounded-xl border border-outline-variant/30 bg-white p-2 shadow-[0_18px_50px_rgba(15,23,42,0.18)]">
                    
                        {drivers.length ?
                    drivers.map((driver, index) => {
                      const selectedIds = normalizeDriverIds(formData.driverIds);
                      const driverSelectId = getDriverSelectedId(driver, selectedIds);
                      const active = Boolean(driverSelectId && selectedIds.includes(driverSelectId));

                      return (
                        <button
                          key={getDriverPrimaryId(driver) || driver.phone || driver.fullName || index}
                          type="button"
                          onClick={() => handleSelectDriver(driverSelectId)}
                          className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                          active ? "bg-primary/10 text-primary" : "text-on-surface hover:bg-surface-container-low"}`
                          }>
                          
                                <span className="min-w-0">
                                  <span className="block truncate text-sm font-bold">
                                    {getDriverDisplayName(driver)}
                                  </span>
                                  <span className="mt-0.5 block truncate text-xs font-medium text-on-surface-variant">
                                    {getDriverPhone(driver)}
                                  </span>
                                </span>
                                <span className="flex shrink-0 items-center gap-1.5">
                                  {active &&
                                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white">
                                      <span className="material-symbols-outlined text-[17px]">check</span>
                                    </span>
                                  }
                                  <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-extrabold text-emerald-700 ring-1 ring-emerald-100">
                                    <span className="material-symbols-outlined align-[-3px] text-[15px]">check</span>
                                    <span className="ml-1">{Number(driver.completedTripCount || 0)}</span>
                                  </span>
                                  <span className="rounded-full bg-red-50 px-2 py-1 text-xs font-extrabold text-red-700 ring-1 ring-red-100">
                                    <span className="material-symbols-outlined align-[-3px] text-[15px]">close</span>
                                    <span className="ml-1">{Number(driver.cancelledTripCount || 0)}</span>
                                  </span>
                                </span>
                              </button>);

                    }) :

                    <div className="px-3 py-4 text-sm font-medium text-on-surface-variant">
                            Không có tài xế phù hợp
                          </div>
                    }
                      </div>,
                  document.body
                )}
                </div>
              </div>
              <Field label="Xe">
                <div className="min-h-[50px] rounded-lg border border-outline-variant/50 bg-surface-container-low px-4 py-3 text-sm font-medium text-on-surface">
                  {selectedVehicle ?
                <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-bold">
                          {getVehiclePlateNumber(selectedVehicle) || selectedVehicle.plateNumber || "Xe hiện tại"}
                        </p>
                        <p className="mt-0.5 text-xs text-on-surface-variant">
                          {Number(selectedVehicle.totalSeats || selectedVehicle.total_seats || 0)} ghế
                        </p>
                      </div>
                      <span className="material-symbols-outlined shrink-0 text-[22px] text-on-surface-variant">
                        lock
                      </span>
                    </div> :

                <div className="flex items-center justify-between gap-3 text-on-surface-variant">
                      <span>Không tìm thấy xe hiện tại</span>
                      <span className="material-symbols-outlined shrink-0 text-[22px]">warning</span>
                    </div>
                }
                </div>
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Ngày chạy">
                <input
                type="date"
                value={formData.departureDate}
                onChange={(e) => handleChange("departureDate", e.target.value)}
                className={inputClass} />
              
              </Field>
              <Field label="Trạng thái">
                <SelectControl value={formData.status} onChange={(e) => handleChange("status", e.target.value)}>
                  <option value="scheduled">Sắp chạy</option>
                  <option value="running">Đang chạy</option>
                  <option value="completed">Hoàn thành</option>
                </SelectControl>
              </Field>
            </div>
          </div>
        </ModalShell>
      }
    </OperatorPageShell>);

}
