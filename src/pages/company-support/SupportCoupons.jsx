import React, { useEffect, useState } from "react";
import { getSupportCoupons, createSupportCoupon, updateSupportCoupon } from "../../api/companySupport";
import { useNavigate, Link } from "react-router-dom";
import { logout } from "../../api/auth";
export default function SupportCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;
  const navigate = useNavigate();

  let userStr = localStorage.getItem("user");
  let user = {};
  try {
    if (userStr && userStr !== "undefined") {
      user = JSON.parse(userStr);
    }
  } catch (e) {
    user = {};
  }

  // Create coupon form
  const [form, setForm] = useState({
    code: "", discountType: "percent", discountValue: "",
    minOrderAmount: "", maxDiscountAmount: "", totalQuantity: "",
    startDate: "", endDate: ""
  });

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const res = await getSupportCoupons();
      const raw = res.data?.data || res.data;
      const list = Array.isArray(raw) ? raw : (raw?.items || raw?.coupons || raw?.records || raw?.content || []);
      setCoupons(list);
    } catch (err) {
      setError("Không thể tải danh sách khuyến mãi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCoupons(); }, []);

  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const [editId, setEditId] = useState(null);

  const handleEditClick = (c) => {
    setEditId(c.id);
    setForm({
      code: c.code || "",
      discountType: c.discountType || "percent",
      discountValue: c.discountValue || "",
      minOrderAmount: c.minOrderAmount || "",
      maxDiscountAmount: c.maxDiscountAmount || "",
      totalQuantity: c.totalQuantity || "",
      startDate: c.startDate ? new Date(c.startDate).toISOString().slice(0, 16) : "",
      endDate: c.endDate ? new Date(c.endDate).toISOString().slice(0, 16) : ""
    });
  };

  const handleCancelEdit = () => {
    setEditId(null);
    setForm({ code: "", discountType: "percent", discountValue: "", minOrderAmount: "", maxDiscountAmount: "", totalQuantity: "", startDate: "", endDate: "" });
  };

  const handleCreateOrUpdate = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        code: form.code,
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        minOrderAmount: Number(form.minOrderAmount),
        maxDiscountAmount: Number(form.maxDiscountAmount),
        totalQuantity: Number(form.totalQuantity),
        usedQuantity: editId ? undefined : 0,
        isActive: true,
      };
      
      if (form.startDate) payload.startDate = new Date(form.startDate).toISOString();
      if (form.endDate) payload.endDate = new Date(form.endDate).toISOString();

      if (editId) {
        await updateSupportCoupon(editId, payload);
        alert("Cập nhật mã khuyến mãi thành công!");
      } else {
        await createSupportCoupon(payload);
        alert("Tạo mã khuyến mãi thành công!");
      }
      
      setEditId(null);
      setForm({ code: "", discountType: "percent", discountValue: "", minOrderAmount: "", maxDiscountAmount: "", totalQuantity: "", startDate: "", endDate: "" });
      fetchCoupons();
    } catch (err) {
      alert("Lỗi: " + (err.response?.data?.message || err.message));
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
  const activeCoupons = coupons.filter(c => c.isActive !== false).length;
  const totalUsed = coupons.reduce((sum, c) => sum + (c.usedQuantity || 0), 0);
  const avgSave = coupons.length > 0
    ? (coupons.reduce((sum, c) => sum + (c.discountValue || 0), 0) / coupons.length).toFixed(0)
    : 0;

  // Pagination
  const totalPages = Math.ceil(coupons.length / itemsPerPage);
  const paginated = coupons.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const sidebarItems = [
    { icon: "confirmation_number", label: "Quản Lý Vé", path: "/company-support/tickets" },
    { icon: "sell", label: "Mã Khuyến Mãi", path: "/company-support/coupons", active: true },
  ];

  const inputStyle = {
    width: "100%", padding: "10px 14px", borderRadius: 10,
    border: "1px solid #becab9", background: "#f9f9f9",
    fontSize: 13, color: "#1a1c1c", outline: "none",
    transition: "border-color 0.15s"
  };

  const labelStyle = {
    fontSize: 11, fontWeight: 700, color: "#6f7a6b",
    textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6, display: "block"
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'Be Vietnam Pro', sans-serif", background: "#f9f9f9" }}>
      {/* === SIDEBAR === */}
      <aside style={{
        width: 260, background: "#ffffff", display: "flex", flexDirection: "column",
        borderRight: "1px solid #e2e2e2", padding: "24px 0", flexShrink: 0
      }}>
        <div style={{ padding: "0 24px", marginBottom: 32 }}>
          <h1 style={{ fontSize: 18, fontWeight: 900, color: "#006e1c", letterSpacing: "-0.5px" }}>Quản Trị Nhà Xe</h1>
          <p style={{ fontSize: 11, color: "#6f7a6b", textTransform: "uppercase", letterSpacing: "1px", marginTop: 2 }}>Trang Khuyến Mãi</p>
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

        {/* User */}
        <div style={{ padding: "16px 24px", borderTop: "1px solid #e2e2e2" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg, #006e1c, #4caf50)",
              display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 16
            }}>
              {(user.fullName || user.username || "U").charAt(0).toUpperCase()}
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#1a1c1c" }}>{user.fullName || user.username || "Admin"}</p>
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
            <input placeholder="Tìm kiếm mã khuyến mãi..." style={{
              border: "none", outline: "none", background: "transparent", fontSize: 14, flex: 1, color: "#1a1c1c"
            }} />
          </div>
        </div>

        {/* Section Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
          <div>
            <h2 style={{ fontSize: 28, fontWeight: 900, color: "#1a1c1c", letterSpacing: "-0.5px", marginBottom: 4 }}>Quản Lý Mã Khuyến Mãi</h2>
            <p style={{ fontSize: 14, color: "#6f7a6b" }}>Thiết lập và theo dõi các chương trình giảm giá.</p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: 32 }}>
          {/* === LEFT: Create Coupon Form === */}
          <div>
            <form onSubmit={handleCreateOrUpdate} style={{
              background: "#ffffff", borderRadius: 16, padding: 28, overflow: "hidden"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 22, color: "#006e1c" }}>{editId ? "edit" : "add_circle"}</span>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: "#1a1c1c" }}>{editId ? "Cập Nhật Mã" : "Tạo Mã Mới"}</h3>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Mã Khuyến Mãi (CODE)</label>
                <input name="code" value={form.code} onChange={handleFormChange}
                  placeholder="VD: GIAM20K" required style={inputStyle} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                <div>
                  <label style={labelStyle}>Loại Giảm Giá</label>
                  <select name="discountType" value={form.discountType} onChange={handleFormChange} style={inputStyle}>
                    <option value="percent">Phần Trăm (%)</option>
                    <option value="fixed">Số Tiền (VNĐ)</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Giá Trị</label>
                  <input name="discountValue" type="number" value={form.discountValue}
                    onChange={handleFormChange} placeholder="20" required style={inputStyle} />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                <div>
                  <label style={labelStyle}>Đơn Tối Thiểu</label>
                  <input name="minOrderAmount" type="number" value={form.minOrderAmount}
                    onChange={handleFormChange} placeholder="100000" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Giảm Tối Đa</label>
                  <input name="maxDiscountAmount" type="number" value={form.maxDiscountAmount}
                    onChange={handleFormChange} placeholder="50000" style={inputStyle} />
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Từ Ngày</label>
                <input name="startDate" type="datetime-local" value={form.startDate}
                  onChange={handleFormChange} required style={inputStyle} />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Đến Ngày</label>
                <input name="endDate" type="datetime-local" value={form.endDate}
                  onChange={handleFormChange} required style={inputStyle} />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Tổng Số Lượng Phát Hành</label>
                <input name="totalQuantity" type="number" value={form.totalQuantity}
                  onChange={handleFormChange} placeholder="500" required style={inputStyle} />
              </div>

              <div style={{ display: "flex", gap: 12 }}>
                <button type="submit" style={{
                  flex: 1, padding: "12px", borderRadius: 12, border: "none",
                  background: "#006e1c", color: "#fff", fontWeight: 700, fontSize: 13,
                  cursor: "pointer", transition: "opacity 0.15s"
                }}>{editId ? "Cập Nhật" : "Tạo Mới"}</button>
                {editId && (
                  <button type="button" onClick={handleCancelEdit} style={{
                    flex: 1, padding: "12px", borderRadius: 12, border: "1px solid #becab9",
                    background: "#f3f3f3", color: "#3f4a3c", fontWeight: 700, fontSize: 13,
                    cursor: "pointer", transition: "opacity 0.15s"
                  }}>Hủy</button>
                )}
              </div>
            </form>
          </div>

          {/* === RIGHT: Stats + Table === */}
          <div>
            {/* Stat cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 28 }}>
              <div style={{ background: "#fff", borderRadius: 14, padding: "20px 24px" }}>
                <p style={{ fontSize: 11, color: "#6f7a6b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>Đang Hoạt Động</p>
                <p style={{ fontSize: 36, fontWeight: 900, color: "#006e1c", letterSpacing: "-1px" }}>{activeCoupons}</p>
              </div>
              <div style={{ background: "#fff", borderRadius: 14, padding: "20px 24px" }}>
                <p style={{ fontSize: 11, color: "#6f7a6b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>Lượt Đã Dùng</p>
                <p style={{ fontSize: 36, fontWeight: 900, color: "#1a1c1c", letterSpacing: "-1px" }}>{totalUsed.toLocaleString()}</p>
              </div>
              <div style={{ background: "#fff", borderRadius: 14, padding: "20px 24px" }}>
                <p style={{ fontSize: 11, color: "#6f7a6b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>Mức Giảm T.Bình</p>
                <p style={{ fontSize: 36, fontWeight: 900, color: "#006e1c", letterSpacing: "-1px" }}>
                  {avgSave}<span style={{ fontSize: 16, color: "#6f7a6b" }}>%</span>
                </p>
              </div>
            </div>

            {/* Manage Coupons Table */}
            <div style={{ background: "#fff", borderRadius: 16, overflow: "hidden" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 24px", borderBottom: "1px solid #f3f3f3" }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: "#1a1c1c" }}>Danh Sách Khuyến Mãi</h3>
              </div>

              {error && <div style={{ padding: 16, background: "#ffdad6", color: "#93000a", margin: 16, borderRadius: 12 }}>{error}</div>}

              {loading ? (
                <div style={{ textAlign: "center", padding: 48, color: "#6f7a6b" }}>Đang tải...</div>
              ) : coupons.length === 0 ? (
                <div style={{ textAlign: "center", padding: 48, color: "#6f7a6b" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 48, opacity: 0.3, display: "block", marginBottom: 8 }}>sell</span>
                  <p style={{ fontWeight: 600 }}>Chưa có mã giảm giá nào.</p>
                </div>
              ) : (
                <>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ borderBottom: "2px solid #e2e2e2" }}>
                        {["MÃ CKT", "GIẢM GIÁ", "ĐƠN TỐI THIỂU", "ĐÃ DÙNG/TỔNG", "HẠN DÙNG", ""].map(h => (
                          <th key={h} style={{
                            padding: "12px 20px", fontSize: 11, fontWeight: 700, color: "#6f7a6b",
                            textAlign: "left", textTransform: "uppercase", letterSpacing: "0.5px"
                          }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {paginated.map((c) => {
                        const used = c.usedQuantity || 0;
                        const total = c.totalQuantity || 1;
                        const pct = Math.min((used / total) * 100, 100);
                        const discountText = c.discountType === "percent"
                          ? `${c.discountValue}% OFF`
                          : `${Number(c.discountValue || 0).toLocaleString()}đ`;

                        return (
                          <tr key={c.id} style={{ borderBottom: "1px solid #f3f3f3", transition: "background 0.15s" }}
                            onMouseEnter={e => e.currentTarget.style.background = "#f9fdf9"}
                            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                            <td style={{ padding: "14px 20px" }}>
                              <span style={{ fontWeight: 800, color: "#1a1c1c", fontSize: 14, letterSpacing: "0.5px" }}>{c.code}</span>
                            </td>
                            <td style={{ padding: "14px 20px", fontSize: 13, color: "#3f4a3c", fontWeight: 500 }}>
                              {discountText}
                            </td>
                            <td style={{ padding: "14px 20px", fontSize: 13, color: "#3f4a3c" }}>
                              {Number(c.minOrderAmount || 0).toLocaleString()}đ
                            </td>
                            <td style={{ padding: "14px 20px", width: 180 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <div style={{ flex: 1, height: 6, background: "#e2e2e2", borderRadius: 3, overflow: "hidden" }}>
                                  <div style={{
                                    width: pct + "%", height: "100%", borderRadius: 3,
                                    background: pct > 80 ? "#ba1a1a" : pct > 50 ? "#9f4200" : "#006e1c",
                                    transition: "width 0.3s"
                                  }}></div>
                                </div>
                                <span style={{ fontSize: 12, fontWeight: 600, color: "#3f4a3c", whiteSpace: "nowrap" }}>
                                  {used}/{total}
                                </span>
                              </div>
                            </td>
                            <td style={{ padding: "14px 20px", fontSize: 12, color: "#6f7a6b" }}>
                              {c.endDate ? new Date(c.endDate).toLocaleDateString("vi-VN") : "N/A"}
                            </td>
                            <td style={{ padding: "14px 20px", textAlign: "right" }}>
                              <button 
                                onClick={() => handleEditClick(c)}
                                style={{
                                padding: "6px 14px", borderRadius: 8, border: "1px solid #becab9",
                                background: "#fff", color: "#3f4a3c", fontSize: 12,
                                fontWeight: 600, cursor: "pointer"
                              }}>Sửa</button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {/* Pagination */}
                  <div style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "14px 20px", borderTop: "1px solid #f3f3f3", fontSize: 13, color: "#6f7a6b"
                  }}>
                    <span>Hiển thị {paginated.length} / {coupons.length} mã</span>
                    <div style={{ display: "flex", gap: 4 }}>
                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
                        <button key={p} onClick={() => setCurrentPage(p)} style={{
                          width: 32, height: 32, borderRadius: 8, border: "none", cursor: "pointer",
                          fontWeight: 700, fontSize: 13,
                          background: currentPage === p ? "#006e1c" : "#f3f3f3",
                          color: currentPage === p ? "#fff" : "#3f4a3c"
                        }}>{p}</button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
