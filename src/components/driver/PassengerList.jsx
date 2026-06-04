import React, { useMemo, useState } from "react";

const statusMeta = {
  checked_in: {
    label: "Đã check-in",
    icon: "check_circle",
    className: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  },
  pending: {
    label: "Chờ check-in",
    icon: "schedule",
    className: "bg-amber-50 text-amber-700 ring-amber-100",
  },
  no_show: {
    label: "Không tới",
    icon: "cancel",
    className: "bg-red-50 text-red-700 ring-red-100",
  },
};

const ticketStatusMeta = {
  reserved: {
    label: "Đã giữ chỗ",
    className: "bg-sky-50 text-sky-700 ring-sky-100",
  },
  pending: {
    label: "Chờ thanh toán",
    className: "bg-amber-50 text-amber-700 ring-amber-100",
  },
  paid: {
    label: "Đã thanh toán",
    className: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  },
  checked_in: {
    label: "Đã lên xe",
    className: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  },
  cancelled: {
    label: "Đã hủy",
    className: "bg-red-50 text-red-700 ring-red-100",
  },
  expired: {
    label: "Hết hạn",
    className: "bg-slate-100 text-slate-700 ring-slate-200",
  },
};

const bookingTypeConfig = {
  round_trip: {
    label: "2 chiều",
    className: "bg-blue-50 text-blue-700 ring-1 ring-blue-100",
  },
  one_way: {
    label: "1 chiều",
    className: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
  },
};

const getBookingType = (type) => {
  const key = String(type || "one_way").toLowerCase();
  return bookingTypeConfig[key] || bookingTypeConfig.one_way;
};

const getTicketStatus = (status) => {
  const key = String(status || "").toLowerCase();
  return ticketStatusMeta[key] || {
    label: status || "Không rõ",
    className: "bg-surface-container-high text-on-surface-variant ring-outline-variant",
  };
};

const getStatusKey = (status) => String(status || "").trim().toLowerCase();
const isCancelledTicket = (status) => ["cancelled", "canceled"].includes(getStatusKey(status));
const canCheckInPassenger = (passenger = {}) =>
  passenger.status === "pending" && !isCancelledTicket(passenger.ticketStatus);

const formatAmount = (value) => {
  if (value === undefined || value === null || value === "") return "—";
  const num = Number(value);
  if (Number.isNaN(num)) return "—";
  return `${num.toLocaleString("vi-VN")}đ`;
};

const PassengerList = ({ passengers = [], hasMore = false, loadingMore = false, onCheckIn, onLoadMore }) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredPassengers = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return passengers;

    return passengers.filter((passenger) => {
      const values = [
        passenger.name,
        passenger.phone,
        passenger.ticket,
        passenger.seat,
        passenger.bookingType,
        getBookingType(passenger.bookingType).label,
        passenger.ticketStatus,
        getTicketStatus(passenger.ticketStatus).label,
        formatAmount(passenger.totalAmount),
      ];
      return values.filter(Boolean).some((value) => String(value).toLowerCase().includes(keyword));
    });
  }, [passengers, searchTerm]);

  const stats = useMemo(() => ({
    total: passengers.length,
    checkedIn: passengers.filter((passenger) => passenger.status === "checked_in").length,
    pending: passengers.filter(canCheckInPassenger).length,
  }), [passengers]);

  return (
    <section className="rounded-xl border border-outline-variant/30 bg-white shadow-sm">
      <div className="border-b border-outline-variant/20 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-bold text-on-surface">Hành khách</h2>
            <p className="mt-1 text-sm text-on-surface-variant">Tra cứu vé, ghế và trạng thái lên xe.</p>
          </div>
          <button
            type="button"
            onClick={() => onCheckIn?.()}
            disabled={!stats.pending}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="material-symbols-outlined text-[20px]">how_to_reg</span>
            Check-in
          </button>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-lg bg-surface-container-low p-4">
            <p className="text-sm text-on-surface-variant">{hasMore ? "Đã tải" : "Tổng"}</p>
            <p className="mt-1 text-2xl font-bold text-on-surface">{stats.total}</p>
          </div>
          <div className="rounded-lg bg-emerald-50 p-4">
            <p className="text-sm text-emerald-700">Đã check-in</p>
            <p className="mt-1 text-2xl font-bold text-emerald-700">{stats.checkedIn}</p>
          </div>
          <div className="rounded-lg bg-amber-50 p-4">
            <p className="text-sm text-amber-700">Còn lại</p>
            <p className="mt-1 text-2xl font-bold text-amber-700">{stats.pending}</p>
          </div>
        </div>

        <div className="relative mt-5">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">
            search
          </span>
          <input
            type="text"
            placeholder="Tìm theo tên, số điện thoại, mã vé hoặc ghế"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="w-full rounded-lg border border-outline-variant/40 bg-white py-3 pl-12 pr-4 text-sm outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-sm">
          <thead className="bg-surface-container-low">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-on-surface-variant">Hành khách</th>
              <th className="px-4 py-3 text-left font-semibold text-on-surface-variant">Vé</th>
              <th className="px-4 py-3 text-left font-semibold text-on-surface-variant">Loại</th>
              <th className="px-4 py-3 text-left font-semibold text-on-surface-variant">Ghế</th>
              <th className="px-4 py-3 text-right font-semibold text-on-surface-variant">Tổng tiền</th>
              <th className="px-4 py-3 text-left font-semibold text-on-surface-variant">Điểm lên/xuống</th>
              <th className="px-4 py-3 text-left font-semibold text-on-surface-variant">Trạng thái</th>
              <th className="py-3 pl-4 pr-16 text-right font-semibold text-on-surface-variant">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/15">
            {filteredPassengers.map((passenger) => {
              const status = statusMeta[passenger.status] || statusMeta.pending;
              const ticketStatus = getTicketStatus(passenger.ticketStatus);
              const canCheckIn = canCheckInPassenger(passenger);
              const cancelled = isCancelledTicket(passenger.ticketStatus);

              return (
                <tr key={passenger.id} className="hover:bg-surface-container-low/70">
                  <td className="px-4 py-4">
                    <p className="font-semibold text-on-surface">{passenger.name}</p>
                    <p className="mt-1 text-xs text-on-surface-variant">{passenger.phone}</p>
                  </td>
                  <td className="px-4 py-4 font-mono text-on-surface">{passenger.ticket}</td>
                  <td className="px-4 py-4">
                    {(() => {
                      const cfg = getBookingType(passenger.bookingType);
                      return (
                        <span className={`inline-flex h-8 min-w-[74px] items-center justify-center rounded-full px-3 text-xs font-black whitespace-nowrap ${cfg.className}`}>
                          {cfg.label}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="px-4 py-4">
                    <span className="inline-flex min-w-10 items-center justify-center rounded-md bg-primary/10 px-3 py-1 font-bold text-primary">
                      {passenger.seat}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right font-semibold text-on-surface">
                    {formatAmount(passenger.totalAmount)}
                  </td>
                  <td className="px-4 py-4 text-on-surface-variant">
                    <p className="truncate">Lên: {passenger.pickupPoint}</p>
                    <p className="mt-1 truncate">Xuống: {passenger.dropoffPoint}</p>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col items-start gap-2">
                      <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ring-1 whitespace-nowrap ${status.className}`}>
                        <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
                        {status.label}
                      </span>
                      <span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-bold ring-1 whitespace-nowrap ${ticketStatus.className}`}>
                        Vé: {ticketStatus.label}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 pl-4 pr-16 text-right">
                    {canCheckIn ? (
                      <button
                        type="button"
                        onClick={() => onCheckIn?.(passenger.id)}
                        className="inline-flex h-10 min-w-[88px] items-center justify-center whitespace-nowrap rounded-lg bg-primary px-3 text-sm font-bold text-white transition-colors hover:bg-primary/90"
                      >
                        Check-in
                      </button>
                    ) : (
                      <span className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${
                        cancelled ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"
                      }`}>
                        <span className="material-symbols-outlined text-[20px]">{cancelled ? "block" : "done"}</span>
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {hasMore && (
        <div className="flex justify-center border-t border-outline-variant/15 px-5 py-4">
          <button
            type="button"
            onClick={onLoadMore}
            disabled={loadingMore}
            className="inline-flex min-w-[180px] items-center justify-center gap-2 rounded-lg border border-primary/25 bg-primary/5 px-4 py-2.5 text-sm font-black text-primary transition-colors hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loadingMore ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary/25 border-t-primary" />
            ) : (
              <span className="h-2 w-2 rotate-45 border-b-2 border-r-2 border-current" aria-hidden="true" />
            )}
            {loadingMore ? "Đang tải..." : "Tải thêm 10 hành khách"}
          </button>
        </div>
      )}

      {filteredPassengers.length === 0 && (
        <div className="p-10 text-center">
          <span className="material-symbols-outlined text-5xl text-outline">person_search</span>
          <p className="mt-3 font-semibold text-on-surface">Không tìm thấy hành khách</p>
          <p className="mt-1 text-sm text-on-surface-variant">Thử tìm bằng tên, mã vé hoặc số ghế khác.</p>
        </div>
      )}
    </section>
  );
};

export default PassengerList;
