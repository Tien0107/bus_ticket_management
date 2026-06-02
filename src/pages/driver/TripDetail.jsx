import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { getAllTripPassengers, getDriverTripsAllStatuses, getTripRoute, updateTrip } from "../../api/driver";
import { useToast } from "../../context/ToastContext";
import PassengerList from "../../components/driver/PassengerList";
import CheckInPanel from "../../components/driver/CheckInPanel";

const normalizeStatus = (status) => {
  const map = {
    pending: "scheduled",
    upcoming: "scheduled",
    scheduled: "scheduled",
    in_progress: "running",
    running: "running",
    completed: "completed",
    cancelled: "cancelled",
  };

  return map[status] || "scheduled";
};

const statusMeta = {
  scheduled: {
    label: "Sắp khởi hành",
    icon: "event_upcoming",
    badge: "bg-sky-50 text-sky-700 ring-sky-100",
  },
  running: {
    label: "Đang chạy",
    icon: "directions_bus",
    badge: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  },
  completed: {
    label: "Hoàn thành",
    icon: "check_circle",
    badge: "bg-slate-100 text-slate-700 ring-slate-200",
  },
  cancelled: {
    label: "Đã hủy",
    icon: "cancel",
    badge: "bg-red-50 text-red-700 ring-red-100",
  },
};

const formatDate = (value) => {
  if (!value) return "Chưa có ngày";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
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
const wait = (duration) => new Promise((resolve) => setTimeout(resolve, duration));

const isCheckedInStatus = (status) => {
  const normalizedStatus = String(status || "").toLowerCase();
  return ["checked_in", "checked-in", "checkedin", "confirmed", "present"].includes(normalizedStatus);
};

const normalizeTrip = (trip = {}) => {
  const rawPassengerCount = trip.passengerCount ?? trip.passenger_count ?? trip.ticketCount ?? trip.ticket_count;

  return {
    ...trip,
    status: normalizeStatus(trip.status),
    departure: trip.fromLocation || trip.departure || "Điểm đi",
    destination: trip.toLocation || trip.destination || "Điểm đến",
    departureTime: trip.departureTime || "--:--",
    departureDate: trip.departureDate || trip.date || "",
    displayDate: formatDate(trip.departureDate || trip.date),
    passengerCount: Number(rawPassengerCount || 0),
    hasPassengerCount: rawPassengerCount !== undefined && rawPassengerCount !== null,
    totalSeats: Number(trip.totalSeats || 45),
    distanceKm: Number(trip.distanceKm || trip.distance_km || 0),
    durationMinutes: Number(trip.durationMinutes || trip.duration_minutes || 0),
  };
};

const normalizePassengers = (rawPassengers) => {
  if (!Array.isArray(rawPassengers)) return [];

  return rawPassengers.map((passenger) => {
    const checkInStatus =
      passenger.checkInStatus ||
      passenger.checkinStatus ||
      passenger.check_in_status ||
      passenger.status ||
      passenger.ticket?.checkInStatus ||
      passenger.Ticket?.checkInStatus ||
      "pending";
    const ticketStatus =
      passenger.ticketStatus ||
      passenger.ticket?.status ||
      passenger.Ticket?.status ||
      passenger.booking?.status ||
      passenger.Booking?.status ||
      "pending";
    const normalizedCheckInStatus = String(checkInStatus).toLowerCase();
    const normalizedTicketStatus = String(ticketStatus).toLowerCase();
    const checkedIn =
      passenger.checkedIn ||
      passenger.isCheckedIn ||
      isCheckedInStatus(normalizedCheckInStatus) ||
      isCheckedInStatus(normalizedTicketStatus);

    const passengerId =
      passenger.passengerId ||
      passenger.passenger_id ||
      passenger.customerId ||
      passenger.customer_id ||
      passenger.userId ||
      passenger.user_id ||
      passenger.id ||
      passenger.ticketId;

    return {
      id: passengerId,
      ticketId: passenger.ticketId || passenger.ticket?.id || passenger.Ticket?.id || passenger.id,
      name: passenger.name || passenger.fullName || passenger.passengerName || "Chưa có tên",
      phone: passenger.phone || passenger.phoneNumber || "Chưa có SĐT",
      ticket: passenger.ticket || passenger.ticketNumber || passenger.bookingCode || `#${passenger.id || ""}`,
      seat: passenger.seat || passenger.seatNumber || passenger.seatCode || "N/A",
      pickupPoint: passenger.pickup || passenger.pickupPoint || passenger.pickupStation || passenger.fromStation || "Chưa có điểm lên",
      dropoffPoint: passenger.dropoff || passenger.dropoffPoint || passenger.dropoffStation || passenger.toStation || "Chưa có điểm xuống",
      rawStatus: checkInStatus,
      ticketStatus,
      status: checkedIn ? "checked_in" : normalizedCheckInStatus === "no_show" ? "no_show" : "pending",
    };
  });
};

const normalizeRoute = (rawRoute) => {
  const stops = Array.isArray(rawRoute)
    ? rawRoute
    : Array.isArray(rawRoute?.stops)
    ? rawRoute.stops
    : Array.isArray(rawRoute?.route)
    ? rawRoute.route
    : [];

  return stops.map((stop) => ({
    name: stop.name || stop.address || stop.stationName || "Điểm dừng",
    address: stop.address || stop.stationAddress || "",
    city: stop.city || "",
    stopOrder: stop.stopOrder,
    time: stop.time || stop.arrivalTime || stop.departureTime || "",
  })).sort((a, b) => (a.stopOrder ?? 0) - (b.stopOrder ?? 0));
};

const InfoTile = ({ label, value, icon }) => (
  <div className="rounded-lg bg-surface-container-low p-4">
    <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-white text-primary">
      <span className="material-symbols-outlined text-[22px] leading-none">{icon}</span>
    </div>
    <p className="text-sm text-on-surface-variant">{label}</p>
    <p className="mt-1 font-bold text-on-surface">{value}</p>
  </div>
);

export default function TripDetail() {
  const { tripId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const stateTrip =
    location.state?.trip && String(location.state.trip.id) === String(tripId)
      ? location.state.trip
      : null;
  const stateTripDate =
    location.state?.tripDate ||
    stateTrip?.departureDate?.split("T")[0] ||
    stateTrip?.date ||
    "";

  const [trip, setTrip] = useState(null);
  const [passengers, setPassengers] = useState([]);
  const [route, setRoute] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCheckInPanel, setShowCheckInPanel] = useState(false);
  const [selectedPassengerId, setSelectedPassengerId] = useState(null);
  const [updating, setUpdating] = useState(false);

  const fetchTripDetails = useCallback(async ({ silent = false, apply = true } = {}) => {
    try {
      if (!silent) setLoading(true);

      const today = new Date().toISOString().split("T")[0];
      const dateCandidates = [stateTripDate, today, null].filter(
        (value, index, array) => index === array.findIndex((item) => item === value)
      );
      const tripPromise = (async () => {
        if (stateTrip) return stateTrip;

        for (const date of dateCandidates) {
          const response = await getDriverTripsAllStatuses(date);
          const allTrips = Array.isArray(response.data?.trips)
            ? response.data.trips
            : Array.isArray(response.data?.data)
            ? response.data.data
            : [];
          const matchedTrip = allTrips.find((item) => String(item.id) === String(tripId));
          if (matchedTrip) return matchedTrip;
        }

        return null;
      })();

      const [tripData, passengersRes, routeRes] = await Promise.all([
        tripPromise,
        getAllTripPassengers(tripId, { limit: 100 }),
        getTripRoute(tripId),
      ]);

      if (!tripData) {
        if (apply) setError("Không tìm thấy chuyến");
        return [];
      }

      const rawPassengers = Array.isArray(passengersRes.data?.passengers)
        ? passengersRes.data.passengers
        : Array.isArray(passengersRes.data)
        ? passengersRes.data
        : [];

      const rawRoute = routeRes.data?.route || routeRes.data?.stops || routeRes.data || [];

      const normalizedPassengers = normalizePassengers(rawPassengers);

      if (apply) {
        setTrip(normalizeTrip(tripData));
        setPassengers(normalizedPassengers);
        setRoute(normalizeRoute(rawRoute));
        setError(null);
      }

      return normalizedPassengers;
    } catch {
      if (apply) setError("Không thể tải chi tiết chuyến");
      return [];
    } finally {
      if (!silent) setLoading(false);
    }
  }, [stateTrip, stateTripDate, tripId]);

  useEffect(() => {
    fetchTripDetails();
  }, [fetchTripDetails]);

  const handleStartTrip = async () => {
    try {
      setUpdating(true);
      await updateTrip(tripId, { status: "running" });
      setTrip((current) => ({ ...current, status: "running" }));
      addToast("Bắt đầu chuyến thành công", "success");
    } catch {
      addToast("Bắt đầu chuyến thất bại", "error");
    } finally {
      setUpdating(false);
    }
  };

  const handleCompleteTrip = async () => {
    if (pendingCount > 0) {
      addToast(`Còn ${pendingCount} hành khách chưa check-in. Vui lòng check-in hết trước khi kết thúc chuyến.`, "warning");
      return;
    }

    try {
      setUpdating(true);
      await updateTrip(tripId, { status: "completed" });
      setTrip((current) => ({ ...current, status: "completed" }));
      addToast("Hoàn thành chuyến thành công", "success");
    } catch (error) {
      addToast(error.response?.data?.message || "Hoàn thành chuyến thất bại", "error");
    } finally {
      setUpdating(false);
    }
  };

  const handleOpenCheckIn = (passengerId = null) => {
    setSelectedPassengerId(passengerId);
    setShowCheckInPanel(true);
  };

  const handleCheckInSuccess = async (passengerId, ticket) => {
    const checkedPassengerId = passengerId || selectedPassengerId;

    if (!checkedPassengerId) return false;

    setPassengers((currentPassengers) =>
      currentPassengers.map((passenger) =>
        Number(passenger.id) === Number(checkedPassengerId)
          ? { ...passenger, rawStatus: "checked_in", ticketStatus: ticket?.status || passenger.ticketStatus, status: "checked_in" }
          : passenger
      )
    );

    addToast("Check-in thành công", "success");
    setShowCheckInPanel(false);
    setSelectedPassengerId(null);

    await wait(500);
    const refreshedPassengers = await fetchTripDetails({ silent: true, apply: false });
    const refreshedPassenger = refreshedPassengers.find(
      (passenger) => Number(passenger.id) === Number(checkedPassengerId)
    );

    if (refreshedPassenger?.status === "checked_in") {
      await fetchTripDetails({ silent: true });
    }

    return true;
  };

  const checkedInCount = useMemo(
    () => passengers.filter((passenger) => passenger.status === "checked_in").length,
    [passengers]
  );
  const pendingCount = Math.max(passengers.length - checkedInCount, 0);
  const checkInProgress = passengers.length ? Math.round((checkedInCount / passengers.length) * 100) : 0;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface p-4">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
          <p className="mt-3 text-sm text-on-surface-variant">Đang tải chuyến...</p>
        </div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen bg-surface p-4 lg:p-6">
        <button
          type="button"
          onClick={() => navigate("/driver/dashboard")}
          className="mb-4 inline-flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 text-sm font-bold text-primary shadow-sm"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Quay lại
        </button>
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-center font-medium text-red-700">
          {error}
        </div>
      </div>
    );
  }

  const currentStatus = statusMeta[trip.status] || statusMeta.scheduled;

  return (
    <div className="min-h-screen bg-surface px-4 py-4 lg:px-6">
      <div className="mx-auto max-w-7xl">
        <button
          type="button"
          onClick={() => navigate("/driver/dashboard")}
          className="mb-4 inline-flex items-center gap-2 rounded-lg border border-outline-variant/40 bg-white px-3 py-1.5 text-sm font-bold text-on-surface transition-colors hover:bg-surface-container-low"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Quay lại
        </button>

        <section className="rounded-xl border border-outline-variant/30 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${currentStatus.badge}`}>
                <span className="material-symbols-outlined text-[16px]">{currentStatus.icon}</span>
                {currentStatus.label}
              </span>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-on-surface lg:text-3xl">
                {trip.departure} → {trip.destination}
              </h1>
              <p className="mt-2 text-on-surface-variant">{trip.displayDate} · Xuất bến {trip.departureTime}</p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              {trip.status === "scheduled" && (
                <button
                  type="button"
                  onClick={handleStartTrip}
                  disabled={updating}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
                >
                  <span className="material-symbols-outlined text-[20px]">play_arrow</span>
                  Bắt đầu chuyến
                </button>
              )}
              {trip.status === "running" && (
                <button
                  type="button"
                  onClick={handleCompleteTrip}
                  disabled={updating}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
                >
                  <span className="material-symbols-outlined text-[20px]">task_alt</span>
                  Kết thúc chuyến
                </button>
              )}
              {trip.status !== "completed" && trip.status !== "cancelled" && (
                <button
                  type="button"
                  onClick={() => handleOpenCheckIn()}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-outline-variant/50 bg-white px-5 py-3 text-sm font-bold text-on-surface transition-colors hover:bg-surface-container-low"
                >
                  <span className="material-symbols-outlined text-[20px]">how_to_reg</span>
                  Check-in
                </button>
              )}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <InfoTile icon="confirmation_number" label="Hành khách" value={`${passengers.length || trip.passengerCount}/${trip.totalSeats}`} />
            <InfoTile icon="task_alt" label="Đã check-in" value={`${checkedInCount}/${passengers.length || trip.passengerCount || 0}`} />
            <InfoTile icon="directions_bus" label="Biển số" value={trip.plateNumber || trip.vehicleNumber || "Chưa gán"} />
            <InfoTile icon="schedule" label="Thời lượng" value={formatDuration(trip.durationMinutes)} />
          </div>

          <div className="mt-4 rounded-xl bg-surface-container-low p-3">
            <div className="mb-3 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-on-surface">Tiến độ check-in</p>
                <p className="mt-1 text-sm text-on-surface-variant">{pendingCount} hành khách còn chờ xác nhận</p>
              </div>
              <p className="text-2xl font-bold text-primary">{checkInProgress}%</p>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-white">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${checkInProgress}%` }} />
            </div>
          </div>
        </section>

        <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[1fr_360px]">
          <PassengerList passengers={passengers} onCheckIn={handleOpenCheckIn} />

          <aside className="rounded-xl border border-outline-variant/30 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-on-surface">Tuyến đường</h2>
                <p className="mt-1 text-sm text-on-surface-variant">{route.length} điểm dừng</p>
              </div>
              <span className="material-symbols-outlined text-primary">route</span>
            </div>

            {route.length > 0 ? (
              <div className="space-y-0">
                {route.map((stop, index) => {
                  const first = index === 0;
                  const last = index === route.length - 1;

                  return (
                    <div key={`${stop.name}-${index}`} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                          first ? "bg-emerald-500 text-white" : last ? "bg-red-500 text-white" : "bg-primary/10 text-primary"
                        }`}>
                          {index + 1}
                        </div>
                        {!last && <div className="h-14 w-px bg-outline-variant/60" />}
                      </div>
                      <div className="min-w-0 pb-5">
                        <p className="truncate font-semibold text-on-surface">{stop.name}</p>
                        <p className="mt-1 truncate text-sm text-on-surface-variant">{stop.address || stop.city || "Chưa có địa chỉ"}</p>
                        {stop.time && <p className="mt-1 text-xs font-medium text-primary">{stop.time}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-outline-variant/50 p-4 text-center">
                <span className="material-symbols-outlined text-4xl text-outline">route</span>
                <p className="mt-2 text-sm text-on-surface-variant">Chưa có dữ liệu tuyến đường</p>
              </div>
            )}
          </aside>
        </div>
      </div>

      <CheckInPanel
        tripId={tripId}
        passengers={passengers}
        isOpen={showCheckInPanel}
        initialPassengerId={selectedPassengerId}
        onClose={() => setShowCheckInPanel(false)}
        onCheckInSuccess={handleCheckInSuccess}
      />
    </div>
  );
}
