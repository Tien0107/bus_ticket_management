import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { logout } from "../../api/auth";
import { createSupportCoupon, getSupportCoupons, updateSupportCoupon } from "../../api/companySupport";
import { IconButton } from "../company/CompanyUI";
import { clearAuthSession, getStoredUser } from "../../utils/authStorage";

const PREVIEW_ORDER_AMOUNT = 300000;

const initialForm = {
  code: "",
  discountType: "percent",
  discountValue: "",
  minOrderAmount: "",
  maxDiscountAmount: "",
  totalQuantity: "",
  startDate: "",
  endDate: "",
  isActive: true,
};

const getDigits = (value) => String(value || "").replace(/\D/g, "");

const toNumber = (value) => {
  const digits = getDigits(value);
  return digits ? Number(digits) : 0;
};

const formatVnd = (value) => `${Number(value || 0).toLocaleString("vi-VN")}đ`;

const formatVndInput = (value) => {
  const digits = getDigits(value);
  return digits ? Number(digits).toLocaleString("vi-VN") : "";
};

const toDateTimeLocal = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
};

const extractCoupons = (response) => {
  const raw = response.data?.data || response.data;
  return Array.isArray(raw) ? raw : (raw?.items || raw?.coupons || raw?.records || raw?.content || []);
};

const getErrorMessage = (err) => {
  const issues = err.response?.data?.issues;
  if (Array.isArray(issues) && issues.length > 0) {
    return issues.map((issue) => issue.reason || issue.message || issue.field).filter(Boolean).join(" | ");
  }
  return err.response?.data?.message || err.response?.data?.error || err.message || "Có lỗi xảy ra.";
};

export default function SupportCoupons() {
  const navigate = useNavigate();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const itemsPerPage = 8;

  const user = getStoredUser();

  const getCompanyId = () => {
    const storedUser = getStoredUser();
    return storedUser.companyId || storedUser.company?.id || null;
  };

  const fetchCoupons = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const companyId = getCompanyId();
      const res = await getSupportCoupons(companyId ? { companyId } : undefined);
      setCoupons(extractCoupons(res));
    } catch (err) {
      setError(getErrorMessage(err) || "Không thể tải danh sách khuyến mãi.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const filteredCoupons = useMemo(() => {
    const keyword = search.trim().toUpperCase();
    if (!keyword) return coupons;
    return coupons.filter((coupon) => String(coupon.code || "").toUpperCase().includes(keyword));
  }, [coupons, search]);

  const totalPages = Math.max(1, Math.ceil(filteredCoupons.length / itemsPerPage));
  const paginated = filteredCoupons.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const preview = useMemo(() => {
    const discountValue = toNumber(form.discountValue);
    const minOrderAmount = toNumber(form.minOrderAmount);
    const maxDiscountAmount = form.discountType === "percent"
      ? toNumber(form.maxDiscountAmount)
      : discountValue;
    const eligible = PREVIEW_ORDER_AMOUNT >= minOrderAmount;
    const rawDiscount = form.discountType === "percent"
      ? Math.floor((PREVIEW_ORDER_AMOUNT * discountValue) / 100)
      : discountValue;
    const cappedDiscount = form.discountType === "percent"
      ? Math.min(rawDiscount, maxDiscountAmount || rawDiscount)
      : rawDiscount;
    const discountAmount = eligible ? Math.min(cappedDiscount, PREVIEW_ORDER_AMOUNT) : 0;

    return {
      eligible,
      discountAmount,
      customerPays: PREVIEW_ORDER_AMOUNT - discountAmount,
      maxDiscountAmount,
    };
  }, [form.discountType, form.discountValue, form.maxDiscountAmount, form.minOrderAmount]);

  const activeCoupons = coupons.filter((coupon) => coupon.isActive !== false).length;
  const totalUsed = coupons.reduce((sum, coupon) => sum + Number(coupon.usedQuantity || 0), 0);
  const totalIssued = coupons.reduce((sum, coupon) => sum + Number(coupon.totalQuantity || 0), 0);
  const fixedCoupons = coupons.filter((coupon) => coupon.discountType === "fixed").length;

  const openCreateModal = () => {
    setEditId(null);
    setForm(initialForm);
    setSubmitError("");
    setModalOpen(true);
  };

  const openEditModal = (coupon) => {
    const discountValue = String(Number(coupon.discountValue || 0) || "");
    setEditId(coupon.id);
    setForm({
      code: String(coupon.code || "").toUpperCase().replace(/\s/g, ""),
      discountType: coupon.discountType || "percent",
      discountValue,
      minOrderAmount: String(Number(coupon.minOrderAmount || 0) || ""),
      maxDiscountAmount: String(Number(coupon.maxDiscountAmount || coupon.discountValue || 0) || ""),
      totalQuantity: String(Number(coupon.totalQuantity || 0) || ""),
      startDate: toDateTimeLocal(coupon.startDate),
      endDate: toDateTimeLocal(coupon.endDate),
      isActive: coupon.isActive !== false,
    });
    setSubmitError("");
    setModalOpen(true);
  };

  const closeModal = () => {
    if (submitLoading) return;
    setModalOpen(false);
    setEditId(null);
    setForm(initialForm);
    setSubmitError("");
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error(err);
    }
    clearAuthSession();
    navigate("/login", { replace: true });
  };

  const handleCodeChange = (value) => {
    setForm((prev) => ({
      ...prev,
      code: value.toUpperCase().replace(/\s/g, ""),
    }));
  };

  const handleDiscountTypeChange = (discountType) => {
    setForm((prev) => ({
      ...prev,
      discountType,
      maxDiscountAmount: discountType === "fixed" ? prev.discountValue : prev.maxDiscountAmount,
    }));
  };

  const handleMoneyChange = (field, value) => {
    const digits = getDigits(value);
    setForm((prev) => ({
      ...prev,
      [field]: digits,
      ...(field === "discountValue" && prev.discountType === "fixed" ? { maxDiscountAmount: digits } : {}),
    }));
  };

  const handleIntegerChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: getDigits(value) }));
  };

  const validateAndBuildPayload = () => {
    const code = form.code.trim().toUpperCase();
    const discountValue = toNumber(form.discountValue);
    const minOrderAmount = toNumber(form.minOrderAmount);
    const maxDiscountAmount = form.discountType === "fixed"
      ? discountValue
      : toNumber(form.maxDiscountAmount);
    const totalQuantity = toNumber(form.totalQuantity);

    if (!code) return "Vui lòng nhập mã coupon.";
    if (!/^[A-Z0-9_-]+$/.test(code)) return "Mã coupon chỉ nên gồm chữ in hoa, số, dấu gạch ngang hoặc gạch dưới.";
    if (form.discountType !== "percent" && form.discountType !== "fixed") return "Loại giảm giá không hợp lệ.";
    if (discountValue <= 0) return "Vui lòng nhập giá trị giảm lớn hơn 0.";
    if (form.discountType === "percent" && discountValue > 100) return "Giảm theo % không được lớn hơn 100.";
    if (form.discountType === "percent" && maxDiscountAmount <= 0) return "Vui lòng nhập giảm tối đa VND cho mã giảm theo %.";
    if (!form.minOrderAmount) return "Vui lòng nhập đơn tối thiểu.";
    if (minOrderAmount < 0) return "Đơn tối thiểu không hợp lệ.";
    if (totalQuantity <= 0) return "Vui lòng nhập tổng lượt sử dụng lớn hơn 0.";

    const start = form.startDate ? new Date(form.startDate) : null;
    const end = form.endDate ? new Date(form.endDate) : null;
    if (start && Number.isNaN(start.getTime())) return "Ngày bắt đầu không hợp lệ.";
    if (end && Number.isNaN(end.getTime())) return "Ngày kết thúc không hợp lệ.";
    if (start && end && end <= start) return "Ngày kết thúc phải sau ngày bắt đầu.";

    const payload = {
      code,
      discountType: form.discountType,
      discountValue,
      minOrderAmount,
      maxDiscountAmount,
      totalQuantity,
      isActive: Boolean(form.isActive),
    };

    if (!editId) {
      const companyId = getCompanyId();
      if (companyId) {
        payload.companyId = Number(companyId);
      }
      payload.usedQuantity = 0;
    }

    if (start) payload.startDate = start.toISOString();
    if (end) payload.endDate = end.toISOString();

    return payload;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const payloadOrError = validateAndBuildPayload();
    if (typeof payloadOrError === "string") {
      setSubmitError(payloadOrError);
      return;
    }

    try {
      setSubmitLoading(true);
      setSubmitError("");
      if (editId) {
        await updateSupportCoupon(editId, payloadOrError);
        toast.success("Cập nhật coupon thành công");
      } else {
        await createSupportCoupon(payloadOrError);
        toast.success("Tạo coupon thành công");
      }
      setModalOpen(false);
      setEditId(null);
      setForm(initialForm);
      setSubmitError("");
      await fetchCoupons();
    } catch (err) {
      setSubmitError(getErrorMessage(err));
    } finally {
      setSubmitLoading(false);
    }
  };

  const sidebarItems = [
    { icon: "confirmation_number", label: "Quản lý vé", path: "/company-support/tickets" },
    { icon: "sell", label: "Mã khuyến mãi", path: "/company-support/coupons", active: true },
    { icon: "person", label: "Hồ sơ", path: "/company-support/profile" },
  ];

  const currencyField = ({ label, field, required = false, disabled = false, helper = "", placeholder = "0" }) => (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-outline">
        {label}{required ? " *" : ""}
      </span>
      <span className="relative block">
        <input
          value={formatVndInput(form[field])}
          onChange={(event) => handleMoneyChange(field, event.target.value)}
          disabled={disabled}
          inputMode="numeric"
          placeholder={placeholder}
          className="w-full rounded-lg border border-outline-variant/60 bg-white px-3 py-3 pr-10 text-sm font-bold text-on-surface outline-none transition-all placeholder:text-outline/60 focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:bg-surface-container-low disabled:text-on-surface-variant"
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-extrabold text-outline">đ</span>
      </span>
      {helper ? <span className="mt-1 block text-xs font-medium text-on-surface-variant">{helper}</span> : null}
    </label>
  );

  const discountLabel = (coupon) => {
    if (coupon.discountType === "percent") {
      return `${Number(coupon.discountValue || 0)}%`;
    }
    return formatVnd(coupon.discountValue);
  };

  return (
    <div className="flex min-h-screen bg-surface font-body text-on-surface">
      <aside className="flex w-[260px] shrink-0 flex-col border-r border-surface-container-high bg-white py-6">
        <div className="mb-6 px-4">
          <h1 className="text-lg font-black tracking-tight text-primary">Quản trị nhà xe</h1>
          <p className="mt-1 text-xs font-bold uppercase tracking-wide text-outline">Trang khuyến mãi</p>
        </div>

        <nav className="flex-1">
          {sidebarItems.map((item) => (
            <Link
              key={item.label}
              to={item.path}
              className={`flex items-center gap-3 border-r-4 px-6 py-3 text-sm transition-colors ${
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

        <div className="border-t border-surface-container-high px-6 pt-4">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-black text-white">
              {(user.fullName || user.username || "U").charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-extrabold text-on-surface">{user.fullName || user.username || "Admin"}</p>
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
            <h2 className="text-2xl font-black tracking-tight text-on-surface">Quản lý mã khuyến mãi</h2>
            <p className="mt-1 text-sm font-medium text-on-surface-variant">
              Tạo coupon cho nhà xe, ưu tiên định dạng VND và kiểm soát giới hạn giảm giá.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex h-11 min-w-[280px] items-center gap-2 rounded-lg border border-outline-variant/60 bg-white px-3">
              <span className="material-symbols-outlined text-[20px] text-outline">search</span>
              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Tìm mã coupon..."
                className="h-full min-w-0 flex-1 border-none bg-transparent text-sm font-semibold outline-none placeholder:text-outline"
              />
            </div>
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-extrabold text-white shadow-sm transition-colors hover:bg-primary/90"
            >
              <span className="material-symbols-outlined text-[20px]">add</span>
              Thêm coupon
            </button>
          </div>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-lg border border-outline-variant/30 bg-white p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-outline">Đang hoạt động</p>
            <p className="mt-1 text-2xl font-black text-primary">{activeCoupons}</p>
          </div>
          <div className="rounded-lg border border-outline-variant/30 bg-white p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-outline">Đã dùng</p>
            <p className="mt-1 text-2xl font-black text-on-surface">{totalUsed.toLocaleString("vi-VN")}</p>
          </div>
          <div className="rounded-lg border border-outline-variant/30 bg-white p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-outline">Tổng lượt phát hành</p>
            <p className="mt-1 text-2xl font-black text-on-surface">{totalIssued.toLocaleString("vi-VN")}</p>
          </div>
          <div className="rounded-lg border border-outline-variant/30 bg-white p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-outline">Coupon VND</p>
            <p className="mt-1 text-2xl font-black text-secondary">{fixedCoupons}</p>
          </div>
        </div>

        <section className="overflow-hidden rounded-lg border border-outline-variant/30 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-surface-container px-4 py-2.5">
            <div>
              <h3 className="text-lg font-black text-on-surface">Danh sách coupon</h3>
              <p className="mt-0.5 text-xs font-semibold text-on-surface-variant">
                Hiển thị {paginated.length} / {filteredCoupons.length} mã
              </p>
            </div>
            <button
              type="button"
              onClick={fetchCoupons}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-outline-variant/60 bg-white px-3 text-sm font-bold text-on-surface transition-colors hover:bg-surface-container-low"
            >
              <span className="material-symbols-outlined text-[18px]">refresh</span>
              Làm mới
            </button>
          </div>

          {error ? (
            <div className="m-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div>
          ) : null}

          {loading ? (
            <div className="flex min-h-[260px] items-center justify-center text-sm font-bold text-outline">Đang tải danh sách coupon...</div>
          ) : filteredCoupons.length === 0 ? (
            <div className="flex min-h-[260px] flex-col items-center justify-center px-6 text-center">
              <span className="material-symbols-outlined text-5xl text-outline/40">sell</span>
              <p className="mt-3 text-sm font-bold text-on-surface">Chưa có coupon phù hợp</p>
              <p className="mt-1 text-sm text-on-surface-variant">Bấm “Thêm coupon” để tạo mã giảm giá mới.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[960px] border-collapse">
                  <thead>
                    <tr className="border-b border-surface-container bg-surface-container-low">
                      {["Mã coupon", "Giảm giá", "Đơn tối thiểu", "Giảm tối đa", "Đã dùng/Tổng", "Trạng thái", "Thời gian", ""].map((header) => (
                        <th key={header} className="px-4 py-2 text-left text-[10px] font-black uppercase tracking-wide text-outline">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((coupon) => {
                      const used = Number(coupon.usedQuantity || 0);
                      const total = Number(coupon.totalQuantity || 0);
                      const usagePercent = total > 0 ? Math.min((used / total) * 100, 100) : 0;
                      return (
                        <tr key={coupon.id || coupon.code} className="border-b border-surface-container/70 hover:bg-surface-container-low/60">
                          <td className="px-4 py-2.5">
                            <p className="font-black tracking-wide text-on-surface">{coupon.code}</p>
                          </td>
                          <td className="px-4 py-2.5">
                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${
                              coupon.discountType === "percent"
                                ? "bg-primary/10 text-primary"
                                : "bg-secondary/10 text-secondary"
                            }`}>
                              {discountLabel(coupon)}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-sm font-bold text-on-surface">{formatVnd(coupon.minOrderAmount)}</td>
                          <td className="px-4 py-2.5 text-sm font-bold text-on-surface">{formatVnd(coupon.maxDiscountAmount)}</td>
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-3">
                              <div className="h-2 w-24 overflow-hidden rounded-full bg-surface-container-high">
                                <div
                                  className={`h-full rounded-full ${usagePercent >= 90 ? "bg-error" : usagePercent >= 60 ? "bg-secondary" : "bg-primary"}`}
                                  style={{ width: `${usagePercent}%` }}
                                />
                              </div>
                              <span className="whitespace-nowrap text-xs font-black text-on-surface-variant">{used}/{total}</span>
                            </div>
                          </td>
                          <td className="px-4 py-2.5">
                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${
                              coupon.isActive !== false ? "bg-primary/10 text-primary" : "bg-surface-container-high text-outline"
                            }`}>
                              {coupon.isActive !== false ? "Đang bật" : "Đã tắt"}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-xs font-semibold text-on-surface-variant">
                            <p>{coupon.startDate ? new Date(coupon.startDate).toLocaleString("vi-VN") : "Không giới hạn"}</p>
                            <p className="mt-1">đến {coupon.endDate ? new Date(coupon.endDate).toLocaleString("vi-VN") : "Không giới hạn"}</p>
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            <IconButton
                              icon="edit"
                              label="Sửa"
                              onClick={() => openEditModal(coupon)}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between border-t border-surface-container px-4 py-2.5">
                <span className="text-sm font-semibold text-on-surface-variant">
                  Trang {currentPage} / {totalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                    className="h-9 rounded-lg border border-outline-variant/60 px-3 text-sm font-bold text-on-surface disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Trước
                  </button>
                  <button
                    type="button"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                    className="h-9 rounded-lg border border-outline-variant/60 px-3 text-sm font-bold text-on-surface disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Sau
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </main>

      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
          <form onSubmit={handleSubmit} className="max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-lg bg-white shadow-[0_24px_80px_rgba(15,23,42,0.25)]">
            <div className="flex items-center justify-between border-b border-surface-container px-6 py-4">
              <div>
                <h3 className="text-xl font-black text-on-surface">{editId ? "Cập nhật coupon" : "Thêm coupon"}</h3>
                <p className="mt-1 text-sm font-medium text-on-surface-variant">
                  Tiền nhập theo VND
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                disabled={submitLoading}
                className="flex h-10 w-10 items-center justify-center rounded-lg text-outline transition-colors hover:bg-surface-container-low hover:text-on-surface disabled:opacity-50"
                aria-label="Đóng"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="grid max-h-[calc(92vh-80px)] overflow-y-auto lg:grid-cols-[1.25fr_0.75fr]">
              <div className="space-y-5 p-6">
                {submitError ? (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{submitError}</div>
                ) : null}

                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-outline">Mã coupon *</span>
                  <input
                    value={form.code}
                    onChange={(event) => handleCodeChange(event.target.value)}
                    placeholder="SALE20, GIAM50K"
                    className="w-full rounded-lg border border-outline-variant/60 bg-white px-3 py-3 text-sm font-black uppercase tracking-wide text-on-surface outline-none transition-all placeholder:font-semibold placeholder:normal-case placeholder:tracking-normal placeholder:text-outline/60 focus:border-primary focus:ring-4 focus:ring-primary/10"
                  />
                </label>

                <div>
                  <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-outline">Loại giảm giá *</span>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleDiscountTypeChange("percent")}
                      className={`rounded-lg border px-4 py-3 text-left transition-all ${
                        form.discountType === "percent"
                          ? "border-primary bg-primary/10 text-primary ring-4 ring-primary/10"
                          : "border-outline-variant/60 bg-white text-on-surface hover:bg-surface-container-low"
                      }`}
                    >
                      <span className="block text-sm font-black">Giảm theo %</span>
                      <span className="mt-1 block text-xs font-semibold text-on-surface-variant">Ví dụ 20 là giảm 20%</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDiscountTypeChange("fixed")}
                      className={`rounded-lg border px-4 py-3 text-left transition-all ${
                        form.discountType === "fixed"
                          ? "border-secondary bg-secondary/10 text-secondary ring-4 ring-secondary/10"
                          : "border-outline-variant/60 bg-white text-on-surface hover:bg-surface-container-low"
                      }`}
                    >
                      <span className="block text-sm font-black">Giảm tiền VND</span>
                      <span className="mt-1 block text-xs font-semibold text-on-surface-variant">Ví dụ 50.000đ</span>
                    </button>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {form.discountType === "percent" ? (
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-outline">% giảm *</span>
                      <span className="relative block">
                        <input
                          value={form.discountValue}
                          onChange={(event) => handleIntegerChange("discountValue", event.target.value)}
                          inputMode="numeric"
                          placeholder="20"
                          className="w-full rounded-lg border border-outline-variant/60 bg-white px-3 py-3 pr-10 text-sm font-bold text-on-surface outline-none transition-all placeholder:text-outline/60 focus:border-primary focus:ring-4 focus:ring-primary/10"
                        />
                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-extrabold text-outline">%</span>
                      </span>
                    </label>
                  ) : (
                    currencyField({ label: "Số tiền giảm", field: "discountValue", required: true, placeholder: "50.000" })
                  )}

                  {form.discountType === "percent"
                    ? currencyField({ label: "Giảm tối đa", field: "maxDiscountAmount", required: true, placeholder: "50.000" })
                    : currencyField({
                        label: "Giảm tối đa",
                        field: "maxDiscountAmount",
                        disabled: true,
                        helper: "Tự động bằng số tiền giảm cho coupon fixed.",
                      })}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {currencyField({ label: "Đơn tối thiểu", field: "minOrderAmount", required: true, placeholder: "100.000" })}
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-outline">Tổng lượt sử dụng *</span>
                    <input
                      value={form.totalQuantity}
                      onChange={(event) => handleIntegerChange("totalQuantity", event.target.value)}
                      inputMode="numeric"
                      placeholder="100"
                      className="w-full rounded-lg border border-outline-variant/60 bg-white px-3 py-3 text-sm font-bold text-on-surface outline-none transition-all placeholder:text-outline/60 focus:border-primary focus:ring-4 focus:ring-primary/10"
                    />
                  </label>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-outline">Ngày bắt đầu</span>
                    <input
                      type="datetime-local"
                      value={form.startDate}
                      onChange={(event) => setForm((prev) => ({ ...prev, startDate: event.target.value }))}
                      className="w-full rounded-lg border border-outline-variant/60 bg-white px-3 py-3 text-sm font-bold text-on-surface outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-outline">Ngày kết thúc</span>
                    <input
                      type="datetime-local"
                      value={form.endDate}
                      onChange={(event) => setForm((prev) => ({ ...prev, endDate: event.target.value }))}
                      className="w-full rounded-lg border border-outline-variant/60 bg-white px-3 py-3 text-sm font-bold text-on-surface outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10"
                    />
                  </label>
                </div>

                <label className="flex items-center justify-between rounded-lg border border-outline-variant/40 bg-surface-container-low px-4 py-3">
                  <span>
                    <span className="block text-sm font-black text-on-surface">Kích hoạt coupon</span>
                    <span className="mt-1 block text-xs font-semibold text-on-surface-variant">Mặc định bật để khách có thể dùng ngay.</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(event) => setForm((prev) => ({ ...prev, isActive: event.target.checked }))}
                    className="h-5 w-5 accent-primary"
                  />
                </label>
              </div>

              <aside className="border-t border-surface-container bg-surface-container-low p-6 lg:border-l lg:border-t-0">
                <div className="sticky top-0 space-y-4">
                  <div className="rounded-lg border border-outline-variant/30 bg-white p-4 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-wide text-outline">Preview đơn mẫu</p>
                    <p className="mt-1 text-2xl font-black text-on-surface">{formatVnd(PREVIEW_ORDER_AMOUNT)}</p>
                    <div className="mt-5 space-y-3 text-sm">
                      <div className="flex justify-between gap-4">
                        <span className="font-semibold text-on-surface-variant">Loại giảm</span>
                        <span className="font-black text-on-surface">
                          {form.discountType === "percent" ? `${toNumber(form.discountValue)}%` : formatVnd(toNumber(form.discountValue))}
                        </span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="font-semibold text-on-surface-variant">Giảm tối đa</span>
                        <span className="font-black text-on-surface">{formatVnd(preview.maxDiscountAmount)}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="font-semibold text-on-surface-variant">Tiền giảm</span>
                        <span className="font-black text-primary">-{formatVnd(preview.discountAmount)}</span>
                      </div>
                      <div className="border-t border-surface-container pt-3">
                        <div className="flex items-end justify-between gap-4">
                          <span className="font-black text-on-surface">Khách trả</span>
                          <span className="text-2xl font-black text-secondary">{formatVnd(preview.customerPays)}</span>
                        </div>
                      </div>
                    </div>
                    {!preview.eligible ? (
                      <p className="mt-4 rounded-lg bg-secondary/10 px-3 py-2 text-xs font-bold text-secondary">
                        Đơn mẫu chưa đạt đơn tối thiểu {formatVnd(toNumber(form.minOrderAmount))}.
                      </p>
                    ) : null}
                  </div>

                  <div className="rounded-lg border border-outline-variant/30 bg-white p-5 text-sm text-on-surface-variant shadow-sm">
                    {form.discountType === "percent" ? (
                      <p>
                        Ví dụ: Đơn {formatVnd(PREVIEW_ORDER_AMOUNT)}, giảm {toNumber(form.discountValue)}%, tối đa {formatVnd(preview.maxDiscountAmount)} thì khách trả {formatVnd(preview.customerPays)}.
                      </p>
                    ) : (
                      <p>
                        Ví dụ: Đơn {formatVnd(PREVIEW_ORDER_AMOUNT)}, giảm {formatVnd(toNumber(form.discountValue))} thì khách trả {formatVnd(preview.customerPays)}.
                      </p>
                    )}
                  </div>
                </div>
              </aside>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-surface-container px-6 py-4">
              <button
                type="button"
                onClick={closeModal}
                disabled={submitLoading}
                className="h-11 rounded-lg border border-outline-variant/60 bg-white px-5 text-sm font-extrabold text-on-surface transition-colors hover:bg-surface-container-low disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={submitLoading}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-extrabold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitLoading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />
                    Đang lưu...
                  </>
                ) : editId ? "Cập nhật coupon" : "Tạo coupon"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
