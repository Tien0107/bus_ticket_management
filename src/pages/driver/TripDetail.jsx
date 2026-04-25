import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getTripDetail, getTripPassengers, getTripRoute, updateTrip } from "../../api/driver";
import { useToast } from "../../context/ToastContext";
import PassengerList from "../../components/driver/PassengerList";
import CheckInPanel from "../../components/driver/CheckInPanel";

export default function TripDetail() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  
  const [trip, setTrip] = useState(null);
  const [passengers, setPassengers] = useState([]);
  const [route, setRoute] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCheckInPanel, setShowCheckInPanel] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchTripDetails();
  }, [tripId]);

  const fetchTripDetails = async () => {
    try {
      setLoading(true);
      const [tripRes, passengersRes, routeRes] = await Promise.all([
        getTripDetail(tripId),
        getTripPassengers(tripId),
        getTripRoute(tripId),
      ]);
      
      setTrip(tripRes.data?.trip || tripRes.data);
      setPassengers(Array.isArray(passengersRes.data?.passengers) ? passengersRes.data.passengers : []);
      setRoute(routeRes.data?.route || routeRes.data);
      setError(null);
    } catch (err) {
      console.error("Lỗi tải chi tiết chuyến:", err);
      setError("Không thể tải chi tiết chuyến");
    } finally {
      setLoading(false);
    }
  };

  const handleStartTrip = async () => {
    try {
      setUpdating(true);
      await updateTrip(tripId, { status: "in_progress" });
      addToast("Bắt đầu chuyến thành công", "success");
      setTrip({ ...trip, status: "in_progress" });
    } catch (err) {
      console.error("Lỗi bắt đầu chuyến:", err);
      addToast("Bắt đầu chuyến thất bại", "error");
    } finally {
      setUpdating(false);
    }
  };

  const handleCompleteTrip = async () => {
    try {
      setUpdating(true);
      await updateTrip(tripId, { status: "completed" });
      addToast("Hoàn thành chuyến thành công", "success");
      setTrip({ ...trip, status: "completed" });
    } catch (err) {
      console.error("Lỗi hoàn thành chuyến:", err);
      addToast("Hoàn thành chuyến thất bại", "error");
    } finally {
      setUpdating(false);
    }
  };

  const handleCheckInSuccess = () => {
    fetchTripDetails();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface p-6 lg:p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <p className="text-on-surface-variant mt-4">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen bg-surface p-6 lg:p-8">
        <button
          onClick={() => navigate("/driver/dashboard")}
          className="mb-6 flex items-center gap-2 text-primary font-bold hover:opacity-80 transition-all"
        >
          <span className="material-symbols-outlined">arrow_back</span>
          Quay lại
        </button>
        <div className="bg-red-50 border border-red-200 text-red-600 p-6 rounded-2xl text-center">
          {error}
        </div>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { label: "Sắp tới", color: "bg-blue-100 text-blue-700" },
      upcoming: { label: "Sắp tới", color: "bg-blue-100 text-blue-700" },
      in_progress: { label: "Đang chạy", color: "bg-green-100 text-green-700" },
      completed: { label: "Hoàn thành", color: "bg-gray-100 text-gray-700" },
      cancelled: { label: "Hủy", color: "bg-red-100 text-red-700" },
    };
    const info = statusMap[status] || statusMap.pending;
    return info;
  };

  const statusBadge = getStatusBadge(trip.status);
  const checkedInCount = passengers.filter((p) => p.status === "checked_in").length;

  return (
    <div className="min-h-screen bg-surface p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate("/driver/dashboard")}
          className="mb-6 flex items-center gap-2 text-primary font-bold hover:opacity-80 transition-all"
        >
          <span className="material-symbols-outlined">arrow_back</span>
          Quay lại
        </button>

        {/* Header */}
        <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-sm mb-6">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className={`px-4 py-2 rounded-full text-sm font-bold ${statusBadge.color}`}>
                  {statusBadge.label}
                </span>
                <span className="text-on-surface-variant">{trip.date} - {trip.departureTime}</span>
              </div>
              <h1 className="text-4xl font-extrabold text-on-surface mb-2">
                {trip.departure} → {trip.destination}
              </h1>
              <p className="text-on-surface-variant">Biển số xe: <span className="font-semibold">{trip.vehicleNumber}</span></p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-primary mb-1">
                ₫{(trip.revenue || 0).toLocaleString()}
              </p>
              <p className="text-on-surface-variant text-sm">Doanh thu</p>
            </div>
          </div>

          {/* Trip Info Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-surface-container-low rounded-xl p-4">
              <p className="text-on-surface-variant text-sm mb-1">Thời gian dự tính</p>
              <p className="font-bold text-on-surface">{trip.estimatedDuration || "3h 30p"}</p>
            </div>
            <div className="bg-surface-container-low rounded-xl p-4">
              <p className="text-on-surface-variant text-sm mb-1">Ghế</p>
              <p className="font-bold text-on-surface">
                {trip.passengerCount}/{trip.totalSeats}
              </p>
            </div>
            <div className="bg-surface-container-low rounded-xl p-4">
              <p className="text-on-surface-variant text-sm mb-1">Check-in</p>
              <p className="font-bold text-green-600">{checkedInCount}/{trip.passengerCount}</p>
            </div>
            <div className="bg-surface-container-low rounded-xl p-4">
              <p className="text-on-surface-variant text-sm mb-1">Tài xế</p>
              <p className="font-bold text-on-surface">{trip.driverName || "Bạn"}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {trip.status === "pending" || trip.status === "upcoming" ? (
            <button
              onClick={handleStartTrip}
              disabled={updating}
              className="bg-primary text-white px-6 py-4 rounded-xl font-bold hover:bg-primary/80 disabled:opacity-60 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">play_arrow</span>
              Bắt đầu chuyến
            </button>
          ) : trip.status === "in_progress" ? (
            <button
              onClick={handleCompleteTrip}
              disabled={updating}
              className="bg-green-600 text-white px-6 py-4 rounded-xl font-bold hover:bg-green-700 disabled:opacity-60 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">check_circle</span>
              Kết thúc chuyến
            </button>
          ) : null}

          {trip.status === "in_progress" || trip.status === "pending" || trip.status === "upcoming" ? (
            <button
              onClick={() => setShowCheckInPanel(true)}
              className="bg-secondary text-on-secondary px-6 py-4 rounded-xl font-bold hover:bg-secondary/80 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">how_to_reg</span>
              Check-in hành khách
            </button>
          ) : null}
        </div>

        {/* Passenger List */}
        <PassengerList
          passengers={passengers}
          tripId={tripId}
          onCheckIn={() => setShowCheckInPanel(true)}
        />

        {/* Route Info */}
        {route && (
          <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-sm mt-6">
            <h3 className="text-xl font-bold text-on-surface mb-4">Tuyến đường</h3>
            <div className="space-y-4">
              {route.stops && route.stops.map((stop, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      idx === 0 ? "bg-green-500 text-white" : idx === route.stops.length - 1 ? "bg-red-500 text-white" : "bg-primary-container text-primary"
                    }`}>
                      {idx + 1}
                    </div>
                    {idx < route.stops.length - 1 && <div className="w-1 h-12 bg-outline-variant mt-2"></div>}
                  </div>
                  <div className="pt-1">
                    <p className="font-bold text-on-surface">{stop.name}</p>
                    <p className="text-sm text-on-surface-variant">{stop.address}</p>
                    <p className="text-xs text-on-surface-variant mt-1">{stop.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Check-in Panel */}
      <CheckInPanel
        tripId={tripId}
        passengers={passengers}
        isOpen={showCheckInPanel}
        onClose={() => setShowCheckInPanel(false)}
        onCheckInSuccess={handleCheckInSuccess}
      />
    </div>
  );
}