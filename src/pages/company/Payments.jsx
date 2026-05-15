import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  createStripeAccount,
  getPayments,
  getRevenue,
  getStripeBalance,
  updatePayment,
  withdrawStripeBalance,
} from "../../api/company";
import { useToast } from "../../context/ToastContext";
import {
  CompanyPageShell,
  EmptyState,
  ErrorState,
  Field,
  IconButton,
  LoadingState,
  ModalShell,
  PrimaryButton,
  SearchInput,
  SecondaryButton,
  SelectControl,
  StatCard,
  StatusBadge,
  ToolbarCard,
  inputClass,
} from "./CompanyUI";

const paymentStatusLabel = {
  pending: "Đang chờ",
  success: "Thành công",
  failed: "Thất bại",
  refunded: "Đã hoàn tiền",
};

const paymentStatusTone = {
  pending: "amber",
  success: "emerald",
  failed: "red",
  refunded: "blue",
};

const methodLabel = {
  vnpay: "VNPay",
  cash: "Tiền mặt",
  stripe: "Stripe",
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const formatDateTime = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
};

const formatStripeAmount = ({ amount, currency }) => {
  const code = String(currency || "").toUpperCase();
  if (!code) return "—";
  const numericAmount = Number(amount || 0);

  if (code === "VND") {
    return `${new Intl.NumberFormat("vi-VN").format(numericAmount)} ${code}`;
  }

  return `${new Intl.NumberFormat("vi-VN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericAmount / 100)} ${code}`;
};

export default function Payments() {
  const { addToast } = useToast();

  const [payments, setPayments] = useState([]);
  const [revenue, setRevenue] = useState(0);
  const [balance, setBalance] = useState({ available: [], pending: [] });
  const [filters, setFilters] = useState({ transactionCode: "", status: "all", method: "all" });
  const [appliedFilters, setAppliedFilters] = useState(filters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingCode, setUpdatingCode] = useState("");
  const [stripeLoading, setStripeLoading] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const params = {
        transactionCode: appliedFilters.transactionCode.trim() || undefined,
        status: appliedFilters.status !== "all" ? appliedFilters.status : undefined,
        method: appliedFilters.method !== "all" ? appliedFilters.method : undefined,
        limit: 100,
      };
      Object.keys(params).forEach((key) => params[key] === undefined && delete params[key]);

      const [paymentsRes, revenueRes, balanceRes] = await Promise.allSettled([
        getPayments(params),
        getRevenue(),
        getStripeBalance(),
      ]);

      if (paymentsRes.status === "fulfilled") {
        setPayments(Array.isArray(paymentsRes.value.data?.payments) ? paymentsRes.value.data.payments : []);
      } else {
        throw paymentsRes.reason;
      }

      setRevenue(revenueRes.status === "fulfilled" ? Number(revenueRes.value.data?.total || 0) : 0);
      setBalance(
        balanceRes.status === "fulfilled"
          ? {
              available: Array.isArray(balanceRes.value.data?.available) ? balanceRes.value.data.available : [],
              pending: Array.isArray(balanceRes.value.data?.pending) ? balanceRes.value.data.pending : [],
            }
          : { available: [], pending: [] }
      );
    } catch (err) {
      console.error("Lỗi tải thanh toán:", err);
      setError(err.response?.data?.message || "Không thể tải dữ liệu thanh toán.");
    } finally {
      setLoading(false);
    }
  }, [appliedFilters]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const stats = useMemo(() => [
    { icon: "payments", label: "Tổng doanh thu", value: formatCurrency(revenue), tone: "primary" },
    { icon: "receipt_long", label: "Giao dịch", value: payments.length, tone: "slate" },
    { icon: "check_circle", label: "Thành công", value: payments.filter((payment) => payment.status === "success").length, tone: "emerald" },
    { icon: "pending_actions", label: "Đang chờ", value: payments.filter((payment) => payment.status === "pending").length, tone: "amber" },
  ], [payments, revenue]);

  const handleFilterChange = (field, value) => {
    setFilters((current) => ({ ...current, [field]: value }));
  };

  const handleApplyFilters = () => {
    setAppliedFilters(filters);
  };

  const handleResetFilters = () => {
    const nextFilters = { transactionCode: "", status: "all", method: "all" };
    setFilters(nextFilters);
    setAppliedFilters(nextFilters);
  };

  const handleUpdatePayment = async (code) => {
    if (!code) {
      addToast("Không có mã giao dịch để cập nhật", "error");
      return;
    }

    try {
      setUpdatingCode(code);
      await updatePayment(code);
      addToast("Cập nhật thanh toán thành công", "success");
      fetchPayments();
    } catch (err) {
      console.error("Lỗi cập nhật thanh toán:", err);
      addToast(err.response?.data?.message || "Cập nhật thanh toán thất bại", "error");
    } finally {
      setUpdatingCode("");
    }
  };

  const handleCreateStripeAccount = async () => {
    try {
      setStripeLoading(true);
      const response = await createStripeAccount();
      const url = response.data?.url;
      addToast(response.data?.message || "Đã tạo phiên liên kết Stripe", "success");
      if (url) {
        window.location.assign(url);
      }
    } catch (err) {
      console.error("Lỗi tạo tài khoản Stripe:", err);
      addToast(err.response?.data?.message || "Không thể tạo tài khoản Stripe", "error");
    } finally {
      setStripeLoading(false);
    }
  };

  const handleWithdraw = async () => {
    const amount = Number(withdrawAmount);
    if (!amount || amount <= 0) {
      addToast("Số tiền rút không hợp lệ", "error");
      return;
    }

    try {
      setStripeLoading(true);
      const response = await withdrawStripeBalance({ amount });
      addToast(response.data?.message || "Tạo yêu cầu rút tiền thành công", "success");
      setShowWithdrawModal(false);
      setWithdrawAmount("");
      fetchPayments();
    } catch (err) {
      console.error("Lỗi rút tiền Stripe:", err);
      addToast(err.response?.data?.message || "Rút tiền thất bại", "error");
    } finally {
      setStripeLoading(false);
    }
  };

  return (
    <CompanyPageShell
      eyebrow="Payments"
      title="Thanh toán và doanh thu"
      description="Theo dõi giao dịch, cập nhật thanh toán và quản lý số dư Stripe của công ty."
      actions={
        <div className="flex gap-2">
          <IconButton icon="account_balance_wallet" label="Liên kết Stripe" variant="primary" onClick={handleCreateStripeAccount} disabled={stripeLoading} />
          <IconButton icon="payments" label="Rút tiền" variant="success" onClick={() => setShowWithdrawModal(true)} disabled={stripeLoading} />
        </div>
      }
    >
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-outline-variant/30 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-extrabold text-on-surface">Số dư khả dụng</h2>
              <p className="mt-1 text-sm text-on-surface-variant">Nguồn tiền có thể xử lý qua Stripe.</p>
            </div>
            <span className="material-symbols-outlined text-primary">account_balance_wallet</span>
          </div>
          <BalanceList items={balance.available} emptyLabel="Chưa có số dư khả dụng" />
        </section>

        <section className="rounded-xl border border-outline-variant/30 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-extrabold text-on-surface">Số dư đang chờ</h2>
              <p className="mt-1 text-sm text-on-surface-variant">Khoản tiền đang được Stripe xử lý.</p>
            </div>
            <span className="material-symbols-outlined text-amber-600">hourglass_top</span>
          </div>
          <BalanceList items={balance.pending} emptyLabel="Không có số dư đang chờ" />
        </section>
      </div>

      <ToolbarCard>
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1fr_180px_180px_auto_auto]">
          <SearchInput
            value={filters.transactionCode}
            onChange={(e) => handleFilterChange("transactionCode", e.target.value)}
            placeholder="Tìm theo mã giao dịch"
          />
          <SelectControl value={filters.status} onChange={(e) => handleFilterChange("status", e.target.value)}>
            <option value="all">Tất cả trạng thái</option>
            <option value="pending">Đang chờ</option>
            <option value="success">Thành công</option>
            <option value="failed">Thất bại</option>
            <option value="refunded">Đã hoàn tiền</option>
          </SelectControl>
          <SelectControl value={filters.method} onChange={(e) => handleFilterChange("method", e.target.value)}>
            <option value="all">Tất cả phương thức</option>
            <option value="vnpay">VNPay</option>
            <option value="cash">Tiền mặt</option>
            <option value="stripe">Stripe</option>
          </SelectControl>
          <PrimaryButton icon="search" onClick={handleApplyFilters}>Tìm</PrimaryButton>
          <SecondaryButton icon="refresh" onClick={handleResetFilters}>Đặt lại</SecondaryButton>
        </div>
      </ToolbarCard>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} />
      ) : payments.length === 0 ? (
        <EmptyState icon="receipt_long" title="Chưa có giao dịch" description="Thử đổi bộ lọc hoặc kiểm tra lại sau." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-outline-variant/30 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1040px] text-sm">
              <thead className="bg-surface-container-low">
                <tr>
                  <th className="px-5 py-3 text-left font-bold text-on-surface-variant">Mã giao dịch</th>
                  <th className="px-5 py-3 text-left font-bold text-on-surface-variant">Booking</th>
                  <th className="px-5 py-3 text-left font-bold text-on-surface-variant">Khách hàng</th>
                  <th className="px-5 py-3 text-left font-bold text-on-surface-variant">Phương thức</th>
                  <th className="px-5 py-3 text-left font-bold text-on-surface-variant">Trạng thái</th>
                  <th className="px-5 py-3 text-right font-bold text-on-surface-variant">Số tiền</th>
                  <th className="px-5 py-3 text-left font-bold text-on-surface-variant">Thời gian</th>
                  <th className="px-5 py-3 text-right font-bold text-on-surface-variant">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/15">
                {payments.map((payment) => (
                  <tr key={payment.id || payment.transactionCode} className="hover:bg-surface-container-low/70">
                    <td className="px-5 py-4">
                      <p className="font-bold text-on-surface">{payment.transactionCode || "—"}</p>
                      <p className="mt-1 text-xs text-on-surface-variant">ID: {payment.id || "—"}</p>
                    </td>
                    <td className="px-5 py-4 text-on-surface-variant">#{payment.bookingId || "—"}</td>
                    <td className="px-5 py-4 text-on-surface-variant">{payment.phone || "—"}</td>
                    <td className="px-5 py-4 font-medium text-on-surface">{methodLabel[payment.method] || payment.method || "—"}</td>
                    <td className="px-5 py-4">
                      <StatusBadge tone={paymentStatusTone[payment.status] || "slate"}>
                        {paymentStatusLabel[payment.status] || payment.status || "—"}
                      </StatusBadge>
                    </td>
                    <td className="px-5 py-4 text-right font-extrabold text-on-surface">{formatCurrency(payment.amount)}</td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-on-surface">{formatDateTime(payment.paidAt)}</p>
                      {payment.expiredAt && (
                        <p className="mt-1 text-xs text-on-surface-variant">Hết hạn: {formatDateTime(payment.expiredAt)}</p>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end">
                        <IconButton
                          icon={updatingCode === payment.transactionCode ? "progress_activity" : "sync"}
                          label="Cập nhật thanh toán"
                          variant="primary"
                          onClick={() => handleUpdatePayment(payment.transactionCode)}
                          disabled={!payment.transactionCode || updatingCode === payment.transactionCode}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showWithdrawModal && (
        <ModalShell
          title="Rút tiền Stripe"
          subtitle="Nhập số tiền VND muốn rút khỏi số dư Stripe."
          onClose={() => setShowWithdrawModal(false)}
          footer={
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <SecondaryButton onClick={() => setShowWithdrawModal(false)} disabled={stripeLoading}>Hủy</SecondaryButton>
              <PrimaryButton icon="payments" onClick={handleWithdraw} disabled={stripeLoading}>
                {stripeLoading ? "Đang xử lý..." : "Rút tiền"}
              </PrimaryButton>
            </div>
          }
        >
          <Field label="Số tiền cần rút">
            <input
              type="number"
              min="1"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              className={inputClass}
              placeholder="500000"
            />
          </Field>
        </ModalShell>
      )}
    </CompanyPageShell>
  );
}

function BalanceList({ items, emptyLabel }) {
  if (!items?.length) {
    return (
      <div className="rounded-lg border border-dashed border-outline-variant/60 p-4 text-sm font-medium text-on-surface-variant">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={`${item.currency}-${index}`} className="flex items-center justify-between rounded-lg bg-surface-container-low p-4">
          <span className="text-sm font-medium text-on-surface-variant">{String(item.currency || "").toUpperCase()}</span>
          <span className="font-extrabold text-on-surface">{formatStripeAmount(item)}</span>
        </div>
      ))}
    </div>
  );
}
