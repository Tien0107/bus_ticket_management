import React, { useState } from "react";

const PassengerList = ({ passengers = [], tripId, onCheckIn }) => {
  const [selectedPassengers, setSelectedPassengers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredPassengers = passengers.filter(
    (p) =>
      p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.ticket?.includes(searchTerm)
  );

  const handleCheckIn = (passengerId) => {
    if (onCheckIn) {
      onCheckIn(passengerId);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      checked_in: { label: "Đã check-in", color: "bg-green-100 text-green-700", icon: "check_circle" },
      pending: { label: "Chưa check-in", color: "bg-yellow-100 text-yellow-700", icon: "schedule" },
      no_show: { label: "Không tới", color: "bg-red-100 text-red-700", icon: "cancel" },
    };
    return statusMap[status] || statusMap.pending;
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-on-surface mb-4">Danh sách hành khách</h3>

        {/* Search */}
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
            search
          </span>
          <input
            type="text"
            placeholder="Tìm hành khách (tên hoặc mã vé)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-surface-container-low border-0 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-outline-variant/20">
              <th className="text-left py-3 px-4 font-bold text-on-surface">Hành khách</th>
              <th className="text-left py-3 px-4 font-bold text-on-surface">Mã vé</th>
              <th className="text-left py-3 px-4 font-bold text-on-surface">Ghế</th>
              <th className="text-left py-3 px-4 font-bold text-on-surface">Điểm lên/xuống</th>
              <th className="text-left py-3 px-4 font-bold text-on-surface">Trạng thái</th>
              <th className="text-center py-3 px-4 font-bold text-on-surface">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {filteredPassengers.map((passenger) => {
              const statusBadge = getStatusBadge(passenger.status);
              return (
                <tr
                  key={passenger.id}
                  className="border-b border-outline-variant/10 hover:bg-surface-container-low transition-colors"
                >
                  <td className="py-4 px-4">
                    <div>
                      <p className="font-semibold text-on-surface">{passenger.name}</p>
                      <p className="text-xs text-on-surface-variant">{passenger.phone}</p>
                    </div>
                  </td>
                  <td className="py-4 px-4 font-mono text-on-surface">{passenger.ticket}</td>
                  <td className="py-4 px-4">
                    <span className="bg-primary-container text-primary px-3 py-1 rounded-full font-bold">
                      {passenger.seat}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-on-surface-variant text-xs">
                    <div>
                      <p>Lên: {passenger.pickupPoint}</p>
                      <p>Xuống: {passenger.dropoffPoint}</p>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusBadge.color}`}>
                      {statusBadge.label}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    {passenger.status === "pending" ? (
                      <button
                        onClick={() => handleCheckIn(passenger.id)}
                        className="bg-primary text-white px-4 py-2 rounded-lg font-bold hover:bg-primary/80 transition-all active:scale-95 text-sm"
                      >
                        Check-in
                      </button>
                    ) : (
                      <span className="material-symbols-outlined text-green-600">check_circle</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredPassengers.length === 0 && (
          <div className="text-center py-8">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant opacity-50">
              people
            </span>
            <p className="text-on-surface-variant mt-3">Không tìm thấy hành khách</p>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-outline-variant/20">
        <div className="text-center">
          <p className="text-2xl font-bold text-primary">{passengers.length}</p>
          <p className="text-sm text-on-surface-variant">Tổng hành khách</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-green-600">
            {passengers.filter((p) => p.status === "checked_in").length}
          </p>
          <p className="text-sm text-on-surface-variant">Đã check-in</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-yellow-600">
            {passengers.filter((p) => p.status === "pending").length}
          </p>
          <p className="text-sm text-on-surface-variant">Chưa check-in</p>
        </div>
      </div>
    </div>
  );
};

export default PassengerList;
