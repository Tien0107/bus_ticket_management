import React, { useState } from "react";
import { checkInPassenger } from "../../api/driver";
import { useToast } from "../../context/ToastContext";

const CheckInPanel = ({ tripId, passengers = [], onCheckInSuccess, isOpen, onClose }) => {
  const { addToast } = useToast();
  const [selectedPassenger, setSelectedPassenger] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const pendingPassengers = passengers.filter((p) => p.status === "pending");
  const filteredPassengers = pendingPassengers.filter(
    (p) =>
      p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.ticket?.includes(searchTerm)
  );

  const handleCheckIn = async (passengerId) => {
    try {
      setLoading(true);
      await checkInPassenger(tripId, passengerId);
      addToast("Check-in thành công", "success");
      setSelectedPassenger(null);
      setSearchTerm("");
      if (onCheckInSuccess) {
        onCheckInSuccess();
      }
    } catch (err) {
      console.error("Lỗi check-in:", err);
      addToast("Check-in thất bại", "error");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-outline-variant/20 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-on-surface">Check-in hành khách</h2>
            <button
              onClick={onClose}
              className="text-on-surface-variant hover:text-on-surface transition-colors"
            >
              <span className="material-symbols-outlined text-2xl">close</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Search/Input */}
          <div>
            <label className="block text-sm font-bold text-on-surface mb-2">
              Tìm hành khách để check-in
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">
                search
              </span>
              <input
                type="text"
                placeholder="Nhập tên, mã vé hoặc số ghế..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-surface-container-low border-0 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all"
                autoFocus
              />
            </div>
          </div>

          {/* Passenger List */}
          {filteredPassengers.length > 0 ? (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredPassengers.map((passenger) => (
                <button
                  key={passenger.id}
                  onClick={() => setSelectedPassenger(passenger)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    selectedPassenger?.id === passenger.id
                      ? "border-primary bg-primary/10"
                      : "border-outline-variant/20 hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-on-surface">{passenger.name}</p>
                      <p className="text-sm text-on-surface-variant">
                        Vé: {passenger.ticket} | Ghế: {passenger.seat}
                      </p>
                    </div>
                    <span className="material-symbols-outlined text-primary">
                      {selectedPassenger?.id === passenger.id ? "check_circle" : "circle"}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              {searchTerm ? (
                <>
                  <span className="material-symbols-outlined text-4xl text-on-surface-variant opacity-50">
                    person_off
                  </span>
                  <p className="text-on-surface-variant mt-3">Không tìm thấy hành khách</p>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-4xl text-on-surface-variant opacity-50">
                    check_circle
                  </span>
                  <p className="text-on-surface-variant mt-3">
                    Tất cả hành khách đã được check-in
                  </p>
                </>
              )}
            </div>
          )}

          {/* Selected Passenger Details */}
          {selectedPassenger && (
            <div className="bg-surface-container-low rounded-xl p-4 border-2 border-primary">
              <p className="text-sm text-on-surface-variant mb-2">Hành khách được chọn</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-on-surface">{selectedPassenger.name}</span>
                  <span className="text-primary font-bold">Ghế {selectedPassenger.seat}</span>
                </div>
                <p className="text-sm text-on-surface-variant">
                  Vé: {selectedPassenger.ticket}
                </p>
                <p className="text-sm text-on-surface-variant">
                  Điểm lên: {selectedPassenger.pickupPoint}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-outline-variant/20 p-6 flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 border-2 border-primary text-primary font-bold rounded-xl hover:bg-primary/10 transition-all active:scale-95"
          >
            Đóng
          </button>
          <button
            onClick={() => selectedPassenger && handleCheckIn(selectedPassenger.id)}
            disabled={!selectedPassenger || loading}
            className="flex-1 px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/80 disabled:opacity-60 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Đang xử lý...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined">check_circle</span>
                <span>Xác nhận Check-in</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheckInPanel;
