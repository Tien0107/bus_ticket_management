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

const PassengerList = ({ passengers = [], onCheckIn }) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredPassengers = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return passengers;

    return passengers.filter((passenger) =>
      [passenger.name, passenger.phone, passenger.ticket, passenger.seat]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword))
    );
  }, [passengers, searchTerm]);

  const stats = useMemo(() => ({
    total: passengers.length,
    checkedIn: passengers.filter((passenger) => passenger.status === "checked_in").length,
    pending: passengers.filter((passenger) => passenger.status !== "checked_in").length,
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
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-primary/90"
          >
            <span className="material-symbols-outlined text-[20px]">how_to_reg</span>
            Check-in
          </button>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-lg bg-surface-container-low p-4">
            <p className="text-sm text-on-surface-variant">Tổng</p>
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
        <table className="w-full min-w-[780px] text-sm">
          <thead className="bg-surface-container-low">
            <tr>
              <th className="px-5 py-3 text-left font-semibold text-on-surface-variant">Hành khách</th>
              <th className="px-5 py-3 text-left font-semibold text-on-surface-variant">Vé</th>
              <th className="px-5 py-3 text-left font-semibold text-on-surface-variant">Ghế</th>
              <th className="px-5 py-3 text-left font-semibold text-on-surface-variant">Điểm lên/xuống</th>
              <th className="px-5 py-3 text-left font-semibold text-on-surface-variant">Trạng thái</th>
              <th className="px-5 py-3 text-right font-semibold text-on-surface-variant">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/15">
            {filteredPassengers.map((passenger) => {
              const status = statusMeta[passenger.status] || statusMeta.pending;

              return (
                <tr key={passenger.id} className="hover:bg-surface-container-low/70">
                  <td className="px-5 py-4">
                    <p className="font-semibold text-on-surface">{passenger.name}</p>
                    <p className="mt-1 text-xs text-on-surface-variant">{passenger.phone}</p>
                  </td>
                  <td className="px-5 py-4 font-mono text-on-surface">{passenger.ticket}</td>
                  <td className="px-5 py-4">
                    <span className="inline-flex min-w-10 items-center justify-center rounded-md bg-primary/10 px-3 py-1 font-bold text-primary">
                      {passenger.seat}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-on-surface-variant">
                    <p className="truncate">Lên: {passenger.pickupPoint}</p>
                    <p className="mt-1 truncate">Xuống: {passenger.dropoffPoint}</p>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${status.className}`}>
                      <span className="material-symbols-outlined text-[16px] leading-none">{status.icon}</span>
                      {status.label}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    {passenger.status === "pending" ? (
                      <button
                        type="button"
                        onClick={() => onCheckIn?.(passenger.id)}
                        className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-primary/90"
                      >
                        Check-in
                      </button>
                    ) : (
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                        <span className="material-symbols-outlined text-[20px]">done</span>
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

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
