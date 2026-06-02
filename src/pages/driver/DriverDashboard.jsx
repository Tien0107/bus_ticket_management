import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getAllTripPassengers, getDriverStats, getDriverTripsAllStatuses } from "../../api/driver";

const statusMeta = {
  scheduled: {
    label: "Sắp khởi hành",
    icon: "event_upcoming",
    badge: "bg-sky-50 text-sky-700 ring-sky-100",
    dot: "bg-sky-500",
  },
  running: {
    label: "Đang chạy",
    icon: "directions_bus",
    badge: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    dot: "bg-emerald-500",
  },
  completed: {
    label: "Hoàn thành",
    icon: "check_circle",
    badge: "bg-slate-100 text-slate-700 ring-slate-200",
    dot: "bg-slate-400",
  },
  cancelled: {
    label: "Đã hủy",
    icon: "cancel",
    badge: "bg-red-50 text-red-700 ring-red-100",
    dot: "bg-red-500",
  },
};

const normalizeStatus = (status) => {
  const statusMap = {
    pending: "scheduled",
    upcoming: "scheduled",
    scheduled: "scheduled",
    in_progress: "running",
    running: "running",
    completed: "completed",
    cancelled: "cancelled",
  };

  return statusMap[status] || "scheduled";
};

const formatDate = (value) => {
  if (!value) return "Chưa có ngày";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("vi-VN", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  });
};

const formatDuration = (minutes) => {
  const totalMinutes = Number(minutes || 0);
  if (!totalMinutes) return "--";

  const hours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;
  if (!hours) return `${remainingMinutes} phút`;
  if (!remainingMinutes) return `${hours} giờ`;
  return `${hours} giờ ${remainingMinutes} phút`;
};

const normalizeTrip = (trip) => {
  const status = normalizeStatus(trip.status);
  const rawPassengerCount = trip.passengerCount ?? trip.passenger_count ?? trip.ticketCount ?? trip.ticket_count;

  return {
    ...trip,
    status,
    date: trip.departureDate?.split("T")[0] || trip.date || "",
    displayDate: formatDate(trip.departureDate || trip.date),
    departure: trip.fromLocation || trip.departure || "Điểm đi",
    destination: trip.toLocation || trip.destination || "Điểm đến",
    passengerCount: Number(rawPassengerCount || 0),
    hasPassengerCount: rawPassengerCount !== undefined && rawPassengerCount !== null,
    totalSeats: Number(trip.totalSeats || 45),
    distanceKm: Number(trip.distanceKm || trip.distance_km || 0),
    durationMinutes: Number(trip.durationMinutes || trip.duration_minutes || 0),
    departureTime: trip.departureTime || "--:--",
  };
};

const StatCard = ({ icon, label, value, tone = "text-primary" }) => (
  <div className="rounded-xl border border-outline-variant/30 bg-white p-4 shadow-sm">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-xs font-medium text-on-surface-variant">{label}</p>
        <p className={`mt-0.5 text-2xl font-bold tracking-tight ${tone}`}>{value}</p>
      </div>
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <span className="material-symbols-outlined text-[20px] leading-none">{icon}</span>
      </div>
    </div>
  </div>
);

const TripCard = ({ trip }) => {
  const meta = statusMeta[trip.status] || statusMeta.scheduled;
  const occupancy = trip.hasPassengerCount && trip.totalSeats
    ? Math.min(100, Math.round((trip.passengerCount / trip.totalSeats) * 100))
    : 0;

  return (
    <Link
      to={`/driver/trip/${trip.id}`}
      state={{
        trip,
        tripDate: trip.date || trip.departureDate?.split("T")[0] || "",
      }}
      className="group block rounded-xl border border-outline-variant/30 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-editorial"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${meta.badge}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
              {meta.label}
            </span>
            <span className="text-[10px] font-medium text-on-surface-variant">{trip.displayDate}</span>
            <span className="text-[10px] font-medium text-on-surface-variant">{trip.departureTime}</span>
          </div>

          <div className="flex min-w-0 items-center gap-2">
            <div className="min-w-0">
              <p className="truncate text-base font-bold text-on-surface">{trip.departure}</p>
              <p className="mt-0.5 truncate text-base font-bold text-on-surface">{trip.destination}</p>
            </div>
            <span className="material-symbols-outlined shrink-0 text-primary transition-transform group-hover:translate-x-1 text-lg">
              arrow_forward
            </span>
          </div>
        </div>

        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-container-low text-primary">
          <span className="material-symbols-outlined text-[18px] leading-none">{meta.icon}</span>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
        <div>
          <p className="text-on-surface-variant">Ghế</p>
          <p className="mt-0.5 font-semibold text-on-surface">
            {trip.hasPassengerCount ? trip.passengerCount : "--"}/{trip.totalSeats}
          </p>
        </div>
        <div>
          <p className="text-on-surface-variant">Thời lượng</p>
          <p className="mt-0.5 font-semibold text-on-surface">{formatDuration(trip.durationMinutes)}</p>
        </div>
        <div>
          <p className="text-on-surface-variant">Xe</p>
          <p className="mt-0.5 truncate font-semibold text-on-surface">{trip.plateNumber || trip.vehicleNumber || "Chưa gán"}</p>
        </div>
      </div>

      <div className="mt-2">
        <div className="h-2 overflow-hidden rounded-full bg-surface-container-high">
          <div className="h-full rounded-full bg-primary" style={{ width: `${occupancy}%` }} />
        </div>
      </div>
    </Link>
  );
};

const DriverDashboard = () => {
  const [user, setUser] = useState(null);
  const [trips, setTrips] = useState([]);
  const [driverStats, setDriverStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("scheduled");
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) setUser(JSON.parse(stored));
  }, []);

  useEffect(() => {
    fetchTrips(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    fetchDriverStats();
  }, []);

  const fetchTrips = async (date) => {
    try {
      setLoading(true);
      const response = await getDriverTripsAllStatuses(date);
      const tripsData = Array.isArray(response.data?.trips)
        ? response.data.trips
        : Array.isArray(response.data?.data)
        ? response.data.data
        : [];

      const enrichedTrips = await Promise.all(
        tripsData.map(async (trip) => {
          const normalizedTrip = normalizeTrip(trip);
          if (normalizedTrip.hasPassengerCount || !trip.id) return normalizedTrip;

          try {
            const passengersRes = await getAllTripPassengers(trip.id, { limit: 100 });
            const passengers = Array.isArray(passengersRes.data?.passengers) ? passengersRes.data.passengers : [];
            return normalizeTrip({ ...trip, passengerCount: passengers.length });
          } catch {
            return normalizedTrip;
          }
        })
      );

      setTrips(enrichedTrips);
      setError(null);
    } catch {
      setError("Không thể tải danh sách chuyến");
    } finally {
      setLoading(false);
    }
  };

  const fetchDriverStats = async () => {
    try {
      const response = await getDriverStats();
      setDriverStats(response.data?.current || null);
    } catch {
      setDriverStats(null);
    }
  };

  const groupedTrips = useMemo(() => ({
    scheduled: trips.filter((trip) => trip.status === "scheduled"),
    running: trips.filter((trip) => trip.status === "running"),
    completed: trips.filter((trip) => trip.status === "completed"),
  }), [trips]);

  const stats = useMemo(() => ({
    scheduled: groupedTrips.scheduled.length,
    running: groupedTrips.running.length,
    passengers: trips.reduce((sum, trip) => sum + trip.passengerCount, 0),
    completedMonth: Number(driverStats?.completedTripCount || 0),
    cancelledMonth: Number(driverStats?.cancelledTripCount || 0),
  }), [driverStats, groupedTrips, trips]);

  const tabs = [
    { id: "scheduled", label: "Sắp chạy", icon: "event_upcoming", count: groupedTrips.scheduled.length },
    { id: "running", label: "Đang chạy", icon: "directions_bus", count: groupedTrips.running.length },
    { id: "completed", label: "Hoàn thành", icon: "check_circle", count: groupedTrips.completed.length },
  ];

  const activeTrips = groupedTrips[activeTab] || [];
  const activeTrip = groupedTrips.running[0];

  return (
    <div className="min-h-screen bg-surface px-4 py-4 lg:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">Bảng điều khiển tài xế</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-on-surface lg:text-3xl">
              Xin chào, {user?.fullName || "Tài xế"}
            </h1>
            <p className="mt-1 text-sm text-on-surface-variant">Theo dõi chuyến, hành khách và trạng thái vận hành trong ngày.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-lg border border-outline-variant/50 bg-white px-2.5 py-1.5">
              <span className="material-symbols-outlined text-on-surface-variant text-[18px]">calendar_today</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="border-none bg-transparent text-sm font-semibold outline-none"
              />
            </div>
            <button
              type="button"
              onClick={() => fetchTrips(selectedDate)}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-outline-variant/50 bg-white px-3 py-1.5 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-low"
            >
              <span className="material-symbols-outlined text-[20px]">refresh</span>
              Tải lại
            </button>
          </div>
        </div>

        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard icon="event_upcoming" label="Chuyến sắp chạy" value={stats.scheduled} />
          <StatCard icon="directions_bus" label="Đang chạy" value={stats.running} tone="text-emerald-600" />
          <StatCard icon="groups" label="Tổng hành khách" value={stats.passengers} />
          <StatCard icon="task_alt" label="Hoàn thành tháng" value={stats.completedMonth} tone="text-slate-700" />
          <StatCard icon="cancel" label="Đã hủy tháng" value={stats.cancelledMonth} tone="text-red-600" />
        </div>

        {activeTrip && (
          <div className="mb-4 rounded-xl bg-primary p-4 text-white shadow-editorial">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white/80">Chuyến đang chạy</p>
                <h2 className="mt-1 truncate text-2xl font-bold">
                  {activeTrip.departure} → {activeTrip.destination}
                </h2>
                <p className="mt-2 text-sm text-white/85">
                  {activeTrip.departureTime} · {activeTrip.hasPassengerCount ? activeTrip.passengerCount : "--"}/{activeTrip.totalSeats} hành khách
                </p>
              </div>
              <Link
                to={`/driver/trip/${activeTrip.id}`}
                state={{
                  trip: activeTrip,
                  tripDate: activeTrip.date || activeTrip.departureDate?.split("T")[0] || "",
                }}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-3 text-sm font-bold text-primary transition-opacity hover:opacity-90"
              >
                Mở chuyến
                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
              </Link>
            </div>
          </div>
        )}

        <div className="rounded-xl border border-outline-variant/30 bg-white p-2 shadow-sm">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition-colors sm:flex-none ${
                  activeTab === tab.id
                    ? "bg-primary text-white"
                    : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">{tab.icon}</span>
                {tab.label}
                <span className={activeTab === tab.id ? "text-white/80" : "text-on-surface-variant"}>({tab.count})</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6">
          {loading ? (
            <div className="flex min-h-[200px] items-center justify-center rounded-xl border border-outline-variant/30 bg-white">
              <div className="text-center">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
                <p className="mt-3 text-sm text-on-surface-variant">Đang tải chuyến...</p>
              </div>
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center font-medium text-red-700">
              {error}
            </div>
          ) : activeTrips.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
              {activeTrips.map((trip) => (
                <TripCard key={trip.id} trip={trip} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-outline-variant/60 bg-white p-6 text-center">
              <span className="material-symbols-outlined text-4xl text-outline">event_busy</span>
              <p className="mt-2 text-sm font-semibold text-on-surface">Không có chuyến</p>
              <p className="mt-0.5 text-xs text-on-surface-variant">Danh sách này hiện chưa có chuyến phù hợp.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DriverDashboard;
