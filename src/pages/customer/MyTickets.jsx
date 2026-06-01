import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import CustomerProfileNav from "../../components/profile/CustomerProfileNav";
import CustomerProfileSectionHeader from "../../components/profile/CustomerProfileSectionHeader";
import ConfirmModal from "../../components/common/ConfirmModal";
import SelectPaymentCardModal from "../../components/payment/SelectPaymentCardModal";
import ReviewTripModal from "../../components/reviews/ReviewTripModal";
import { useToast } from "../../context/ToastContext";
import { createNotification } from "../../api/notification";
import {
  cancelCustomerTicket,
  createPaymentMethod,
  getCustomerTicketDetail,
  getCustomerTickets,
  getPaymentMethods,
  setDefaultPaymentMethod,
} from "../../api/customer";

const LIMIT = 10;
const stripePublishableKey = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || "";
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;

const INITIAL_FILTERS = {
  type: "",
  status: "",
};

const BOOKING_TYPE_OPTIONS = [
  { value: "", label: "Tất cả" },
  { value: "one_way", label: "Một chiều" },
  { value: "round_trip", label: "Khứ hồi" },
];

const TICKET_STATUS_OPTIONS = [
  { value: "", label: "Tất cả" },
  { value: "reserved", label: "Đã giữ chỗ" },
  { value: "paid", label: "Đã thanh toán" },
  { value: "cancelled", label: "Đã hủy" },
  { value: "checked_in", label: "Đã lên xe" },
];

const bookingTypeLabels = {
  one_way: "Một chiều",
  round_trip: "Khứ hồi",
};

const tripStatusLabels = {
  scheduled: "Sắp chạy",
  running: "Đang chạy",
  completed: "Hoàn thành",
  cancelled: "Đã hủy",
};

const statusLabels = {
  reserved: "Đã giữ chỗ",
  pending: "Chờ thanh toán",
  paid: "Đã thanh toán",
  cancelled: "Đã hủy",
  checked_in: "Đã lên xe",
  expired: "Hết hạn",
};

const statusBadgeClasses = {
  reserved: "bg-secondary/10 text-secondary ring-1 ring-secondary/20",
  pending: "bg-secondary/10 text-secondary ring-1 ring-secondary/20",
  paid: "bg-primary/10 text-primary ring-1 ring-primary/20",
  checked_in: "bg-primary/10 text-primary ring-1 ring-primary/20",
  cancelled: "bg-error-container text-error ring-1 ring-error/20",
  expired: "bg-surface-container-high text-on-surface-variant ring-1 ring-outline-variant/60",
};

const moneyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
});

const dateTimeFormatter = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const normalizeStatus = (status) => String(status || "").toLowerCase();

const getTicketCode = (ticket) => ticket?.code || `#${ticket?.id ?? ""}`;

const formatMoney = (value) => {
  if (typeof value !== "number") return "Chưa có";
  return moneyFormatter.format(value);
};

const formatDateTime = (value) => {
  if (!value) return "Chưa có";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Chưa có";
  return dateTimeFormatter.format(date);
};

const getStatusLabel = (status) => statusLabels[normalizeStatus(status)] || status || "Không rõ";

const getStatusBadgeClass = (status) =>
  statusBadgeClasses[normalizeStatus(status)] || "bg-surface-container-high text-on-surface-variant ring-1 ring-outline-variant";

const getErrorMessage = (error, fallback) => {
  const status = error?.response?.status;
  const issues = error?.response?.data?.issues;
  const issueMessage = Array.isArray(issues)
    ? issues
        .map((issue) => issue?.reason || issue?.message || issue?.field)
        .filter(Boolean)
        .join(" ")
    : "";
  const backendMessage = error?.response?.data?.message || error?.response?.data?.error || issueMessage;

  if (status === 401) {
    return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
  }

  if (status === 403) {
    return backendMessage || "Bạn không có quyền thực hiện thao tác này hoặc vé không hợp lệ để hủy.";
  }

  if (error instanceof TypeError && String(error.message || "").includes("fetch")) {
    return "Không kết nối được backend. Vui lòng kiểm tra server API và cấu hình REACT_APP_API_BASE_URL.";
  }

  return backendMessage || error?.message || fallback;
};

const canCancelTicket = (ticket) => {
  const status = normalizeStatus(ticket?.status);
  return ticket?.id && !["cancelled", "expired"].includes(status);
};

const isFutureDate = (value, nowMs = Date.now()) => {
  if (!value) return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date.getTime() > nowMs;
};

const canPayPendingTicket = (ticket, nowMs = Date.now()) =>
  normalizeStatus(ticket?.status) === "pending" && isFutureDate(ticket?.expiredAt, nowMs);

const canReviewTicket = (ticket) => String(ticket?.tripStatus || "").toLowerCase() === "completed";

const getPaymentOrderId = (ticket) => ticket?.bookingId || ticket?.id;

const getPaymentMethodIdentifier = (method) => method?.stripePaymentMethodId || method?.id;

const buildReviewTicket = (ticket) => ({
  ...ticket,
  ticketId: ticket?.id,
  departureLocation: ticket?.fromLocation || ticket?.departureLocation || "Điểm đi",
  arrivalLocation: ticket?.toLocation || ticket?.arrivalLocation || "Điểm đến",
});

function DetailRow({ label, value }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">{label}</dt>
      <dd className="mt-1 break-words text-sm font-bold text-on-surface">{value || "Chưa có"}</dd>
    </div>
  );
}

export default function MyTickets() {
  const navigate = useNavigate();
  const location = useLocation();
  const { addToast } = useToast();
  const [tickets, setTickets] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [appliedFilters, setAppliedFilters] = useState(INITIAL_FILTERS);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailTicket, setDetailTicket] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [paymentLoadingKey, setPaymentLoadingKey] = useState("");
  const [paymentTicket, setPaymentTicket] = useState(null);
  const [showCardModal, setShowCardModal] = useState(false);
  const [cards, setCards] = useState([]);
  const [loadingCards, setLoadingCards] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [processingCardPayment, setProcessingCardPayment] = useState(false);
  const [reviewTicket, setReviewTicket] = useState(null);
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  const activeFilterCount = useMemo(
    () => [appliedFilters.type, appliedFilters.status].filter(Boolean).length,
    [appliedFilters],
  );

  const fetchTickets = useCallback(async ({ append = false, cursor = null, filters = appliedFilters } = {}) => {
    const token = localStorage.getItem("token")?.trim();

    if (!token) {
      setTickets([]);
      setNextCursor(null);
      setError("Vui lòng đăng nhập bằng tài khoản customer để xem danh sách vé.");
      return;
    }

    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError("");

      const params = {
        limit: LIMIT,
      };
      if (append && cursor !== null && cursor !== undefined) params.next = cursor;
      if (filters.type) params.type = filters.type;
      if (filters.status) params.status = filters.status;

      const response = await getCustomerTickets(params);

      const payload = response.data?.data || response.data || {};
      const incomingTickets = Array.isArray(payload.tickets) ? payload.tickets : [];
      setTickets((currentTickets) => (append ? [...currentTickets, ...incomingTickets] : incomingTickets));
      setNextCursor(payload.next ?? null);
    } catch (err) {
      setError(getErrorMessage(err, "Không thể tải danh sách vé. Vui lòng thử lại."));
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [appliedFilters]);

  useEffect(() => {
    fetchTickets({ filters: appliedFilters });
  }, [appliedFilters, fetchTickets]);

  // Extra background refresh when navigating back from payment flows (Stripe/VNPay)
  // This helps when webhook is still processing (common with Stripe card payments)
  useEffect(() => {
    if (location.state?.refreshTickets) {
      // Do additional refreshes at strategic times to catch webhook updates
      const t1 = setTimeout(() => {
        fetchTickets({ filters: appliedFilters });
      }, 2800);
      const t2 = setTimeout(() => {
        fetchTickets({ filters: appliedFilters });
      }, 6500);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [location.state?.refreshTickets]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFilterChange = (field, value) => {
    const nextFilters = {
      ...appliedFilters,
      [field]: value,
    };

    setTickets([]);
    setNextCursor(null);

    if (nextFilters.type === appliedFilters.type && nextFilters.status === appliedFilters.status) {
      fetchTickets({ filters: nextFilters });
      return;
    }

    setAppliedFilters(nextFilters);
  };

  const handleLoadMore = () => {
    if (nextCursor == null || loadingMore) return;
    fetchTickets({
      append: true,
      cursor: nextCursor,
      filters: appliedFilters,
    });
  };

  const handleOpenDetail = async (ticket) => {
    const token = localStorage.getItem("token")?.trim();
    setDetailOpen(true);
    setDetailTicket(null);
    setDetailError("");

    if (!token) {
      setDetailError("Vui lòng đăng nhập bằng tài khoản customer để xem chi tiết vé.");
      return;
    }

    try {
      setDetailLoading(true);
      const response = await getCustomerTicketDetail(ticket.id);
      const payload = response.data?.data || response.data || {};
      setDetailTicket({
        ...ticket,
        ...(payload.ticket || payload || {}),
      });
    } catch (err) {
      const message = getErrorMessage(err, "Không thể tải chi tiết vé. Vui lòng thử lại.");
      setDetailError(message);
      addToast(message, "error");
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    if (detailLoading) return;
    setDetailOpen(false);
    setDetailTicket(null);
    setDetailError("");
  };

  const handleOpenReview = (ticket) => {
    setDetailOpen(false);
    setDetailTicket(null);
    setReviewTicket(buildReviewTicket(ticket));
  };

  const mergeCancelledTickets = (updatedTickets = []) => {
    if (!updatedTickets.length) return;

    const updatedStatusById = new Map(updatedTickets.map((ticket) => [Number(ticket.id), ticket.status]));
    const applyUpdate = (ticket) => {
      const updatedStatus = updatedStatusById.get(Number(ticket?.id));
      return updatedStatus ? { ...ticket, status: updatedStatus } : ticket;
    };

    setTickets((currentTickets) => currentTickets.map(applyUpdate));
    setDetailTicket((currentTicket) => (currentTicket ? applyUpdate(currentTicket) : currentTicket));
  };

  const handleConfirmCancel = async () => {
    const token = localStorage.getItem("token")?.trim();

    if (!cancelTarget?.id || cancelLoading) return;

    if (!token) {
      addToast("Vui lòng đăng nhập bằng tài khoản customer để hủy vé.", "error");
      setCancelTarget(null);
      return;
    }

    try {
      setCancelLoading(true);
      const response = await cancelCustomerTicket(cancelTarget.id);
      const payload = response.data?.data || response.data || {};
      mergeCancelledTickets(payload.tickets || []);
      addToast(payload.message || "Hủy vé thành công.", "success");
      setCancelTarget(null);
      await fetchTickets({ filters: appliedFilters });
    } catch (err) {
      const message = getErrorMessage(err, "Hủy vé thất bại. Vui lòng thử lại.");
      addToast(message, "error");
    } finally {
      setCancelLoading(false);
    }
  };

  const createPaymentNotification = async (ticket, method) => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) return;
      const currentUser = JSON.parse(userStr);
      if (!currentUser?.id) return;

      await createNotification({
        userId: currentUser.id,
        title: method === "cash" ? "Giữ chỗ thành công (Tiền mặt)" : "Thanh toán thành công!",
        body:
          method === "cash"
            ? `Đơn giữ chỗ #${getPaymentOrderId(ticket) || ""} đã được ghi nhận. Vui lòng thanh toán tiền mặt tại quầy trước giờ xe xuất bến.`
            : `Vé của bạn cho đơn hàng #${getPaymentOrderId(ticket) || ""} đã được thanh toán thành công.`,
        data: JSON.stringify({ path: "/profile/tickets" }),
      });
    } catch (notificationError) {
      console.warn("Failed to create payment notification:", notificationError);
    }
  };

  const handleCashPayment = async (ticket) => {
    const orderId = getPaymentOrderId(ticket);
    if (!orderId) {
      addToast("Không tìm thấy mã booking để thanh toán.", "error");
      return;
    }

    try {
      setPaymentLoadingKey(`${ticket.id}:cash`);
      const response = await createPaymentMethod(orderId, "cash");
      localStorage.setItem(`busgo_payment_method_${orderId}`, "CASH");
      await createPaymentNotification(ticket, "cash");
      addToast(
        response.data?.message ||
          "Đã ghi nhận thanh toán tiền mặt. Vui lòng thanh toán tại quầy trước giờ xuất bến.",
        "success",
      );
      await fetchTickets({ filters: appliedFilters });
    } catch (err) {
      addToast("Thanh toán tiền mặt thất bại: " + (err.response?.data?.message || err.message), "error");
    } finally {
      setPaymentLoadingKey("");
    }
  };

  const handleVnpayPayment = async (ticket) => {
    const orderId = getPaymentOrderId(ticket);
    if (!orderId) {
      addToast("Không tìm thấy mã booking để thanh toán.", "error");
      return;
    }

    try {
      setPaymentLoadingKey(`${ticket.id}:vnpay`);
      const response = await createPaymentMethod(orderId, "vnpay");
      const paymentUrl =
        response.data?.paymentUrl ||
        response.data?.url ||
        (typeof response.data === "string" ? response.data : null);

      if (!paymentUrl) {
        addToast("Không nhận được link thanh toán VNPay từ hệ thống.", "error");
        return;
      }

      window.location.href = paymentUrl;
    } catch (err) {
      addToast("Thanh toán VNPay thất bại: " + (err.response?.data?.message || err.message), "error");
    } finally {
      setPaymentLoadingKey("");
    }
  };

  const openCardPaymentModal = async (ticket) => {
    const orderId = getPaymentOrderId(ticket);
    if (!orderId) {
      addToast("Không tìm thấy mã booking để thanh toán.", "error");
      return;
    }

    try {
      setPaymentTicket(ticket);
      setShowCardModal(true);
      setLoadingCards(true);
      setPaymentLoadingKey(`${ticket.id}:stripe`);
      const response = await getPaymentMethods();
      const list = response.data?.paymentMethods || response.data?.data || response.data || [];
      const normalizedCards = Array.isArray(list) ? list : [];
      const defaultCard = normalizedCards.find((card) => card.isDefault);

      setCards(normalizedCards);
      setSelectedCardId(
        getPaymentMethodIdentifier(defaultCard) ||
          getPaymentMethodIdentifier(normalizedCards[0]) ||
          null,
      );
    } catch (err) {
      setShowCardModal(false);
      setPaymentTicket(null);
      addToast("Không thể tải danh sách thẻ: " + (err.response?.data?.message || err.message), "error");
    } finally {
      setLoadingCards(false);
      setPaymentLoadingKey("");
    }
  };

  const performStripePayment = async (ticket, selectedPaymentMethodId = null) => {
    const orderId = getPaymentOrderId(ticket);
    if (!orderId) {
      addToast("Không tìm thấy mã booking để thanh toán.", "error");
      return;
    }

    try {
      setProcessingCardPayment(true);
      const response = await createPaymentMethod(orderId, "stripe");
      const clientSecret = response.data?.clientSecret;

      if (!clientSecret) {
        addToast("Không nhận được clientSecret thanh toán thẻ.", "error");
        return;
      }

      if (!stripePromise) {
        addToast("Thiếu cấu hình Stripe key (REACT_APP_STRIPE_PUBLISHABLE_KEY).", "error");
        return;
      }

      const stripe = await stripePromise;
      if (!stripe) {
        addToast("Không thể khởi tạo Stripe.", "error");
        return;
      }

      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: selectedPaymentMethodId || undefined,
      });

      if (stripeError) {
        addToast("Thanh toán thẻ thất bại: " + (stripeError.message || "Unknown error"), "error");
        return;
      }

      if (paymentIntent?.status === "succeeded") {
        await createPaymentNotification(ticket, "stripe");

        // Optimistic update: vé hiện "Đã thanh toán" ngay lập tức
        setTickets((prev) =>
          prev.map((t) =>
            String(t.id) === String(ticket.id) ? { ...t, status: "paid" } : t
          )
        );

        addToast("Thanh toán bằng thẻ thành công!", "success");
        setShowCardModal(false);
        setPaymentTicket(null);

        // Refresh ngay + refresh lại sau 2-3s để bắt webhook Stripe
        fetchTickets({ filters: appliedFilters });
        setTimeout(() => {
          fetchTickets({ filters: appliedFilters });
        }, 2800);

        return;
      }

      addToast(`Thanh toán trả về trạng thái: ${paymentIntent?.status || "unknown"}`, "warning");
    } catch (err) {
      addToast("Thanh toán thẻ thất bại: " + (err.response?.data?.message || err.message), "error");
    } finally {
      setProcessingCardPayment(false);
    }
  };

  const handleSelectCardAndPay = async (card) => {
    const paymentMethodId = getPaymentMethodIdentifier(card);
    if (!paymentTicket || !paymentMethodId) {
      addToast("Thiếu thông tin thẻ hoặc booking.", "error");
      return;
    }

    try {
      setProcessingCardPayment(true);
      await setDefaultPaymentMethod(paymentMethodId);
      setProcessingCardPayment(false);
      await performStripePayment(paymentTicket, paymentMethodId);
    } catch (err) {
      setProcessingCardPayment(false);
      addToast("Không thể đặt thẻ mặc định để thanh toán: " + (err.response?.data?.message || err.message), "error");
    }
  };

  const handlePayWithNewCard = async (paymentMethodId) => {
    if (!paymentTicket || !paymentMethodId) {
      addToast("Thiếu thông tin thẻ hoặc booking.", "error");
      return;
    }

    await performStripePayment(paymentTicket, paymentMethodId);
  };

  const closeCardModal = () => {
    if (processingCardPayment || loadingCards) return;
    setShowCardModal(false);
    setPaymentTicket(null);
  };

  const handlePaymentClick = (ticket, method) => {
    if (!canPayPendingTicket(ticket, nowMs)) {
      addToast("Vé này không còn trong thời gian thanh toán.", "error");
      return;
    }

    setDetailOpen(false);
    setDetailTicket(null);

    if (method === "vnpay") {
      handleVnpayPayment(ticket);
      return;
    }

    if (method === "stripe") {
      openCardPaymentModal(ticket);
      return;
    }

    handleCashPayment(ticket);
  };

  const renderFilterButton = (field, option) => {
    const isActive = appliedFilters[field] === option.value;

    return (
      <button
        key={`${field}-${option.value || "all"}`}
        type="button"
        onClick={() => handleFilterChange(field, option.value)}
        disabled={loading || loadingMore}
        className={`inline-flex h-10 items-center rounded-xl border px-4 text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
          isActive
            ? "border-primary bg-primary text-white shadow-sm"
            : "border-outline-variant/50 bg-surface-container-lowest text-on-surface-variant hover:bg-primary/10 hover:text-primary"
        }`}
      >
        {option.label}
      </button>
    );
  };

  const renderPaymentActions = (ticket) => {
    if (!canPayPendingTicket(ticket, nowMs)) return null;

    const isBusy = Boolean(paymentLoadingKey) || processingCardPayment;

    return (
      <div className="mt-5 rounded-xl border border-secondary/20 bg-secondary/10 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-black text-secondary">Vé đang chờ thanh toán</p>
            <p className="mt-1 text-xs font-semibold text-on-surface-variant">
              Hạn thanh toán: {formatDateTime(ticket.expiredAt)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handlePaymentClick(ticket, "vnpay")}
              disabled={isBusy}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-3 text-sm font-bold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-[18px]">qr_code_2</span>
              {paymentLoadingKey === `${ticket.id}:vnpay` ? "Đang mở..." : "VNPay"}
            </button>
            <button
              type="button"
              onClick={() => handlePaymentClick(ticket, "stripe")}
              disabled={isBusy}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-surface-container-lowest px-3 text-sm font-bold text-primary ring-1 ring-primary/20 transition-colors hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-[18px]">credit_card</span>
              {paymentLoadingKey === `${ticket.id}:stripe` ? "Đang tải..." : "Thẻ"}
            </button>
            <button
              type="button"
              onClick={() => handlePaymentClick(ticket, "cash")}
              disabled={isBusy}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-surface-container-lowest px-3 text-sm font-bold text-secondary ring-1 ring-secondary/20 transition-colors hover:bg-secondary/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-[18px]">payments</span>
              {paymentLoadingKey === `${ticket.id}:cash` ? "Đang xử lý..." : "Tiền mặt"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderTicketCard = (ticket) => {
    const status = normalizeStatus(ticket.status);
    const isCancelDisabled = !canCancelTicket(ticket) || cancelLoading;

    return (
      <article
        key={`${ticket.id}-${ticket.bookingId}`}
        className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-5 shadow-sm transition-shadow hover:border-primary/25 hover:shadow-md"
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="material-symbols-outlined text-[22px] text-primary">confirmation_number</span>
              <h2 className="text-lg font-black text-on-surface">{getTicketCode(ticket)}</h2>
              <span className={`rounded-full px-3 py-1 text-xs font-extrabold ${getStatusBadgeClass(status)}`}>
                {getStatusLabel(status)}
              </span>
            </div>
            <p className="mt-1 text-sm font-semibold text-on-surface-variant">
              Đơn đặt vé #{ticket.bookingId}
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
            {canReviewTicket(ticket) ? (
              <button
                type="button"
                onClick={() => handleOpenReview(ticket)}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-secondary/20 bg-secondary/10 px-3 text-sm font-bold text-secondary transition-colors hover:bg-secondary/20"
              >
                <span className="material-symbols-outlined text-[18px]">star</span>
                Đánh giá
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => handleOpenDetail(ticket)}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 text-sm font-bold text-primary transition-colors hover:bg-primary/10"
            >
              <span className="material-symbols-outlined text-[18px]">visibility</span>
              Chi tiết
            </button>
            <button
              type="button"
              onClick={() => setCancelTarget(ticket)}
              disabled={isCancelDisabled}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-error/20 bg-error-container/50 px-3 text-sm font-bold text-error transition-colors hover:bg-error-container disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-[18px]">delete</span>
              Hủy vé
            </button>
          </div>
        </div>

        <dl className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <DetailRow label="Loại booking" value={bookingTypeLabels[ticket.bookingType] || ticket.bookingType} />
          <DetailRow label="Tổng tiền" value={formatMoney(ticket.totalAmount)} />
          <DetailRow label="Ngày khởi hành" value={formatDateTime(ticket.departureDate)} />
          <DetailRow label="Trạng thái chuyến" value={tripStatusLabels[ticket.tripStatus] || ticket.tripStatus || "Chưa có"} />
        </dl>
        {renderPaymentActions(ticket)}
      </article>
    );
  };

  return (
    <div className="bg-surface min-h-screen pt-24 pb-12 px-6">
      <div className="max-w-6xl mx-auto">
        <CustomerProfileSectionHeader
          title="Vé đã đặt"
          action={
            <button
              type="button"
              onClick={() => fetchTickets({ filters: appliedFilters })}
              disabled={loading || loadingMore}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-white shadow-sm transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className={`material-symbols-outlined text-[18px] ${loading ? "animate-spin" : ""}`}>
                {loading ? "progress_activity" : "refresh"}
              </span>
              Làm mới
            </button>
          }
        />
        <CustomerProfileNav />

        <section className="mb-6 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-4 shadow-sm">
          <div className="space-y-4">
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-on-surface-variant">
                <span className="material-symbols-outlined text-[17px]">swap_horiz</span>
                Loại đặt vé
              </div>
              <div className="flex flex-wrap gap-2">
                {BOOKING_TYPE_OPTIONS.map((option) => renderFilterButton("type", option))}
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-on-surface-variant">
                <span className="material-symbols-outlined text-[17px]">fact_check</span>
                Trạng thái vé
              </div>
              <div className="flex flex-wrap gap-2">
                {TICKET_STATUS_OPTIONS.map((option) => renderFilterButton("status", option))}
              </div>
            </div>
          </div>
        </section>

        {tickets.length > 0 ? (
          <p className="mb-4 text-sm font-bold text-on-surface-variant">
            {tickets.length} vé{activeFilterCount ? " theo bộ lọc hiện tại" : ""}
          </p>
        ) : null}

        {loading && tickets.length === 0 ? (
          <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-10 text-center shadow-sm">
            <div className="mx-auto mb-4 h-10 w-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            <p className="font-bold text-on-surface-variant">Đang tải danh sách vé...</p>
          </div>
        ) : error && tickets.length === 0 ? (
          <div className="rounded-2xl border border-error/20 bg-error-container/40 p-6 text-error">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-[24px]">error</span>
              <div className="min-w-0">
                <h2 className="font-black">Không thể tải danh sách vé</h2>
                <p className="mt-1 text-sm font-semibold">{error}</p>
                <button
                  type="button"
                  onClick={() => fetchTickets({ filters: appliedFilters })}
                  className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-error px-4 text-sm font-bold text-white transition-colors hover:bg-error/90"
                >
                  <span className="material-symbols-outlined text-[18px]">refresh</span>
                  Thử lại
                </button>
              </div>
            </div>
          </div>
        ) : tickets.length === 0 ? (
          <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-12 text-center shadow-sm">
            <span className="material-symbols-outlined mb-4 text-6xl text-on-surface-variant">confirmation_number</span>
            <h2 className="text-xl font-black text-on-surface">Chưa có vé nào</h2>
            <p className="mx-auto mt-2 max-w-md text-sm font-medium text-on-surface-variant">
              Danh sách vé của bạn sẽ xuất hiện tại đây sau khi đặt hoặc thanh toán thành công.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {error ? (
              <div className="rounded-xl border border-error/20 bg-error-container/40 px-4 py-3 text-sm font-bold text-error">
                {error}
              </div>
            ) : null}
            {tickets.map(renderTicketCard)}
          </div>
        )}

        {tickets.length > 0 && nextCursor != null ? (
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-primary/20 bg-surface-container-lowest px-5 text-sm font-bold text-primary shadow-sm transition-colors hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className={`material-symbols-outlined text-[18px] ${loadingMore ? "animate-spin" : ""}`}>
                {loadingMore ? "progress_activity" : "expand_more"}
              </span>
              {loadingMore ? "Đang tải..." : "Tải thêm"}
            </button>
          </div>
        ) : null}

        {detailOpen ? (
          <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
            <section className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-surface-container-lowest shadow-2xl">
              <header className="flex items-center justify-between border-b border-outline-variant/30 px-5 py-4">
                <div>
                  <h2 className="text-lg font-black text-on-surface">Chi tiết vé</h2>
                  <p className="text-sm font-semibold text-on-surface-variant">
                    {detailTicket ? getTicketCode(detailTicket) : "Đang tải..."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeDetail}
                  disabled={detailLoading}
                  className="flex h-10 w-10 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container-low disabled:cursor-not-allowed disabled:opacity-60"
                  aria-label="Đóng"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </header>

              <div className="max-h-[calc(90vh-84px)] overflow-y-auto p-5">
                {detailLoading ? (
                  <div className="flex min-h-48 flex-col items-center justify-center gap-4">
                    <div className="h-10 w-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                    <p className="font-bold text-on-surface-variant">Đang tải chi tiết vé...</p>
                  </div>
                ) : detailError ? (
                  <div className="rounded-xl border border-error/20 bg-error-container/40 p-4 text-sm font-bold text-error">
                    {detailError}
                  </div>
                ) : detailTicket ? (
                  <div className="space-y-5">
                    <div className="flex flex-col gap-3 rounded-xl border border-primary/10 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">Tuyến</p>
                        <h3 className="mt-1 text-xl font-black text-on-surface">
                          {detailTicket.fromLocation || "Chưa có"} - {detailTicket.toLocation || "Chưa có"}
                        </h3>
                      </div>
                      <span className={`self-start rounded-full px-3 py-1 text-xs font-extrabold sm:self-center ${getStatusBadgeClass(detailTicket.status)}`}>
                        {getStatusLabel(detailTicket.status)}
                      </span>
                    </div>

                    <dl className="grid gap-4 sm:grid-cols-2">
                      <DetailRow label="Mã vé" value={detailTicket.code || `#${detailTicket.id}`} />
                      <DetailRow label="Loại booking" value={bookingTypeLabels[detailTicket.bookingType] || detailTicket.bookingType} />
                      <DetailRow label="Ngày khởi hành" value={formatDateTime(detailTicket.departureDate)} />
                      <DetailRow label="Giờ đi" value={detailTicket.departureTime} />
                      <DetailRow label="Số ghế" value={detailTicket.seatNumber} />
                      <DetailRow label="Loại xe" value={detailTicket.type === "bed" ? "Giường nằm" : detailTicket.type === "seat" ? "Ghế ngồi" : detailTicket.type} />
                      <DetailRow label="Biển số" value={detailTicket.plateNumber} />
                      <DetailRow label="Giá gốc" value={formatMoney(detailTicket.originalAmount)} />
                      <DetailRow label="Giảm giá" value={formatMoney(detailTicket.discountAmount)} />
                      <DetailRow label="Tổng tiền" value={formatMoney(detailTicket.totalAmount)} />
                    </dl>

                    {renderPaymentActions(detailTicket)}

                    {canReviewTicket(detailTicket) || canCancelTicket(detailTicket) ? (
                      <div className="flex flex-wrap justify-end gap-2 border-t border-outline-variant/30 pt-4">
                        {canReviewTicket(detailTicket) ? (
                          <button
                            type="button"
                            onClick={() => handleOpenReview(detailTicket)}
                            className="inline-flex h-10 items-center gap-2 rounded-xl border border-secondary/20 bg-secondary/10 px-4 text-sm font-bold text-secondary transition-colors hover:bg-secondary/20"
                          >
                            <span className="material-symbols-outlined text-[18px]">star</span>
                            Đánh giá
                          </button>
                        ) : null}
                        {canCancelTicket(detailTicket) ? (
                        <button
                          type="button"
                          onClick={() => setCancelTarget(detailTicket)}
                          disabled={cancelLoading}
                          className="inline-flex h-10 items-center gap-2 rounded-xl border border-error/20 bg-error-container/50 px-4 text-sm font-bold text-error transition-colors hover:bg-error-container disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                          Hủy vé
                        </button>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </section>
          </div>
        ) : null}

        <ConfirmModal
          isOpen={!!cancelTarget}
          title="Xác nhận hủy vé"
          message={`Bạn có chắc chắn muốn hủy vé ${cancelTarget ? getTicketCode(cancelTarget) : ""}?`}
          confirmText={cancelLoading ? "Đang hủy..." : "Có, hủy vé"}
          cancelText="Đóng"
          onConfirm={handleConfirmCancel}
          onCancel={() => {
            if (!cancelLoading) setCancelTarget(null);
          }}
          confirmDisabled={cancelLoading}
          cancelDisabled={cancelLoading}
        />

        <SelectPaymentCardModal
          open={showCardModal}
          onClose={closeCardModal}
          cards={cards}
          loading={loadingCards}
          selectedCardId={selectedCardId}
          onChangeSelectedCard={(card) => setSelectedCardId(getPaymentMethodIdentifier(card) || null)}
          onContinueWithSelected={handleSelectCardAndPay}
          onContinueWithPaymentMethodId={handlePayWithNewCard}
          onGoToManageCards={() => navigate("/profile/payment-methods")}
          continuing={processingCardPayment}
        />

        <ReviewTripModal
          isOpen={!!reviewTicket}
          onClose={() => setReviewTicket(null)}
          ticket={reviewTicket}
          onSuccess={() => addToast("Gửi đánh giá thành công.", "success")}
        />
      </div>
    </div>
  );
}
