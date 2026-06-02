import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { logout } from "../../api/auth";
import { cancelSupportTicket, getSupportTicketDetail, getSupportTickets } from "../../api/companySupport";
import ConfirmModal from "../../components/common/ConfirmModal";

const LIMIT = 10;
const formatVnd = (value) => `${Number(value || 0).toLocaleString("vi-VN")}đ`;

const extractTickets = (response) => {
  const raw = response.data?.data || response.data;
  const list = Array.isArray(raw) ? raw : (raw?.items || raw?.tickets || raw?.records || raw?.content || []);
  const next = response.data?.next || raw?.next || null;
  return { list, next };
};

const getStatusConfig = (status) => {
  const normalized = String(status || "").toLowerCase();
  const configs = {
    paid: { label: "Đã TT", icon: "payments", className: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100", iconClass: "text-emerald-600" },
    checked_in: { label: "Đã lên", icon: "directions_bus", className: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100", iconClass: "text-emerald-600" },
    reserved: { label: "Giữ chỗ", icon: "schedule", className: "bg-amber-50 text-amber-700 ring-1 ring-amber-100", iconClass: "text-amber-600" },
    pending: { label: "Chờ TT", icon: "pending", className: "bg-amber-50 text-amber-700 ring-1 ring-amber-100", iconClass: "text-amber-600" },
    cancelled: { label: "Đã hủy", icon: "cancel", className: "bg-red-50 text-red-700 ring-1 ring-red-100", iconClass: "text-red-600" },
    expired: { label: "Hết hạn", icon: "timer_off", className: "bg-slate-100 text-slate-600 ring-1 ring-slate-200", iconClass: "text-slate-500" },
  };
  return configs[normalized] || { label: status || "Không rõ", icon: "info", className: "bg-surface-container-high text-outline" };
};

const getBookingTypeConfig = (type) => {
  const isRound = String(type || "").toLowerCase() === "round_trip";
  if (isRound) {
    return {
      label: "2 chiều",
      icon: "swap_horiz",
      className: "bg-blue-50 text-blue-700 ring-1 ring-blue-100",
      iconClass: "text-blue-600"
    };
  }
  return {
    label: "1 chiều",
    icon: "arrow_forward",
    className: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
    iconClass: "text-emerald-600"
  };
};

const formatDateTime = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export default function SupportTickets() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [viewTicket, setViewTicket] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [actionError, setActionError] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterType, setFilterType] = useState("");
  const [nextCursor, setNextCursor] = useState(null);

  let user = {};
  try {
    const userStr = localStorage.getItem("user");
    if (userStr && userStr !== "undefined") user = JSON.parse(userStr);
  } catch (e) {
    user = {};
  }

  const fetchTickets = useCallback(async ({ append = false, status = "", type = "", keyword = "", cursor = null } = {}) => {
    try {
      setLoading(true);
      setError("");
      const params = { limit: LIMIT };
      if (append && cursor) params.next = cursor;
      if (status) params.status = status;
      if (type) params.type = type;
      if (keyword) params.code = keyword;

      const response = await getSupportTickets(params);
      const { list, next } = extractTickets(response);
      setNextCursor(next);
      setTickets((prev) => (append ? [...prev, ...list] : list));
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Không thể tải danh sách vé. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setNextCursor(null);
    fetchTickets({ status: filterStatus, type: filterType, keyword: appliedSearch });
  }, [filterStatus, filterType, appliedSearch, fetchTickets]);

  const handleSearch = () => {
    const keyword = search.trim();
    setNextCursor(null);
    if (keyword === appliedSearch) {
      fetchTickets({ status: filterStatus, type: filterType, keyword });
      return;
    }
    setAppliedSearch(keyword);
  };

  const handleRefresh = () => {
    setSearch("");
    setAppliedSearch("");
    setFilterStatus("");
    setFilterType("");
    setNextCursor(null);
    if (!appliedSearch && !filterStatus && !filterType) fetchTickets();
  };

  const handleLoadMore = () => {
    fetchTickets({
      append: true,
      status: filterStatus,
      type: filterType,
      keyword: appliedSearch,
      cursor: nextCursor,
    });
  };

  const handleView = async (id) => {
    try {
      setViewLoading(true);
      setActionError("");
      const response = await getSupportTicketDetail(id);
      const data = response.data?.ticket || response.data?.data || response.data;
      const localData = tickets.find((ticket) => ticket.id === id) || {};
      setViewTicket({ ...localData, ...data });
    } catch (err) {
      setActionError(err.response?.data?.message || err.message || "Không thể tải chi tiết vé.");
    } finally {
      setViewLoading(false);
    }
  };

  const canCancelTicket = (ticket) =>
    ticket && !["cancelled", "expired"].includes(String(ticket.status || "").toLowerCase());

  const openCancelConfirm = (ticket) => {
    setActionError("");
    setCancelTarget(ticket);
  };

  const closeCancelConfirm = () => {
    if (cancelLoading) return;
    setCancelTarget(null);
  };

  const handleCancelConfirm = async () => {
    if (!cancelTarget?.id || cancelLoading) return;

    try {
      setCancelLoading(true);
      setActionError("");
      setError("");
      const response = await cancelSupportTicket(cancelTarget.id);
      const updatedTicket = response.data?.tickets?.find((ticket) => String(ticket.id) === String(cancelTarget.id)) || {
        id: cancelTarget.id,
        status: "cancelled",
      };

      setTickets((prev) =>
        prev.map((ticket) => (String(ticket.id) === String(cancelTarget.id) ? { ...ticket, ...updatedTicket } : ticket))
      );
      setViewTicket((prev) =>
        prev && String(prev.id) === String(cancelTarget.id) ? { ...prev, ...updatedTicket } : prev
      );
      setCancelTarget(null);
    } catch (err) {
      const message = err.response?.data?.message || "Hủy vé thất bại. Vui lòng thử lại.";
      setActionError(message);
      setError(message);
      setCancelTarget(null);
    } finally {
      setCancelLoading(false);
    }
  };

  const handleCloseModal = () => {
    setViewTicket(null);
    setActionError("");
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error(err);
    }
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  };

  const displayTickets = useMemo(() => {
    const keyword = appliedSearch.toLowerCase();
    if (!keyword) return tickets;
    return tickets.filter((ticket) => {
      const id = String(ticket.id || "").toLowerCase();
      const code = String(ticket.code || "").toLowerCase();
      return id.includes(keyword) || code.includes(keyword);
    });
  }, [tickets, appliedSearch]);

  const stats = useMemo(() => {
    const total = tickets.length;
    const pending = tickets.filter((ticket) => ["pending", "reserved"].includes(String(ticket.status || "").toLowerCase())).length;
    const cancelled = tickets.filter((ticket) => String(ticket.status || "").toLowerCase() === "cancelled").length;
    const paid = tickets.filter((ticket) => ["paid", "checked_in"].includes(String(ticket.status || "").toLowerCase())).length;
    return { total, pending, cancelled, paid };
  }, [tickets]);

  const sidebarItems = [
    { icon: "confirmation_number", label: "Quản lý vé", path: "/company-support/tickets", active: true },
    { icon: "sell", label: "Mã khuyến mãi", path: "/company-support/coupons" },
    { icon: "person", label: "Hồ sơ", path: "/company-support/profile" },
  ];

  const statusFilters = [
    { label: "Tất cả", value: "" },
    { label: "Giữ chỗ", value: "reserved" },
    { label: "Đã TT", value: "paid" },
    { label: "Đã hủy", value: "cancelled" },
    { label: "Đã lên", value: "checked_in" },
  ];

  const typeFilters = [
    { label: "Tất cả", value: "" },
    { label: "1 chiều", value: "one_way" },
    { label: "2 chiều", value: "round_trip" },
  ];

  return (
    <div className="flex min-h-screen bg-surface font-body text-on-surface">
      <aside className="flex w-[240px] shrink-0 flex-col border-r border-surface-container-high bg-white py-4">
        <div className="mb-6 px-4">
          <h1 className="text-base font-black tracking-tight text-primary">Quản trị nhà xe</h1>
          <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-outline">Trung tâm hỗ trợ</p>
        </div>

        <nav className="flex-1">
          {sidebarItems.map((item) => (
            <Link
              key={item.label}
              to={item.path}
              className={`flex items-center gap-2 border-r-4 px-4 py-2 text-sm transition-colors ${
                item.active
                  ? "border-primary bg-primary/10 font-extrabold text-primary"
                  : "border-transparent font-semibold text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-surface-container-high px-4 pt-3">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-black text-white">
              {(user.fullName || user.username || "U").charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-extrabold text-on-surface">{user.fullName || user.username || "Support"}</p>
              <p className="text-xs font-semibold text-outline">Nhân viên hỗ trợ</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm font-bold text-outline transition-colors hover:text-primary"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            Đăng xuất
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 overflow-auto px-5 py-5">
        <div className="mb-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-on-surface">Danh sách vé</h2>
            <p className="mt-0.5 text-xs font-medium text-on-surface-variant">
              Tra cứu, kiểm tra trạng thái thanh toán và hỗ trợ hủy vé khi cần.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex h-9 min-w-[260px] items-center gap-1.5 rounded-lg border border-outline-variant/60 bg-white px-2.5">
              <span className="material-symbols-outlined text-[20px] text-outline">search</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && handleSearch()}
                placeholder="Tìm mã vé hoặc code..."
                className="h-full min-w-0 flex-1 border-none bg-transparent text-sm font-semibold outline-none placeholder:text-outline"
              />
            </div>
            <button
              type="button"
              onClick={handleSearch}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-primary px-3.5 text-sm font-extrabold text-white transition-colors hover:bg-primary/90"
            >
              <span className="material-symbols-outlined text-[20px]">search</span>
              Tìm
            </button>
            <button
              type="button"
              onClick={handleRefresh}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-outline-variant/60 bg-white px-3.5 text-sm font-extrabold text-on-surface transition-colors hover:bg-surface-container-low"
            >
              <span className="material-symbols-outlined text-[20px]">refresh</span>
              Làm mới
            </button>
          </div>
        </div>

        <div className="mb-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Tổng số vé", value: stats.total.toLocaleString("vi-VN"), icon: "confirmation_number", tone: "text-primary", bg: "bg-primary/10" },
            { label: "Chờ xử lý", value: stats.pending.toLocaleString("vi-VN"), icon: "pending_actions", tone: "text-secondary", bg: "bg-secondary/10" },
            { label: "Đã thanh toán", value: stats.paid.toLocaleString("vi-VN"), icon: "payments", tone: "text-primary", bg: "bg-primary/10" },
            { label: "Đã hủy", value: stats.cancelled.toLocaleString("vi-VN"), icon: "cancel", tone: "text-red-700", bg: "bg-red-50" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-lg border border-outline-variant/30 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <p className="text-[10px] font-bold uppercase tracking-wide text-outline">{stat.label}</p>
                <span className={`material-symbols-outlined rounded-lg p-1.5 text-[18px] ${stat.bg} ${stat.tone}`}>
                  {stat.icon}
                </span>
              </div>
              <p className={`mt-1 text-2xl font-black ${stat.tone}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        <section className="mb-4 rounded-lg border border-outline-variant/30 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h3 className="text-base font-black text-on-surface">Bộ lọc vận hành</h3>
              <p className="mt-0.5 text-xs font-medium text-on-surface-variant">
                Lọc theo trạng thái và loại vé, kết quả tự tải lại khi đổi bộ lọc.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap gap-1.5">
                {statusFilters.map((filter) => (
                  <button
                    key={filter.value || "all-status"}
                    type="button"
                    onClick={() => setFilterStatus(filter.value)}
                    className={`h-9 rounded-lg px-3 text-sm font-bold transition-colors ${
                      filterStatus === filter.value
                        ? "bg-primary text-white"
                        : "border border-outline-variant/60 bg-white text-on-surface hover:bg-surface-container-low"
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 xl:justify-end">
                {typeFilters.map((filter) => (
                  <button
                    key={filter.value || "all-type"}
                    type="button"
                    onClick={() => setFilterType(filter.value)}
                    className={`h-9 rounded-lg px-3 text-sm font-bold transition-colors ${
                      filterType === filter.value
                        ? "bg-secondary text-white"
                        : "border border-secondary/30 bg-white text-secondary hover:bg-secondary/10"
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-lg border border-outline-variant/30 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-surface-container px-4 py-2.5">
            <div>
              <h3 className="text-lg font-black text-on-surface">Lịch sử đặt vé</h3>
              <p className="mt-0.5 text-xs font-semibold text-on-surface-variant">
                Đang hiển thị {displayTickets.length} vé
              </p>
            </div>
          </div>

          {error ? (
            <div className="m-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div>
          ) : null}

          {loading && tickets.length === 0 ? (
            <div className="flex min-h-[280px] items-center justify-center gap-3 text-sm font-bold text-outline">
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-outline-variant border-t-primary" />
              Đang tải dữ liệu...
            </div>
          ) : displayTickets.length === 0 ? (
            <div className="flex min-h-[280px] flex-col items-center justify-center px-6 text-center">
              <span className="material-symbols-outlined text-5xl text-outline/40">inbox</span>
              <p className="mt-3 text-sm font-bold text-on-surface">Không tìm thấy vé phù hợp</p>
              <p className="mt-1 text-sm text-on-surface-variant">Thử đổi bộ lọc hoặc làm mới dữ liệu.</p>
            </div>
          ) : (
            <div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1120px] border-collapse">
                  <thead>
                    <tr className="border-b border-surface-container bg-surface-container-low">
                      {["Mã vé", "Mã đặt chỗ", "Loại vé", "Khởi hành", "Giá gốc", "Giảm", "Tổng tiền", "Trạng thái", ""].map((header) => (
                        <th key={header} className="px-4 py-2 text-left text-[10px] font-black uppercase tracking-wide text-outline">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {displayTickets.map((ticket) => {
                      const status = getStatusConfig(ticket.status);
                      const isRoundTrip = ticket.bookingType === "round_trip";
                      return (
                        <tr key={ticket.id} className="border-b border-surface-container/70 hover:bg-surface-container-low/60">
                          <td className="px-4 py-2.5">
                            {ticket.code ? <p className="font-black text-primary">{ticket.code}</p> : <p className="font-black text-primary">Vé</p>}
                          </td>
                          <td className="px-4 py-2.5 text-sm font-bold text-on-surface">BK-{ticket.bookingId || "N/A"}</td>
                          <td className="px-4 py-2.5">
                            {(() => {
                              const cfg = getBookingTypeConfig(ticket.bookingType);
                              const isOneWay = cfg.label === "1 chiều";
                              return (
                                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${cfg.className}`}>
                                  <span className={`material-symbols-outlined ${isOneWay ? 'text-[14px]' : 'text-[15px]'} ${cfg.iconClass}`}>
                                    {cfg.icon}
                                  </span>
                                  {isOneWay ? (
                                    <span className="leading-none font-extrabold">
                                      <span className="block text-[10px] -mb-0.5">1</span>
                                      <span className="block">chiều</span>
                                    </span>
                                  ) : (
                                    <span className="font-extrabold">{cfg.label}</span>
                                  )}
                                </span>
                              );
                            })()}
                          </td>
                          <td className="px-4 py-2.5 text-sm font-semibold text-on-surface-variant">{formatDateTime(ticket.departureDate)}</td>
                          <td className="px-4 py-2.5 text-sm font-bold text-on-surface">{formatVnd(ticket.originalAmount)}</td>
                          <td className="px-4 py-2.5 text-sm font-bold text-primary">-{formatVnd(ticket.discountAmount)}</td>
                          <td className="px-4 py-2.5 text-sm font-black text-secondary">{formatVnd(ticket.totalAmount)}</td>
                          <td className="px-4 py-2.5">
                            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${status.className}`}>
                              <span className={`material-symbols-outlined text-[15px] ${status.iconClass || ''}`}>{status.icon}</span>
                              <span className="font-extrabold">{status.label}</span>
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            <div className="flex justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleView(ticket.id)}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-outline-variant/50 bg-white px-3 py-1.5 text-xs font-bold text-on-surface transition-all hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
                                title="Xem chi tiết vé"
                              >
                                <span className="material-symbols-outlined text-[16px]">visibility</span>
                                <span>Chi tiết</span>
                              </button>
                              {canCancelTicket(ticket) ? (
                                <button
                                  type="button"
                                  onClick={() => openCancelConfirm(ticket)}
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 transition-all hover:border-red-300 hover:bg-red-100"
                                  title="Hủy vé này"
                                >
                                  <span className="material-symbols-outlined text-[16px]">cancel</span>
                                  <span>Hủy</span>
                                </button>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {nextCursor && (
                <div className="flex justify-center border-t border-outline-variant/30 bg-white px-4 py-2.5">
                  <button
                    type="button"
                    onClick={handleLoadMore}
                    disabled={loading}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-outline-variant/60 bg-white px-3 py-1 text-sm font-bold text-on-surface transition-colors hover:bg-surface-container-low disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span className="material-symbols-outlined text-[20px]">expand_more</span>
                    {loading ? "Đang tải thêm..." : `Tải thêm ${LIMIT} vé`}
                  </button>
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      {viewTicket ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" onClick={handleCloseModal}>
          <div className="w-full max-w-2xl overflow-hidden rounded-lg bg-white shadow-[0_24px_80px_rgba(15,23,42,0.25)]" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between bg-primary px-6 py-5 text-white">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-white/70">Chi tiết vé</p>
                <h3 className="mt-1 text-2xl font-black">{viewTicket.code || "Chi tiết vé"}</h3>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/15 text-white transition-colors hover:bg-white/25"
                aria-label="Đóng"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-6">
              {viewLoading ? (
                <div className="mb-4 flex items-center gap-3 rounded-lg bg-surface-container-low px-4 py-3 text-sm font-bold text-outline">
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-outline-variant border-t-primary" />
                  Đang tải chi tiết vé...
                </div>
              ) : null}

              {(() => {
                const status = getStatusConfig(viewTicket.status);
                return (
                  <span className={`mb-5 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-black ${status.className}`}>
                    <span className="material-symbols-outlined text-[18px]">{status.icon}</span>
                    {status.label}
                  </span>
                );
              })()}

              <div className="mb-5 grid gap-3 sm:grid-cols-2">
                {[
                  { label: "Mã đặt chỗ", value: `BK-${viewTicket.bookingId || "N/A"}` },
                  { label: "Mã vé", value: viewTicket.code || "N/A" },
                  { label: "Loại vé", value: getBookingTypeConfig(viewTicket.bookingType).label },
                  { label: "Ngày khởi hành", value: formatDateTime(viewTicket.departureDate) },
                ].map((item) => (
                  <div key={item.label} className="rounded-lg border border-outline-variant/30 bg-surface-container-low p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-outline">{item.label}</p>
                    <p className="mt-1 text-sm font-black text-on-surface">{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="mb-4 rounded-lg border border-outline-variant/30 bg-white p-4 shadow-sm">
                <p className="mb-3 text-[10px] font-bold uppercase tracking-wide text-outline">Chi tiết thanh toán</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between gap-4">
                    <span className="font-semibold text-on-surface-variant">Giá gốc</span>
                    <span className="font-black text-on-surface">{formatVnd(viewTicket.originalAmount)}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="font-semibold text-on-surface-variant">Giảm giá</span>
                    <span className="font-black text-primary">-{formatVnd(viewTicket.discountAmount)}</span>
                  </div>
                  <div className="border-t border-dashed border-outline-variant pt-3">
                    <div className="flex items-end justify-between gap-4">
                      <span className="font-black text-on-surface">Tổng cộng</span>
                      <span className="text-2xl font-black text-secondary">{formatVnd(viewTicket.totalAmount)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {actionError ? (
                <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{actionError}</div>
              ) : null}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="h-11 rounded-lg border border-outline-variant/60 bg-white px-5 text-sm font-extrabold text-on-surface transition-colors hover:bg-surface-container-low"
                >
                  Đóng
                </button>
                {canCancelTicket(viewTicket) ? (
                  <button
                    type="button"
                    onClick={() => openCancelConfirm(viewTicket)}
                    disabled={cancelLoading}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-5 text-sm font-extrabold text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span className="material-symbols-outlined text-[19px]">cancel</span>
                    Hủy vé này
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}
      <ConfirmModal
        isOpen={Boolean(cancelTarget)}
        title="Hủy vé"
        message={`Bạn có chắc muốn hủy vé #${cancelTarget?.id || ""}? Trạng thái vé sẽ được cập nhật theo phản hồi từ hệ thống.`}
        confirmText={cancelLoading ? "Đang hủy..." : "Hủy vé"}
        cancelText="Giữ lại"
        confirmColor="bg-red-600"
        onConfirm={handleCancelConfirm}
        onCancel={closeCancelConfirm}
      />
    </div>
  );
}
