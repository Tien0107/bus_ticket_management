import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  createStripeAccount,
  getPayments,
  getRevenue,
  getStripeBalance,
  getStripeConnectStatus,
  updatePayment,
  withdrawStripeBalance,
} from "../../api/company";
import axiosClient from "../../api/axiosClient";
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
import {
  getStoredToken,
  getStoredUser as getAuthStoredUser,
  setStoredToken,
  setStoredUser,
} from "../../utils/authStorage";

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

const STRIPE_CONNECT_STARTED_KEY = "busgoStripeConnectStarted";
const USD_TO_VND_RATE = 25000;
const WITHDRAW_AMOUNT_SUGGESTIONS = [500000, 1000000, 2000000, 5000000];

const getStoredUser = () => {
  return getAuthStoredUser();
};

const getTokenPayload = () => {
  try {
    const token = getStoredToken();
    const payload = token?.split(".")[1];
    if (!payload) return {};

    const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/");
    const paddedPayload = normalizedPayload.padEnd(
      normalizedPayload.length + ((4 - (normalizedPayload.length % 4)) % 4),
      "="
    );

    return JSON.parse(window.atob(paddedPayload));
  } catch {
    return {};
  }
};

const getStoredStripeAccountId = () => {
  const user = getStoredUser();
  const tokenPayload = getTokenPayload();
  return String(
    user.accountStripeId ||
      user.account_stripe_id ||
      user.stripeAccountId ||
      user.stripe_account_id ||
      tokenPayload.accountStripeId ||
      tokenPayload.account_stripe_id ||
      tokenPayload.stripeAccountId ||
      tokenPayload.stripe_account_id ||
      ""
  ).trim();
};

const hasKnownStripeAccount = () =>
  Boolean(getStoredStripeAccountId()) || sessionStorage.getItem(STRIPE_CONNECT_STARTED_KEY) === "true";

const rememberStripeAccount = (accountId) => {
  sessionStorage.setItem(STRIPE_CONNECT_STARTED_KEY, "true");

  if (!accountId) return;

  const user = getStoredUser();
  setStoredUser({
    ...user,
    accountStripeId: accountId,
  });
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

const getStripeAmountInVnd = ({ amount, currency }) => {
  const code = String(currency || "").toUpperCase();
  const numericAmount = Number(amount || 0);

  if (code === "VND") return numericAmount;
  if (code === "USD") return (numericAmount / 100) * USD_TO_VND_RATE;

  return numericAmount;
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
  const [stripeStatus, setStripeStatus] = useState(null);
  const [stripeStatusError, setStripeStatusError] = useState("");
  const [stripeAccountReady, setStripeAccountReady] = useState(hasKnownStripeAccount);
  const [updatingCode, setUpdatingCode] = useState("");
  const [stripeLoading, setStripeLoading] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [nextCursor, setNextCursor] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const availableVnd = useMemo(() => {
    return (balance.available || []).reduce((sum, item) => {
      return sum + getStripeAmountInVnd(item);
    }, 0);
  }, [balance.available]);
  const pendingVnd = useMemo(() => {
    return (balance.pending || []).reduce((sum, item) => {
      return sum + getStripeAmountInVnd(item);
    }, 0);
  }, [balance.pending]);

  const fetchPayments = useCallback(async ({ append = false, cursor = null } = {}) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError("");

      const params = {
        transactionCode: appliedFilters.transactionCode.trim() || undefined,
        status: appliedFilters.status !== "all" ? appliedFilters.status : undefined,
        method: appliedFilters.method !== "all" ? appliedFilters.method : undefined,
        limit: 10,
      };

      if (append && cursor) {
        params.next = cursor;
      }

      Object.keys(params).forEach((key) => params[key] === undefined && delete params[key]);

      const canCheckStripe = stripeAccountReady;
      const [paymentsRes, revenueRes, balanceRes, stripeStatusRes] = await Promise.allSettled([
        getPayments(params),
        getRevenue(),
        canCheckStripe ? getStripeBalance() : Promise.resolve({ data: { available: [], pending: [] } }),
        canCheckStripe ? getStripeConnectStatus() : Promise.resolve({ data: null }),
      ]);

      if (paymentsRes.status === "fulfilled") {
        const newPayments = Array.isArray(paymentsRes.value.data?.payments) ? paymentsRes.value.data.payments : [];
        const responseNext = paymentsRes.value.data?.next || null;

        if (append) {
          setPayments((prev) => [...prev, ...newPayments]);
        } else {
          setPayments(newPayments);
        }

        setNextCursor(responseNext);
      } else {
        throw paymentsRes.reason;
      }

      // Only update revenue and balance on initial load (not on append)
      if (!append) {
        setRevenue(revenueRes.status === "fulfilled" ? Number(revenueRes.value.data?.total || 0) : 0);
        setBalance(
          balanceRes.status === "fulfilled"
            ? {
                available: Array.isArray(balanceRes.value.data?.available) ? balanceRes.value.data.available : [],
                pending: Array.isArray(balanceRes.value.data?.pending) ? balanceRes.value.data.pending : [],
              }
            : { available: [], pending: [] }
        );

        if (!canCheckStripe) {
          setStripeStatus(null);
          setStripeStatusError("");
        } else if (
          stripeStatusRes.status === "fulfilled" &&
          stripeStatusRes.value.status >= 200 &&
          stripeStatusRes.value.status < 300
        ) {
          setStripeStatus({
            chargesEnabled: Boolean(stripeStatusRes.value.data?.chargesEnabled),
            payoutsEnabled: Boolean(stripeStatusRes.value.data?.payoutsEnabled),
            currentlyDue: Array.isArray(stripeStatusRes.value.data?.currentlyDue)
              ? stripeStatusRes.value.data.currentlyDue
              : [],
          });
          setStripeStatusError("");
        } else if (stripeStatusRes.status === "fulfilled") {
          setStripeStatus(null);
          setStripeStatusError(
            stripeStatusRes.value.data?.message || "Không thể tải trạng thái Stripe Connect."
          );
        } else {
          setStripeStatus(null);
          setStripeStatusError(
            stripeStatusRes.reason?.response?.data?.message || "Không thể tải trạng thái Stripe Connect."
          );
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || "Không thể tải dữ liệu thanh toán.");
    } finally {
      if (append) {
        setLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  }, [appliedFilters, stripeAccountReady]);

  useEffect(() => {
    setNextCursor(null);
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
    setNextCursor(null);
    setAppliedFilters(filters);
  };

  const handleResetFilters = () => {
    const nextFilters = { transactionCode: "", status: "all", method: "all" };
    setFilters(nextFilters);
    setAppliedFilters(nextFilters);
    setNextCursor(null);
  };

  const handleLoadMore = () => {
    if (nextCursor) {
      fetchPayments({ append: true, cursor: nextCursor });
    }
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
      addToast(err.response?.data?.message || "Cập nhật thanh toán thất bại", "error");
    } finally {
      setUpdatingCode("");
    }
  };

  const handleCreateStripeAccount = async () => {
    try {
      setStripeLoading(true);
      const response = await createStripeAccount();
      const data = response.data || {};
      const url = data.url;
      const nextToken = data.token;
      if (nextToken) {
        setStoredToken(nextToken);
        axiosClient.defaults.headers.common.Authorization = `Bearer ${nextToken}`;
      }
      rememberStripeAccount(data.accountStripeId || data.stripeAccountId);
      if (data.user) {
        setStoredUser(data.user);
      }
      setStripeAccountReady(true);
      addToast(data.message || "Đã tạo phiên liên kết Stripe", "success");
      if (url) {
        window.location.assign(url);
      }
    } catch (err) {
      addToast(err.response?.data?.message || "Không thể tạo tài khoản Stripe", "error");
    } finally {
      setStripeLoading(false);
    }
  };

  const handleWithdraw = async () => {
    const amount = Number(withdrawAmount);
    if (!stripeAccountReady) {
      addToast("Vui lòng liên kết Stripe trước khi rút tiền", "error");
      return;
    }

    if (!amount || amount < 500000) {
      addToast("Số tiền rút tối thiểu là 500.000 VND", "error");
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
          <IconButton icon="payments" label="Rút tiền" variant="success" onClick={() => setShowWithdrawModal(true)} disabled={stripeLoading || !stripeAccountReady} />
        </div>
      }
    >
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <StripeConnectPanel
        status={stripeStatus}
        error={stripeStatusError}
        loading={loading && !stripeStatus && !stripeStatusError}
        onConnect={handleCreateStripeAccount}
        stripeLoading={stripeLoading}
      />

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-outline-variant/30 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-extrabold text-on-surface">Số dư khả dụng</h2>
              <p className="mt-1 text-sm text-on-surface-variant">Số tiền có thể rút (đã quy đổi sang VND).</p>
            </div>
            <span className="material-symbols-outlined text-primary">account_balance_wallet</span>
          </div>

          <BalanceSummary
            amount={availableVnd}
            label="Số dư khả dụng"
            emptyLabel="Chưa có số dư khả dụng"
            tone="emerald"
          />
        </section>

        <section className="rounded-xl border border-outline-variant/30 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-extrabold text-on-surface">Số dư đang chờ</h2>
              <p className="mt-1 text-sm text-on-surface-variant">Khoản tiền đang được Stripe xử lý.</p>
            </div>
            <span className="material-symbols-outlined text-amber-600">hourglass_top</span>
          </div>
          <BalanceSummary
            amount={pendingVnd}
            label="Số dư đang chờ"
            emptyLabel="Không có số dư đang chờ"
            tone="amber"
          />
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
                  <th className="px-4 py-2.5 text-left font-bold text-on-surface-variant">Mã giao dịch</th>
                  <th className="px-4 py-2.5 text-left font-bold text-on-surface-variant">Khách hàng</th>
                  <th className="px-4 py-2.5 text-left font-bold text-on-surface-variant">Phương thức</th>
                  <th className="px-4 py-2.5 text-left font-bold text-on-surface-variant">Trạng thái</th>
                  <th className="px-4 py-2.5 text-right font-bold text-on-surface-variant">Số tiền</th>
                  <th className="px-4 py-2.5 text-left font-bold text-on-surface-variant">Thời gian</th>
                  <th className="px-4 py-2.5 text-right font-bold text-on-surface-variant">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/15">
                {payments.map((payment) => (
                  <tr key={payment.id || payment.transactionCode} className="hover:bg-surface-container-low/70">
                    <td className="px-4 py-2.5">
                      <p className="font-bold text-on-surface">{payment.transactionCode || "—"}</p>
                    </td>
                    <td className="px-4 py-2.5 text-on-surface-variant">{payment.phone || "—"}</td>
                    <td className="px-4 py-2.5 font-medium text-on-surface">{methodLabel[payment.method] || payment.method || "—"}</td>
                    <td className="px-4 py-2.5">
                      <StatusBadge tone={paymentStatusTone[payment.status] || "slate"}>
                        {paymentStatusLabel[payment.status] || payment.status || "—"}
                      </StatusBadge>
                    </td>
                    <td className="px-4 py-2.5 text-right font-extrabold text-on-surface">{formatCurrency(payment.amount)}</td>
                    <td className="px-4 py-2.5">
                      <p className="font-medium text-on-surface">{formatDateTime(payment.paidAt)}</p>
                      {payment.expiredAt && (
                        <p className="mt-1 text-xs text-on-surface-variant">Hết hạn: {formatDateTime(payment.expiredAt)}</p>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
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

          {nextCursor && (
            <div className="flex justify-center border-t border-outline-variant/30 bg-white px-4 py-2.5">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="inline-flex items-center gap-2 rounded-lg border border-outline-variant/60 bg-white px-5 py-2 text-sm font-bold text-on-surface transition-colors hover:bg-surface-container-low disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loadingMore ? "Đang tải thêm..." : "Tải thêm"}
              </button>
            </div>
          )}
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
              min="500000"
              step="1000"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              className={inputClass}
              placeholder="500000"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              {WITHDRAW_AMOUNT_SUGGESTIONS.map((amount) => {
                const active = Number(withdrawAmount) === amount;

                return (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => setWithdrawAmount(String(amount))}
                    disabled={stripeLoading}
                    className={`rounded-lg border px-3 py-2 text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                      active
                        ? "border-primary bg-primary text-white"
                        : "border-outline-variant/50 bg-white text-on-surface hover:border-primary hover:bg-primary/5 hover:text-primary"
                    }`}
                  >
                    {formatCurrency(amount)}
                  </button>
                );
              })}
            </div>
          </Field>
        </ModalShell>
      )}
    </CompanyPageShell>
  );
}

function StripeConnectPanel({ status, error, loading, onConnect, stripeLoading }) {
  const currentlyDue = Array.isArray(status?.currentlyDue) ? status.currentlyDue : [];
  const chargesEnabled = Boolean(status?.chargesEnabled);
  const payoutsEnabled = Boolean(status?.payoutsEnabled);
  const ready = chargesEnabled && payoutsEnabled;
  const needsInfo = Boolean(status) && (!ready || currentlyDue.length > 0);

  const badgeTone = loading ? "slate" : error ? "red" : ready ? "emerald" : needsInfo ? "amber" : "slate";
  const badgeLabel = loading
    ? "Đang kiểm tra"
    : error
    ? "Không tải được"
    : ready
    ? "Đã sẵn sàng"
    : needsInfo
    ? "Cần cập nhật"
    : "Chưa liên kết";
  const actionLabel = stripeLoading
    ? "Đang xử lý..."
    : ready
    ? "Đã liên kết Stripe"
    : status
    ? "Hoàn tất Stripe"
    : "Liên kết Stripe";

  return (
    <section className="mb-6 rounded-xl border border-outline-variant/30 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex gap-4">
          <span
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${
              ready ? "bg-emerald-50 text-emerald-700" : "bg-primary/10 text-primary"
            }`}
          >
            <span className="material-symbols-outlined text-[26px]">account_balance_wallet</span>
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-xl font-extrabold text-on-surface">Stripe Connect</h2>
              <StatusBadge tone={badgeTone}>{badgeLabel}</StatusBadge>
            </div>
            <p className="mt-1 text-sm leading-6 text-on-surface-variant">
              Kiểm tra khả năng nhận thanh toán và rút tiền của tài khoản Stripe công ty.
            </p>
          </div>
        </div>

        {ready ? (
          <button
            type="button"
            disabled
            className="inline-flex cursor-not-allowed items-center justify-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50/60 px-4 py-3 text-sm font-bold text-emerald-700/70 shadow-none"
          >
            <span className="material-symbols-outlined text-[20px]">check_circle</span>
            {actionLabel}
          </button>
        ) : (
          <PrimaryButton icon="account_balance_wallet" onClick={onConnect} disabled={stripeLoading || loading}>
            {actionLabel}
          </PrimaryButton>
        )}
      </div>

      <div className="mt-5">
        {loading ? (
          <div className="flex items-center gap-3 rounded-lg bg-surface-container-low p-4 text-sm font-medium text-on-surface-variant">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
            Đang tải trạng thái Stripe Connect...
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            {error}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            <StripeStatusItem
              icon="credit_card"
              label="Nhận thanh toán"
              enabled={chargesEnabled}
              enabledText="Đã bật"
              disabledText="Chưa bật"
            />
            <StripeStatusItem
              icon="account_balance"
              label="Rút tiền"
              enabled={payoutsEnabled}
              enabledText="Đã bật"
              disabledText="Chưa bật"
            />
            <div className="rounded-lg bg-surface-container-low p-4">
              <div className="flex items-center gap-2 text-sm font-bold text-on-surface">
                <span className="material-symbols-outlined text-[20px] text-amber-600">assignment_late</span>
                Thông tin cần bổ sung
              </div>
              <p className="mt-2 text-2xl font-extrabold text-on-surface">{currentlyDue.length}</p>
              <p className="mt-1 text-xs font-medium text-on-surface-variant">
                {currentlyDue.length ? "Stripe đang yêu cầu thêm thông tin." : "Không có yêu cầu bổ sung."}
              </p>
            </div>
          </div>
        )}
      </div>

      {!loading && !error && currentlyDue.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {currentlyDue.slice(0, 8).map((item, index) => (
            <span
              key={`${item}-${index}`}
              className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 ring-1 ring-amber-100"
            >
              {item}
            </span>
          ))}
          {currentlyDue.length > 8 && (
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
              +{currentlyDue.length - 8}
            </span>
          )}
        </div>
      )}
    </section>
  );
}

function StripeStatusItem({ icon, label, enabled, enabledText, disabledText }) {
  return (
    <div className="rounded-lg bg-surface-container-low p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-bold text-on-surface">
          <span className="material-symbols-outlined text-[20px] text-primary">{icon}</span>
          {label}
        </div>
        <StatusBadge tone={enabled ? "emerald" : "amber"}>{enabled ? enabledText : disabledText}</StatusBadge>
      </div>
    </div>
  );
}

function BalanceSummary({ amount, label, emptyLabel, tone = "emerald" }) {
  const hasAmount = Number(amount || 0) > 0;
  const toneClass =
    tone === "amber"
      ? "bg-amber-50 text-amber-800 ring-amber-100"
      : "bg-emerald-50 text-emerald-800 ring-emerald-100";
  const labelClass = tone === "amber" ? "text-amber-700" : "text-emerald-700";

  if (!hasAmount) {
    return (
      <div className="flex min-h-[112px] items-center rounded-lg border border-dashed border-outline-variant/60 p-5 text-sm font-medium text-on-surface-variant">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className={`flex min-h-[112px] flex-col justify-center rounded-lg p-5 ring-1 ${toneClass}`}>
      <div className={`text-sm font-medium ${labelClass}`}>{label}</div>
      <div className="mt-1 text-3xl font-extrabold">
        {new Intl.NumberFormat("vi-VN").format(amount)} <span className="text-xl">VND</span>
      </div>
    </div>
  );
}
