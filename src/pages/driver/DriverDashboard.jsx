import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getDriverTrips } from "../../api/driver";

const DriverDashboard = () => {
  const [user, setUser] = useState(null);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("upcoming"); // upcoming, inprogress, completed

  useEffect(() => {
    // Lấy user info
    const stored = localStorage.getItem("user");
    if (stored) setUser(JSON.parse(stored));

    // Lấy danh sách chuyến
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    try {
      setLoading(true);
      
      const response = await getDriverTrips();
      let tripsData = Array.isArray(response.data?.trips) 
        ? response.data.trips 
        : Array.isArray(response.data?.data) 
        ? response.data.data 
        : [];
      
      // Transform API data to match frontend format
      tripsData = tripsData.map(trip => ({
        ...trip,
        date: trip.departureDate?.split('T')[0], // "2026-04-11"
        departure: trip.fromLocation,
        destination: trip.toLocation,
        status: trip.status || 'scheduled', // Default: scheduled nếu API không trả về
        passengerCount: trip.passengerCount || 0,
        revenue: trip.revenue || 0,
        totalSeats: trip.totalSeats || 45
      }));
      
      setTrips(tripsData);
      setError(null);
    } catch (err) {
      console.error("Lỗi khi lấy danh sách chuyến:", err);
      setError("Không thể tải danh sách chuyến");
    } finally {
      setLoading(false);
    }
  };

  // Filter trips by status
  const upcomingTrips = trips.filter((t) => t.status === "pending" || t.status === "upcoming" || t.status === "scheduled" || t.status === "running");
  const inProgressTrips = trips.filter((t) => t.status === "in_progress" || t.status === "running");
  const completedTrips = trips.filter((t) => t.status === "completed");

  // Calculate stats
  const stats = {
    today: upcomingTrips.length,
    totalPassengers: trips.reduce((sum, t) => sum + (t.passengerCount || 0), 0),
    totalRevenue: trips.reduce((sum, t) => sum + (t.revenue || 0), 0),
    rating: 4.8,
  };

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

  const TripCard = ({ trip }) => {
    const status = getStatusBadge(trip.status);
    return (
      <Link to={`/driver/trip/${trip.id}`}>
        <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-editorial transition-shadow cursor-pointer">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${status.color}`}>
                  {status.label}
                </span>
                <span className="text-sm text-on-surface-variant">{trip.date}</span>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-primary text-lg">
                  location_on
                </span>
                <div>
                  <p className="font-semibold text-on-surface">{trip.departure}</p>
                  <span className="material-symbols-outlined text-xs text-on-surface-variant">
                    arrow_forward
                  </span>
                  <p className="font-semibold text-on-surface">{trip.destination}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-base text-on-surface-variant">
                    schedule
                  </span>
                  <span className="text-on-surface-variant">{trip.departureTime}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-base text-on-surface-variant">
                    people
                  </span>
                  <span className="text-on-surface-variant">
                    {trip.passengerCount}/{trip.totalSeats} ghế
                  </span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <p className="text-2xl font-bold text-primary">
                ₫{(trip.revenue || 0).toLocaleString()}
              </p>
              <p className="text-xs text-on-surface-variant">Doanh thu</p>
            </div>
          </div>
        </div>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-surface p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold text-on-surface tracking-tight mb-2">
            Xin chào, {user?.fullName || "Tài xế"}! 👋
          </h1>
          <p className="text-on-surface-variant text-lg">
            Quản lý chuyến đi và hành khách của bạn
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-on-surface-variant text-sm font-medium mb-1">
                  Chuyến hôm nay
                </p>
                <p className="text-4xl font-bold text-primary">{stats.today}</p>
              </div>
              <span className="material-symbols-outlined text-5xl text-primary-container">
                directions_bus
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-on-surface-variant text-sm font-medium mb-1">
                  Tổng hành khách
                </p>
                <p className="text-4xl font-bold text-primary">{stats.totalPassengers}</p>
              </div>
              <span className="material-symbols-outlined text-5xl text-primary-container">
                people
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-on-surface-variant text-sm font-medium mb-1">
                  Tổng doanh thu
                </p>
                <p className="text-2xl font-bold text-primary">
                  ₫{(stats.totalRevenue / 1000000).toFixed(1)}M
                </p>
              </div>
              <span className="material-symbols-outlined text-5xl text-primary-container">
                payments
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-on-surface-variant text-sm font-medium mb-1">
                  Đánh giá
                </p>
                <p className="text-4xl font-bold text-primary">{stats.rating}/5</p>
              </div>
              <span className="material-symbols-outlined text-5xl text-primary-container">
                star
              </span>
            </div>
          </div>
        </div>

        {/* Active Trip Banner */}
        {inProgressTrips.length > 0 && (
          <div className="bg-gradient-to-r from-primary to-primary-container rounded-2xl p-6 mb-8 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-90 mb-2">Chuyến đang chạy</p>
                <h3 className="text-2xl font-bold mb-2">
                  {inProgressTrips[0].departure} → {inProgressTrips[0].destination}
                </h3>
                <p className="opacity-90">
                  {inProgressTrips[0].passengerCount}/{inProgressTrips[0].totalSeats} hành khách
                </p>
              </div>
              <Link
                to={`/driver/trip/${inProgressTrips[0].id}`}
                className="bg-white text-primary px-6 py-3 rounded-xl font-bold hover:opacity-90 transition-all"
              >
                Xem chi tiết
              </Link>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 flex gap-2 border-b border-outline-variant/20">
          {[
            { id: "upcoming", label: "Sắp tới", count: upcomingTrips.length },
            { id: "inprogress", label: "Đang chạy", count: inProgressTrips.length },
            { id: "completed", label: "Hoàn thành", count: completedTrips.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 font-bold transition-all border-b-2 ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-on-surface-variant hover:text-on-surface"
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Trips List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            <p className="text-on-surface-variant mt-4">Đang tải...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-2xl text-center">
            {error}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {(activeTab === "upcoming"
              ? upcomingTrips
              : activeTab === "inprogress"
              ? inProgressTrips
              : completedTrips
            ).map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
            {((activeTab === "upcoming" && upcomingTrips.length === 0) ||
              (activeTab === "inprogress" && inProgressTrips.length === 0) ||
              (activeTab === "completed" && completedTrips.length === 0)) && (
              <div className="col-span-full text-center py-12">
                <span className="material-symbols-outlined text-6xl text-on-surface-variant opacity-50">
                  event_note
                </span>
                <p className="text-on-surface-variant mt-4">Không có chuyến nào</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DriverDashboard;