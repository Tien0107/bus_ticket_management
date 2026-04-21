import React, { useEffect, useState } from "react";
import { getSupportTickets, cancelSupportTicket, getSupportTicketDetail } from "../../api/companySupport";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { logout } from "../../api/auth";
export default function SupportTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [viewTicket, setViewTicket] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [actionError, setActionError] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterType, setFilterType] = useState("");
  const [nextCursor, setNextCursor] = useState(null);
  const LIMIT = 20;
  const navigate = useNavigate();
  const location = useLocation();

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const fetchTickets = async (append = false, overrides = null) => {
    try {
      setLoading(true);
      setError("");
      const params = { limit: LIMIT };
      if (append && nextCursor) params.next = nextCursor;
      
      const currentStatus = overrides !== null ? overrides.status : filterStatus;
      const currentType = overrides !== null ? overrides.type : filterType;
      const currentSearch = overrides !== null ? overrides.search : search;

      if (currentStatus) params.status = currentStatus;
      if (currentType) params.type = currentType;
      if (currentSearch) params.code = currentSearch;

      const res = await getSupportTickets(params);
      const raw = res.data?.data || res.data;
      const list = Array.isArray(raw) ? raw : (raw?.items || raw?.tickets || raw?.records || raw?.content || []);
      const cursor = res.data?.next || raw?.next || null;
      setNextCursor(cursor);

      if (append) {
        setTickets(prev => [...prev, ...list]);
      } else {
        setTickets(list);
      }
    } catch (err) {
      console.error(err);
      setError("Không thể tải danh sách vé. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [filterStatus, filterType]);

  const handleSearch = () => {
    setNextCursor(null);
    fetchTickets();
  };

  const handleRefresh = () => {
    setSearch("");
    setFilterStatus("");
    setFilterType("");
    setNextCursor(null);
    fetchTickets(false, { status: "", type: "", search: "" });
  };

  const handleCancel = async (id) => {
    try {
      setCancelLoading(true);
      setActionError("");
      const res = await cancelSupportTicket(id);
      const data = res.data;
      
      const updatedApiTicket = data?.tickets?.find(apiT => apiT.id === id);
      const newStatusInfo = updatedApiTicket ? updatedApiTicket : { status: "cancelled" };

      // Cập nhật state list
      setTickets(prev => prev.map(t => {
        if (t.id === id) return { ...t, ...newStatusInfo };
        return t;
      }));

      // Cập nhật modal state nếu đang mở
      setViewTicket(prev => prev ? { ...prev, ...newStatusInfo } : null);
    } catch (err) {
      setActionError(err.response?.data?.message || "Hủy vé thất bại. Vui lòng thử lại.");
    } finally {
      setCancelLoading(false);
    }
  };

  const handleView = async (id) => {
    try {
      setViewLoading(true);
      setActionError("");
      const res = await getSupportTicketDetail(id);
      const data = res.data?.ticket || res.data?.data || res.data;
      
      // Kết hợp dữ liệu từ danh sách (có chứa bookingId) và dữ liệu chi tiết từ API
      const localData = tickets.find(t => t.id === id) || {};
      setViewTicket({ ...localData, ...data });
    } catch (err) {
      setActionError(err.response?.data?.message || err.message);
    } finally {
      setViewLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error(err);
    }
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  // Stats
  const totalTickets = tickets.length;
  const pendingTickets = tickets.filter(t => String(t.status || "").toLowerCase() === "pending" || String(t.status || "").toLowerCase() === "reserved").length;
  const cancelledTickets = tickets.filter(t => String(t.status || "").toLowerCase() === "cancelled").length;
  const paidTickets = tickets.filter(t => String(t.status || "").toLowerCase() === "paid").length;

  const sidebarItems = [
    { icon: "confirmation_number", label: "Quản Lý Vé", path: "/company-support/tickets", active: true },
    { icon: "sell", label: "Mã Khuyến Mãi", path: "/company-support/coupons" },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'Be Vietnam Pro', sans-serif", background: "#f9f9f9" }}>
      {/* === SIDEBAR === */}
      <aside style={{
        width: 260, background: "#ffffff", display: "flex", flexDirection: "column",
        borderRight: "1px solid #e2e2e2", padding: "24px 0", flexShrink: 0
      }}>
        <div style={{ padding: "0 24px", marginBottom: 32 }}>
          <h1 style={{ fontSize: 18, fontWeight: 900, color: "#006e1c", letterSpacing: "-0.5px" }}>Quản Trị Nhà Xe</h1>
          <p style={{ fontSize: 11, color: "#6f7a6b", textTransform: "uppercase", letterSpacing: "1px", marginTop: 2 }}>Trung Tâm Hỗ Trợ</p>
        </div>

        <nav style={{ flex: 1 }}>
          {sidebarItems.map((item) => (
            <Link key={item.label} to={item.path}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "12px 24px", fontSize: 14, fontWeight: item.active ? 700 : 500,
                color: item.active ? "#006e1c" : "#3f4a3c",
                background: item.active ? "rgba(0,110,28,0.08)" : "transparent",
                borderRight: item.active ? "3px solid #006e1c" : "none",
                textDecoration: "none", transition: "all 0.15s"
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* User profile */}
        <div style={{ padding: "16px 24px", borderTop: "1px solid #e2e2e2" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg, #006e1c, #4caf50)",
              display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 16
            }}>
              {(user.fullName || user.username || "U").charAt(0).toUpperCase()}
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#1a1c1c" }}>{user.fullName || user.username || "Support"}</p>
              <p style={{ fontSize: 11, color: "#6f7a6b" }}>Nhân Viên Hỗ Trợ</p>
            </div>
          </div>
          <button onClick={handleLogout} style={{
            display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#6f7a6b",
            background: "none", border: "none", cursor: "pointer", padding: 0
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>logout</span>
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* === MAIN CONTENT === */}
      <main style={{ flex: 1, padding: "32px 40px", overflow: "auto" }}>
        {/* Top Bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 12, background: "#ffffff",
            borderRadius: 12, padding: "10px 20px", flex: 1, maxWidth: 480,
            border: "1px solid #becab9"
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20, color: "#6f7a6b" }}>search</span>
            <input
              placeholder="Tìm kiếm theo mã vé (code)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              style={{
                border: "none", outline: "none", background: "transparent",
                fontSize: 14, flex: 1, color: "#1a1c1c"
              }}
            />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={() => handleSearch()} style={{
              display: "flex", alignItems: "center", gap: 8, background: "#006e1c",
              borderRadius: 12, padding: "8px 16px", border: "none", fontSize: 13, color: "#fff", fontWeight: 700, cursor: "pointer"
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>search</span>
              Tìm
            </button>
            <button onClick={handleRefresh} style={{
              display: "flex", alignItems: "center", gap: 8, background: "#fff",
              borderRadius: 12, padding: "8px 16px", border: "1px solid #becab9", fontSize: 13, color: "#3f4a3c", cursor: "pointer"
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>refresh</span>
              Làm mới
            </button>
          </div>
        </div>

        {/* Section Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div>
            <p style={{ fontSize: 11, color: "#6f7a6b", textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 600, marginBottom: 4 }}>Quản Lý Điểu Hành</p>
            <h2 style={{ fontSize: 28, fontWeight: 900, color: "#1a1c1c", letterSpacing: "-0.5px" }}>Danh Sách Vé</h2>
          </div>
        </div>

        {/* Stat Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
          {[
            { label: "Tổng Số Vé", value: totalTickets.toLocaleString(), icon: "confirmation_number", color: "#006e1c", bg: "linear-gradient(135deg, #e8f5e9, #c8e6c9)" },
            { label: "Chờ Thanh Toán", value: pendingTickets, icon: "hourglass_top", color: "#9f4200", bg: "linear-gradient(135deg, #fff3e0, #ffe0b2)" },
            { label: "Đã Thanh Toán", value: paidTickets, icon: "check_circle", color: "#006e1c", bg: "#fff" },
            { label: "Đã Hủy", value: cancelledTickets, icon: "cancel", color: "#ba1a1a", bg: "#fff" },
          ].map((stat) => (
            <div key={stat.label} style={{
              background: stat.bg, borderRadius: 16, padding: "20px 24px",
              border: "1px solid rgba(190,202,185,0.3)"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <p style={{ fontSize: 12, color: "#6f7a6b", fontWeight: 500 }}>{stat.label}</p>
                <span className="material-symbols-outlined" style={{ fontSize: 22, color: stat.color }}>{stat.icon}</span>
              </div>
              <p style={{ fontSize: 32, fontWeight: 900, color: stat.color, letterSpacing: "-1px" }}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Filter Buttons */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#3f4a3c", display: "flex", alignItems: "center", marginRight: 8 }}>Lọc:</p>
          {[
            { label: "Tất cả", value: "" },
            { label: "Đã giữ chỗ", value: "reserved" },
            { label: "Đã thanh toán", value: "paid" },
            { label: "Đã hủy", value: "cancelled" },
            { label: "Đã lên xe", value: "checked_in" },
          ].map(f => (
            <button key={f.value} onClick={() => setFilterStatus(f.value)} style={{
              padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: "pointer",
              border: filterStatus === f.value ? "none" : "1px solid #becab9",
              background: filterStatus === f.value ? "#006e1c" : "#fff",
              color: filterStatus === f.value ? "#fff" : "#3f4a3c",
              transition: "all 0.15s"
            }}>{f.label}</button>
          ))}
          <span style={{ width: 1, background: "#e2e2e2", margin: "0 4px" }}></span>
          {[
            { label: "Tất cả", value: "" },
            { label: "Một chiều", value: "one_way" },
            { label: "Khứ hồi", value: "round_trip" },
          ].map(f => (
            <button key={f.value + "_type"} onClick={() => setFilterType(f.value)} style={{
              padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: "pointer",
              border: filterType === f.value ? "none" : "1px solid #9f4200",
              background: filterType === f.value ? "#9f4200" : "#fff",
              color: filterType === f.value ? "#fff" : "#9f4200",
              transition: "all 0.15s"
            }}>{f.label}</button>
          ))}
        </div>

        {/* Table Section */}
        <div style={{ marginBottom: 24 }}>
          {(() => {
            const displayTickets = tickets.filter(t => {
              const q = String(search || "").toLowerCase().trim();
              if (!q) return true;
              const id = String(t.id || "").toLowerCase();
              const c = String(t.code || "").toLowerCase();
              
              // Chỉ tìm kiếm trên ID vé hoặc mã giao dịch dài, bỏ qua Mã Đặt Chỗ (Booking ID)
              return id.includes(q) || c.includes(q);
            });

            return (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: "#1a1c1c" }}>Lịch Sử Đặt Vé</h3>
                  <span style={{ fontSize: 13, color: "#6f7a6b" }}>Đang hiển thị {displayTickets.length} vé</span>
                </div>

                {error ? (
                  <div style={{ background: "#ffdad6", color: "#93000a", padding: 16, borderRadius: 12 }}>{error}</div>
                ) : loading && tickets.length === 0 ? (
                  <div style={{ textAlign: "center", padding: 48, color: "#6f7a6b" }}>
                    <div style={{ width: 40, height: 40, border: "3px solid #becab9", borderTop: "3px solid #006e1c", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }}></div>
                    Đang tải dữ liệu...
                  </div>
                ) : displayTickets.length === 0 ? (
                  <div style={{ background: "#fff", borderRadius: 16, padding: 48, textAlign: "center", color: "#6f7a6b" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 48, opacity: 0.4, display: "block", marginBottom: 8 }}>inbox</span>
                    <p style={{ fontWeight: 600 }}>Không tìm thấy vé nào phù hợp.</p>
                  </div>
                ) : (
                  <div style={{ background: "#ffffff", borderRadius: 16, overflow: "hidden" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ borderBottom: "2px solid #e2e2e2" }}>
                          {["MÃ VÉ", "MÃ ĐẶT CHỖ", "LOẠI VÉ", "KHỞI HÀNH", "GỐC", "GIẢM", "TỔNG TIỀN", "TRẠNG THÁI", ""].map(h => (
                            <th key={h} style={{
                              padding: "14px 16px", fontSize: 11, fontWeight: 700, color: "#6f7a6b",
                              textAlign: "left", textTransform: "uppercase", letterSpacing: "0.5px"
                            }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {displayTickets.map((t) => {
                    const statusName = String(t.status || "").toLowerCase();
                    const isPending = statusName === "pending" || statusName === "reserved";
                    const isCancelled = statusName === "cancelled";
                    const isPaid = statusName === "paid" || statusName === "checked_in";
                    const bookingTypeText = t.bookingType === "round_trip" ? "Khứ hồi" : "Một chiều";

                    const statusLabel = {
                      reserved: "Đã giữ chỗ", pending: "Chờ thanh toán", paid: "Đã thanh toán",
                      cancelled: "Đã hủy", checked_in: "Đã lên xe"
                    }[statusName] || t.status;

                    return (
                      <tr key={t.id} style={{ borderBottom: "1px solid #f3f3f3", transition: "background 0.15s" }}
                        onMouseEnter={e => e.currentTarget.style.background = "#f9fdf9"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                        <td style={{ padding: "14px 16px" }}>
                          <span style={{ fontWeight: 800, color: "#006e1c", fontSize: 13 }}>#{t.id}</span>
                        </td>
                        <td style={{ padding: "14px 16px" }}>
                          <span style={{ fontWeight: 600, fontSize: 13, color: "#1a1c1c" }}>BK-{t.bookingId}</span>
                        </td>
                        <td style={{ padding: "14px 16px" }}>
                          <span style={{
                            background: t.bookingType === "round_trip" ? "rgba(159,66,0,0.08)" : "rgba(0,110,28,0.08)",
                            color: t.bookingType === "round_trip" ? "#9f4200" : "#006e1c",
                            padding: "4px 10px", borderRadius: 6, fontWeight: 700, fontSize: 12
                          }}>{bookingTypeText}</span>
                        </td>
                        <td style={{ padding: "14px 16px", fontSize: 13, color: "#3f4a3c" }}>
                          {t.departureDate ? new Date(t.departureDate).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric" }) : "N/A"}
                        </td>
                        <td style={{ padding: "14px 16px", fontSize: 13, color: "#3f4a3c" }}>
                          {Number(t.originalAmount || 0).toLocaleString()}đ
                        </td>
                        <td style={{ padding: "14px 16px" }}>
                          {t.discountAmount > 0 ? (
                            <span style={{ fontWeight: 700, fontSize: 13, color: "#006e1c" }}>-{Number(t.discountAmount).toLocaleString()}đ</span>
                          ) : (
                            <span style={{ fontSize: 13, color: "#6f7a6b" }}>0đ</span>
                          )}
                        </td>
                        <td style={{ padding: "14px 16px" }}>
                          <span style={{ fontWeight: 800, fontSize: 14, color: "#9f4200" }}>
                            {Number(t.totalAmount || 0).toLocaleString()}
                          </span>
                          <span style={{ fontSize: 11, color: "#6f7a6b", marginLeft: 2 }}>VNĐ</span>
                        </td>
                        <td style={{ padding: "14px 16px" }}>
                          <span style={{
                            display: "inline-flex", alignItems: "center", gap: 4,
                            fontSize: 12, fontWeight: 700, padding: "4px 10px", borderRadius: 20,
                            ...(isPaid ? { background: "#e8f5e9", color: "#006e1c" } :
                              isPending ? { background: "#fff3e0", color: "#9f4200" } :
                                isCancelled ? { background: "#ffdad6", color: "#ba1a1a" } :
                                  { background: "#e2e2e2", color: "#3f4a3c" })
                          }}>
                            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor" }}></span>
                            {statusLabel}
                          </span>
                        </td>
                        <td style={{ padding: "14px 16px", textAlign: "right" }}>
                          <button onClick={() => handleView(t.id)} style={{
                            padding: "6px 14px", borderRadius: 8, border: "1px solid #becab9",
                            background: "#fff", color: "#3f4a3c", fontSize: 12,
                            fontWeight: 700, cursor: "pointer", transition: "all 0.15s"
                          }}>
                            Chi tiết
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Load More */}
              <div style={{
                display: "flex", justifyContent: "center", alignItems: "center",
                padding: "16px", borderTop: "1px solid #f3f3f3", gap: 16
              }}>
                <span style={{ fontSize: 13, color: "#6f7a6b" }}>Đang hiển thị {displayTickets.length} vé</span>
                {nextCursor && (
                  <button onClick={() => fetchTickets(true)} disabled={loading} style={{
                    padding: "8px 24px", borderRadius: 12, border: "1px solid #becab9",
                    background: loading ? "#f3f3f3" : "#fff", color: "#006e1c",
                    fontWeight: 700, fontSize: 13, cursor: loading ? "default" : "pointer",
                    display: "flex", alignItems: "center", gap: 8
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>expand_more</span>
                    {loading ? "Đang tải..." : "Tải thêm"}
                  </button>
                )}
              </div>
            </div>
          )}
        </>
      );
    })()}
        </div>
      </main>

      {/* === MODAL CHI TIẾT VÉ === */}
      {viewTicket && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000,
          display: "flex", alignItems: "center", justifyContent: "center",
          backdropFilter: "blur(4px)", animation: "fadeIn 0.2s ease"
        }} onClick={() => setViewTicket(null)}>
          <div style={{
            background: "#fff", borderRadius: 20, width: "100%", maxWidth: 520,
            padding: 0, overflow: "hidden", boxShadow: "0 25px 50px rgba(0,0,0,0.15)",
            animation: "slideUp 0.25s ease"
          }} onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div style={{
              background: "linear-gradient(135deg, #006e1c, #4caf50)", padding: "24px 28px",
              display: "flex", justifyContent: "space-between", alignItems: "center"
            }}>
              <div>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 600 }}>Chi Tiết Vé</p>
                <h3 style={{ fontSize: 22, fontWeight: 900, color: "#fff", marginTop: 4 }}>#{viewTicket.id}</h3>
              </div>
              <button onClick={() => setViewTicket(null)} style={{
                background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "50%",
                width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer"
              }}>
                <span className="material-symbols-outlined" style={{ color: "#fff", fontSize: 20 }}>close</span>
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: "24px 28px" }}>
              {/* Status Badge */}
              {(() => {
                const st = String(viewTicket.status || "").toLowerCase();
                const cfg = {
                  paid: { label: "Đã thanh toán", bg: "#e8f5e9", color: "#006e1c", icon: "check_circle" },
                  reserved: { label: "Đã giữ chỗ", bg: "#fff3e0", color: "#9f4200", icon: "schedule" },
                  pending: { label: "Chờ thanh toán", bg: "#fff3e0", color: "#9f4200", icon: "hourglass_top" },
                  cancelled: { label: "Đã hủy", bg: "#ffdad6", color: "#ba1a1a", icon: "cancel" },
                  checked_in: { label: "Đã lên xe", bg: "#e8f5e9", color: "#006e1c", icon: "directions_bus" },
                  expired: { label: "Hết hạn", bg: "#e2e2e2", color: "#3f4a3c", icon: "timer_off" },
                }[st] || { label: viewTicket.status, bg: "#e2e2e2", color: "#3f4a3c", icon: "info" };
                return (
                  <div style={{
                    display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 16px",
                    borderRadius: 12, background: cfg.bg, marginBottom: 20
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18, color: cfg.color }}>{cfg.icon}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: cfg.color }}>{cfg.label}</span>
                  </div>
                );
              })()}

              {/* Info Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                {[
                  { label: "Mã đặt chỗ", value: `BK-${viewTicket.bookingId || "N/A"}` },
                  { label: "Mã vé (Code)", value: viewTicket.code || "N/A" },
                  { label: "Loại vé", value: viewTicket.bookingType === "round_trip" ? "Khứ hồi" : "Một chiều" },
                  { label: "Ngày khởi hành", value: viewTicket.departureDate ? new Date(viewTicket.departureDate).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric" }) : "N/A" },
                ].map(item => (
                  <div key={item.label} style={{ background: "#f9f9f9", borderRadius: 12, padding: "12px 16px" }}>
                    <p style={{ fontSize: 11, color: "#6f7a6b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>{item.label}</p>
                    <p style={{ fontSize: 14, fontWeight: 700, color: "#1a1c1c" }}>{item.value}</p>
                  </div>
                ))}
              </div>

              {/* Price Breakdown */}
              <div style={{ background: "#f9f9f9", borderRadius: 14, padding: "16px 20px", marginBottom: 20 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: "#6f7a6b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 12 }}>Chi Tiết Thanh Toán</p>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 13, color: "#3f4a3c" }}>Giá gốc</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#1a1c1c" }}>{Number(viewTicket.originalAmount || 0).toLocaleString()}đ</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 13, color: "#3f4a3c" }}>Giảm giá</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#006e1c" }}>-{Number(viewTicket.discountAmount || 0).toLocaleString()}đ</span>
                </div>
                <div style={{ borderTop: "1px dashed #becab9", paddingTop: 10, display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: "#1a1c1c" }}>Tổng cộng</span>
                  <span style={{ fontSize: 18, fontWeight: 900, color: "#9f4200" }}>{Number(viewTicket.totalAmount || 0).toLocaleString()} VNĐ</span>
                </div>
              </div>

              {actionError && (
                <div style={{ padding: "12px 16px", background: "#ffdad6", color: "#ba1a1a", borderRadius: 12, fontSize: 13, marginBottom: 16 }}>
                  {actionError}
                </div>
              )}

              {/* Actions */}
              <div style={{ display: "flex", gap: 12 }}>
                <button onClick={() => setViewTicket(null)} style={{
                  flex: 1, padding: "12px", borderRadius: 12, border: "1px solid #becab9",
                  background: "#fff", color: "#3f4a3c", fontWeight: 700, fontSize: 13, cursor: "pointer"
                }}>Đóng</button>
                {String(viewTicket.status || "").toLowerCase() !== "cancelled" && String(viewTicket.status || "").toLowerCase() !== "expired" && (
                  <button onClick={() => handleCancel(viewTicket.id)} disabled={cancelLoading} style={{
                    flex: 1, padding: "12px", borderRadius: 12, border: "none",
                    background: cancelLoading ? "#f3f3f3" : "#ffdad6", color: cancelLoading ? "#6f7a6b" : "#ba1a1a", fontWeight: 700, fontSize: 13, cursor: cancelLoading ? "default" : "pointer"
                  }}>
                    {cancelLoading ? "Đang xử lý..." : "Hủy Vé Này"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
