import React, { useMemo, useState } from "react";
import { checkInPassenger } from "../../api/driver";
import { useToast } from "../../context/ToastContext";

const CheckInPanel = ({ tripId, passengers = [], onCheckInSuccess, isOpen, onClose, initialPassengerId = null }) => {
  const { addToast } = useToast();
  const [selectedPassenger, setSelectedPassenger] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const pendingPassengers = useMemo(
    () => passengers.filter((passenger) => passenger.status !== "checked_in"),
    [passengers]
  );

  const filteredPassengers = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return pendingPassengers;

    return pendingPassengers.filter((passenger) =>
      [passenger.name, passenger.phone, passenger.ticket, passenger.seat]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword))
    );
  }, [pendingPassengers, searchTerm]);

  React.useEffect(() => {
    if (!isOpen) return;
    const initialPassenger = pendingPassengers.find((passenger) => Number(passenger.id) === Number(initialPassengerId));
    setSelectedPassenger(initialPassenger || null);
  }, [initialPassengerId, isOpen, pendingPassengers]);

  const handleCheckIn = async () => {
    if (!selectedPassenger) return;

    try {
      setLoading(true);
      const response = await checkInPassenger(tripId, selectedPassenger.id, "checked_in");
      const success = await onCheckInSuccess?.(selectedPassenger.id, response.data?.ticket || response.data);

      if (success !== false) {
        setSelectedPassenger(null);
        setSearchTerm("");
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-[0_24px_80px_rgba(15,23,42,0.28)]">
        <div className="border-b border-outline-variant/20 px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-primary">Check-in</p>
              <h2 className="mt-1 text-2xl font-bold text-on-surface">Xác nhận hành khách lên xe</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-on-surface"
              aria-label="Đóng"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>

        <div className="overflow-y-auto p-5">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">
              search
            </span>
            <input
              type="text"
              placeholder="Tìm theo tên, số điện thoại, mã vé hoặc ghế"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full rounded-lg border border-outline-variant/40 bg-white py-3 pl-12 pr-4 text-sm outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10"
              autoFocus
            />
          </div>

          <div className="mt-5 grid max-h-[360px] gap-3 overflow-y-auto pr-1">
            {filteredPassengers.map((passenger) => {
              const active = selectedPassenger?.id === passenger.id;

              return (
                <button
                  key={passenger.id}
                  type="button"
                  onClick={() => setSelectedPassenger(passenger)}
                  className={`w-full rounded-xl border p-4 text-left transition-all ${
                    active
                      ? "border-primary bg-primary/5 ring-4 ring-primary/10"
                      : "border-outline-variant/30 hover:border-primary/50 hover:bg-surface-container-low"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate font-bold text-on-surface">{passenger.name}</p>
                      <p className="mt-1 text-sm text-on-surface-variant">
                        Vé {passenger.ticket} · Ghế {passenger.seat}
                      </p>
                      <p className="mt-2 truncate text-xs text-on-surface-variant">
                        {passenger.pickupPoint} → {passenger.dropoffPoint}
                      </p>
                    </div>
                    <span className={`material-symbols-outlined ${active ? "text-primary" : "text-outline"}`}>
                      {active ? "radio_button_checked" : "radio_button_unchecked"}
                    </span>
                  </div>
                </button>
              );
            })}

            {filteredPassengers.length === 0 && (
              <div className="rounded-xl border border-dashed border-outline-variant/50 p-8 text-center">
                <span className="material-symbols-outlined text-5xl text-outline">
                  {pendingPassengers.length === 0 ? "task_alt" : "person_search"}
                </span>
                <p className="mt-3 font-semibold text-on-surface">
                  {pendingPassengers.length === 0 ? "Tất cả đã check-in" : "Không tìm thấy hành khách"}
                </p>
                <p className="mt-1 text-sm text-on-surface-variant">
                  {pendingPassengers.length === 0
                    ? "Không còn hành khách chờ xác nhận."
                    : "Thử tìm bằng tên, mã vé hoặc số ghế khác."}
                </p>
              </div>
            )}
          </div>

          {selectedPassenger && (
            <div className="mt-5 rounded-xl border border-primary/20 bg-primary/5 p-4">
              <p className="text-sm font-semibold text-primary">Đang chọn</p>
              <div className="mt-3 grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
                <div>
                  <p className="text-on-surface-variant">Hành khách</p>
                  <p className="mt-1 font-bold text-on-surface">{selectedPassenger.name}</p>
                </div>
                <div>
                  <p className="text-on-surface-variant">Mã vé</p>
                  <p className="mt-1 font-bold text-on-surface">{selectedPassenger.ticket}</p>
                </div>
                <div>
                  <p className="text-on-surface-variant">Ghế</p>
                  <p className="mt-1 font-bold text-on-surface">{selectedPassenger.seat}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-outline-variant/20 p-5">
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-outline-variant/50 px-5 py-3 text-sm font-bold text-on-surface transition-colors hover:bg-surface-container-low"
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={handleCheckIn}
              disabled={!selectedPassenger || loading}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[20px]">check_circle</span>
                  Xác nhận check-in
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckInPanel;
