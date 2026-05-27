import React, { useEffect, useState } from "react";
import {
  getMyTickets,
  cancelTicket,
  createPaymentMethod,
  getPaymentMethods,
  setDefaultPaymentMethod,
} from "../../api/customer";
import { createNotification } from "../../api/notification";
import { useNavigate } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import CustomerProfileNav from "../../components/profile/CustomerProfileNav";
import CustomerProfileSectionHeader from "../../components/profile/CustomerProfileSectionHeader";
import SelectPaymentCardModal from "../../components/payment/SelectPaymentCardModal";
import ConfirmModal from "../../components/common/ConfirmModal";
import ReviewTripModal from "../../components/reviews/ReviewTripModal";
import { useToast } from "../../context/ToastContext";

const stripePublishableKey = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || "";
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;
const DELETED_TICKETS_STORAGE_KEY = "busgo_deleted_tickets";
const EXPIRED_TICKETS_STORAGE_KEY = "busgo_expired_tickets";

const readStoredTicketIds = (key) => {
  try {
    const ids = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(ids) ? ids.map(String) : [];
  } catch {
    return [];
  }
};

const addStoredTicketId = (key, id) => {
  const ticketId = String(id);
  const ids = readStoredTicketIds(key);
  if (!ids.includes(ticketId)) {
    localStorage.setItem(key, JSON.stringify([...ids, ticketId]));
  }
};

const getLocalPaymentMethod = (ticket) => {
  try {
    return (
      localStorage.getItem(`busgo_payment_method_${ticket?.bookingId}`) ||
      localStorage.getItem(`busgo_payment_method_${ticket?.id}`) ||
      ""
    );
  } catch {
    return "";
  }
};

const isCashTicket = (ticket) => {
  return String(ticket?.paymentMethod || ticket?.paymentType || getLocalPaymentMethod(ticket)).toUpperCase() === "CASH";
};

const getDisplayTicketStatus = (ticket) => {
  const currentStatus = String(ticket?.status || "pending").toUpperCase();
  const isStoredExpired = readStoredTicketIds(EXPIRED_TICKETS_STORAGE_KEY).includes(String(ticket?.id));

  if (currentStatus === "EXPIRED" || isStoredExpired) {
    return "EXPIRED";
  }

  if (isCashTicket(ticket) && (currentStatus === "PENDING" || currentStatus === "RESERVED")) {
    return "CASH_PAID";
  }

  return currentStatus;
};

const CountdownTimer = ({ expiredAt, onExpire }) => {
  const [timeLeft, setTimeLeft] = useState(new Date(expiredAt).getTime() - Date.now());
  const hasExpiredRef = React.useRef(false);

  useEffect(() => {
    if (timeLeft <= 0) {
      if (!hasExpiredRef.current) {
        hasExpiredRef.current = true;
        onExpire();
      }
      return;
    }
    const intervalId = setInterval(() => {
      const remaining = new Date(expiredAt).getTime() - Date.now();
      setTimeLeft(remaining);
      if (remaining <= 0) {
         clearInterval(intervalId);
         if (!hasExpiredRef.current) {
           hasExpiredRef.current = true;
           onExpire();
         }
      }
    }, 1000);
    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expiredAt]);

  if (timeLeft <= 0) return <span className="font-bold">Đã hết hạn</span>;

  const m = Math.floor((timeLeft / 1000 / 60) % 60);
  const s = Math.floor((timeLeft / 1000) % 60);

  return <span className="font-bold">{m}:{s < 10 ? '0' : ''}{s}</span>;
};

export default function MyTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const [cards, setCards] = useState([]);
  const [loadingCards, setLoadingCards] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState(null);
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [processingCardPayment, setProcessingCardPayment] = useState(false);
  const [ticketToCancel, setTicketToCancel] = useState(null);
  const [ticketToDelete, setTicketToDelete] = useState(null);
  
  // Review States
  const [reviewTicket, setReviewTicket] = useState(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  
  // Filter State
  const [filterStatus, setFilterStatus] = useState("ALL");
  
  // Pagination & Scroll States
  const [nextCursor, setNextCursor] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  
  const navigate = useNavigate();
  const { addToast } = useToast();

  const fetchTickets = async (cursor = null, isLoadMore = false) => {
    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      
      const params = { limit: 10 };
      if (cursor) {
        params.next = cursor;
      }
      
      const res = await getMyTickets(params);
      const raw = res.data || {};
      let list = raw.tickets || (Array.isArray(raw) ? raw : (raw.data?.tickets || raw.data || []));
      const next = raw.next || res.data?.next || null;
      
      // Xóa vé ảo (Lọc khỏi danh sách hiển thị)
      const deletedIds = readStoredTicketIds(DELETED_TICKETS_STORAGE_KEY);
      if (deletedIds.length > 0) {
        list = list.filter(t => !deletedIds.includes(String(t.id)));
      }
      
      if (isLoadMore) {
        setTickets(prev => {
          const prevIds = new Set(prev.map(item => item.id));
          const uniqueList = list.filter(item => !prevIds.has(item.id));
          return [...prev, ...uniqueList];
        });
      } else {
        setTickets(list);
      }
      setNextCursor(next);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) {
         navigate("/login");
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (loading || loadingMore || !nextCursor) return;
      
      const threshold = 150;
      const totalHeight = document.documentElement.scrollHeight;
      const scrollPosition = window.innerHeight + window.scrollY;
      
      if (totalHeight - scrollPosition <= threshold) {
        fetchTickets(nextCursor, true);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [loading, loadingMore, nextCursor]);

  const executeCancel = async (id, isAuto = false) => {
    try {
      if (isAuto) {
        addStoredTicketId(EXPIRED_TICKETS_STORAGE_KEY, id);
      }
      await cancelTicket(id);
      if (!isAuto) addToast("Hủy vé thành công!", "success");
      try {
        const userStr = localStorage.getItem("user");
        if (userStr) {
          const currentUser = JSON.parse(userStr);
          if (currentUser?.id) {
            await createNotification({
              userId: currentUser.id,
              title: "Hủy vé thành công",
              body: `Vé xe #${id || ""} đã được hủy thành công. Hy vọng được phục vụ bạn ở hành trình tiếp theo!`,
              data: JSON.stringify({ path: "/profile/tickets" })
            });
          }
        }
      } catch (notifErr) {
        console.warn("Failed to create cancel notification:", notifErr);
      }
      fetchTickets();
    } catch (err) {
      if (!isAuto) addToast("Hủy vé thất bại: " + (err.response?.data?.message || err.message), "error");
    } finally {
      if (!isAuto) {
        setTicketToCancel(null);
      }
    }
  };

  const handleCancel = (id, isAuto = false) => {
    if (isAuto) {
      executeCancel(id, true);
    } else {
      setTicketToCancel(id);
    }
  };

  const handleDeleteTicket = (id) => {
    addStoredTicketId(DELETED_TICKETS_STORAGE_KEY, id);
    setTickets(prev => prev.filter(t => t.id !== id));
    addToast("Đã xóa vé khỏi lịch sử!", "success");
  };

  const handlePayment = async (id, method, selectedPaymentMethodId = null) => {
    try {
      if (method === "cash") {
        localStorage.setItem(`busgo_payment_method_${id}`, 'CASH');
        try {
           const res = await createPaymentMethod(id, method);
           try {
             const userStr = localStorage.getItem("user");
             if (userStr) {
               const currentUser = JSON.parse(userStr);
               if (currentUser?.id) {
                 await createNotification({
                   userId: currentUser.id,
                   title: "Yêu cầu thanh toán Tiền mặt",
                   body: `Đã ghi nhận yêu cầu thanh toán Tiền mặt cho vé #${id || ""}. Vui lòng thanh toán trước giờ xuất bến.`,
                   data: JSON.stringify({ path: "/profile/tickets" })
                 });
               }
             }
           } catch (notifErr) {
             console.warn("Failed to create cash notification:", notifErr);
           }
           addToast(res.data?.message || "Đã ghi nhận yêu cầu thanh toán Tiền mặt! Vui lòng thanh toán tại quầy trước giờ xuất bến.", "success");
           fetchTickets(); // Lấy lại data từ Backend để cập nhật paymentMethod = 'CASH'
        } catch (err) {
           addToast("Không thể ghi nhận thanh toán tiền mặt: " + (err.response?.data?.message || err.message), "error");
        }
        return;
      }

      const res = await createPaymentMethod(id, method);
      
      if (method === "vnpay") {
        const url = res.data?.paymentUrl || res.data?.url || (typeof res.data === 'string' ? res.data : null);
        if (url) {
           window.location.href = url;
        } else {
           addToast("Lỗi: Không nhận được URL thanh toán từ Backend. " + JSON.stringify(res.data), "error");
        }
      } else if (method === "stripe") {
        const clientSecret = res.data?.clientSecret;
        const paymentIntentId = res.data?.paymentIntentId;

        if (!clientSecret) {
          addToast("Không nhận được clientSecret từ backend để thanh toán Stripe.", "error");
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

        const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
          payment_method: selectedPaymentMethodId || undefined,
        });
        if (error) {
          addToast("Thanh toán Stripe thất bại: " + (error.message || "Unknown error"), "error");
          return;
        }

        const paidIntentId = paymentIntent?.id || paymentIntentId;
        if (paymentIntent?.status === "succeeded") {
          addToast(`Thanh toán thành công! ${paidIntentId ? `(PI: ${paidIntentId})` : ""}`, "success");
          fetchTickets();
          return;
        }
        fetchTickets();
      }
      
    } catch (err) {
      addToast("Lỗi gọi thanh toán: " + (err.response?.data?.message || err.message), "error");
    }
  };

  const openCardPaymentModal = async (orderId) => {
    try {
      setPendingOrderId(orderId);
      setLoadingCards(true);
      setShowCardModal(true);
      const res = await getPaymentMethods();
      const list = res.data?.paymentMethods || res.data?.data || res.data || [];
      const normalizedCards = Array.isArray(list) ? list : [];
      setCards(normalizedCards);
      const defaultCard = normalizedCards.find((card) => card.isDefault);
      setSelectedCardId(
        defaultCard?.stripePaymentMethodId ||
          defaultCard?.id ||
          normalizedCards[0]?.stripePaymentMethodId ||
          normalizedCards[0]?.id ||
          null,
      );
    } catch (err) {
      setShowCardModal(false);
      addToast("Không thể tải danh sách thẻ: " + (err.response?.data?.message || err.message), "error");
    } finally {
      setLoadingCards(false);
    }
  };

  const handleSelectCardAndPay = async (card) => {
    try {
      setProcessingCardPayment(true);
      const paymentMethodId = card?.stripePaymentMethodId || card?.id;
      if (!paymentMethodId || !pendingOrderId) {
        addToast("Thiếu thông tin thẻ hoặc đơn hàng.", "error");
        return;
      }

      await setDefaultPaymentMethod(paymentMethodId);
      setShowCardModal(false);
      await handlePayment(pendingOrderId, "stripe", paymentMethodId);
    } catch (err) {
      addToast("Không thể đặt thẻ mặc định để thanh toán: " + (err.response?.data?.message || err.message), "error");
    } finally {
      setProcessingCardPayment(false);
    }
  };

  const handlePayWithNewCard = async (paymentMethodId) => {
    try {
      setProcessingCardPayment(true);
      if (!paymentMethodId || !pendingOrderId) {
        addToast("Thiếu thông tin thẻ hoặc đơn hàng.", "error");
        return;
      }
      setShowCardModal(false);
      await handlePayment(pendingOrderId, "stripe", paymentMethodId);
    } catch (err) {
      addToast("Không thể thanh toán bằng thẻ mới: " + (err.response?.data?.message || err.message), "error");
    } finally {
      setProcessingCardPayment(false);
    }
  };

  return (
    <div className="bg-surface min-h-screen pt-24 pb-12 px-6">
      <div className="max-w-4xl mx-auto">
        <CustomerProfileSectionHeader title="Vé đã đặt" />
        
        <CustomerProfileNav />

        {tickets.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-6 mb-6">
            {[
              { id: 'ALL', label: 'Tất cả' },
              { id: 'PENDING', label: 'Chờ thanh toán' },
              { id: 'COMPLETED', label: 'Đã thanh toán / Hoàn thành' },
              { id: 'CANCELLED', label: 'Đã hủy' }
            ].map(f => (
              <button 
                key={f.id}
                onClick={() => setFilterStatus(f.id)}
                className={`px-4 py-2 rounded-full text-sm font-bold transition-colors shadow-sm ${filterStatus === f.id ? 'bg-primary text-white' : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}

        <ConfirmModal 
          isOpen={!!ticketToCancel} 
          title="Xác nhận hủy vé" 
          message="Bạn có chắc chắn muốn hủy chuyến đi này không? Thao tác này không thể hoàn tác." 
          confirmText="Có, hủy vé"
          cancelText="Đóng"
          onConfirm={() => executeCancel(ticketToCancel)} 
          onCancel={() => setTicketToCancel(null)} 
        />

        {loading ? (
          <p className="text-on-surface-variant animate-pulse mt-6">Đang tải danh sách vé...</p>
        ) : tickets.length === 0 ? (
          <div className="bg-surface-container-lowest p-12 text-center rounded-2xl shadow-sm border border-surface-container mt-6">
             <span className="material-symbols-outlined text-6xl text-on-surface-variant mb-4">confirmation_number</span>
             <h2 className="text-xl font-bold text-on-surface mb-2">Chưa có vé nào</h2>
             <p className="text-on-surface-variant mb-6">Bạn chưa đặt chuyến xe nào cùng BusGo.</p>
             <button onClick={() => navigate("/")} className="bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-primary/90 transition-colors">Tìm chuyến ngay</button>
          </div>
        ) : (() => {
          const filteredTickets = tickets.filter(t => {
            if (filterStatus === 'ALL') return true;
            
            const currentStatus = getDisplayTicketStatus(t);

            if (filterStatus === 'PENDING') return currentStatus === 'PENDING' || currentStatus === 'RESERVED';
            if (filterStatus === 'COMPLETED') return ['COMPLETED', 'PAID', 'CHECKED_IN', 'CASH_PAID'].includes(currentStatus);
            if (filterStatus === 'CANCELLED') return ['CANCELLED', 'EXPIRED'].includes(currentStatus);
            
            return true;
          });

          if (filteredTickets.length === 0) {
            return (
              <div className="bg-surface-container-lowest p-12 text-center rounded-2xl shadow-sm border border-surface-container">
                 <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-2 opacity-50">filter_list_off</span>
                 <p className="text-on-surface-variant font-medium">Không có vé nào phù hợp với bộ lọc.</p>
              </div>
            );
          }

          return (
            <div className="space-y-6">
              {filteredTickets.map((t, idx) => {
               const currentStatus = getDisplayTicketStatus(t);
               const tripStatus = String(t.tripStatus || t.trip?.status || t.tripSchedule?.tripStatus || t.tripSchedule?.status || '').toUpperCase();

               const isPending = currentStatus === "PENDING" || currentStatus === "RESERVED";
               const isTripCompleted = currentStatus === "COMPLETED" || tripStatus === "COMPLETED";
               const canShowReviewAction =
                 !["CANCELLED", "EXPIRED"].includes(currentStatus) &&
                 (["COMPLETED", "PAID", "CHECKED_IN", "CASH_PAID"].includes(currentStatus) || isTripCompleted);
               
               const statusLabelMap = {
                 'PENDING': 'Chờ thanh toán', 'RESERVED': 'Đã giữ chỗ',
                 'PAID': 'Đã thanh toán', 'COMPLETED': 'Hoàn thành',
                 'CANCELLED': 'Đã hủy', 'EXPIRED': 'Hết hạn',
                 'CHECKED_IN': 'Đã lên xe',
                 'CASH_PAID': 'Thanh toán (Tiền mặt)'
               };
               const statusLabel = statusLabelMap[currentStatus] || currentStatus;

               // Kế hoạch 1: Kiểm tra hạn đánh giá (7 ngày sau khi khởi hành)
               let isReviewExpired = false;
               if (t.departureDate) {
                 const expireDate = new Date(t.departureDate);
                 expireDate.setDate(expireDate.getDate() + 7);
                 if (new Date() > expireDate) {
                   isReviewExpired = true;
                 }
               }
               
               return (
                 <div key={idx} className="bg-white border rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                   <div className="space-y-2">
                      <div className="flex items-center gap-3">
                         <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold border border-primary/20">Mã vé: #{t.id} {t.bookingId ? `(Order #${t.bookingId})` : ''}</span>
                         <span className={`px-3 py-1 rounded-full text-xs font-bold ${currentStatus === 'COMPLETED' || currentStatus === 'PAID' || currentStatus === 'CASH_PAID' ? 'bg-green-100 text-green-700' : currentStatus === 'CANCELLED' ? 'bg-red-100 text-red-700' : currentStatus === 'EXPIRED' ? 'bg-gray-200 text-gray-600' : 'bg-orange-100 text-orange-700'}`}>
                           {statusLabel}
                         </span>
                      </div>
                      <h3 className="font-bold text-lg">Loại hành trình: {t.bookingType === 'round_trip' ? 'Khứ hồi' : 'Một chiều'}</h3>
                      <p className="text-sm text-on-surface-variant"><span className="material-symbols-outlined text-[16px] align-text-bottom mr-1">calendar_month</span>Khởi hành: {t.departureDate ? new Date(t.departureDate).toLocaleString('vi-VN') : 'N/A'}</p>
                      
                                              {(() => {
                         const original = t.originalAmount || t.totalPrice || t.price || 0;
                         const finalPrice = t.totalAmount && t.totalAmount > 0
                           ? t.totalAmount
                           : Math.max(0, original - (t.discountAmount || 0));
                         const discount = t.discountAmount || (original > finalPrice ? original - finalPrice : 0);
                         return (
                           <div className="space-y-1">
                             <p className="text-sm font-bold text-secondary">
                               Tổng tiền: {finalPrice.toLocaleString()}đ
                             </p>
                             {discount > 0 && (
                               <p className="text-xs font-semibold text-green-600">
                                 (Đã giảm: -{discount.toLocaleString()}đ)
                               </p>
                             )}
                           </div>
                         );
                       })()}
                       
                       {(() => {
                         const rawTime = t.expiredAt || t.createdAt || t.created_at || t.createdDate || t.createAt || t.bookingDate || t.bookingTime || t.orderDate;
                         let baseTime = t.expiredAt ? t.expiredAt : (rawTime ? new Date(new Date(rawTime).getTime() + 10 * 60000).toISOString() : null);
                         const isCash = isCashTicket(t);
                         
                         if (isPending && !isCash) {
                           // Fallback to localStorage if API doesn't provide any time
                           if (!baseTime) {
                             const localKey = `busgo_ticket_expire_${t.id}`;
                             baseTime = localStorage.getItem(localKey);
                             if (!baseTime) {
                               baseTime = new Date(Date.now() + 10 * 60000).toISOString();
                               localStorage.setItem(localKey, baseTime);
                             }
                           }

                           return (
                             <p className="text-xs text-red-500 font-medium flex items-center gap-1 mt-2">
                                <span className="material-symbols-outlined text-[14px]">timer</span>
                                Hết hạn trong: <CountdownTimer expiredAt={baseTime} onExpire={() => handleCancel(t.id, true)} />
                             </p>
                           );
                         }
                         return null;
                       })()}
                    </div>
                   
                   <div className="flex gap-3 w-full md:w-auto">
                      {isPending ? (
                         <>
                           <div className="flex md:flex-col gap-2 flex-1 md:flex-none">
                             <button onClick={() => handlePayment(t.bookingId || t.id, "vnpay")} className="w-full border border-primary text-primary hover:bg-primary hover:text-white transition-colors px-4 py-2 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm text-sm">
                               <span className="material-symbols-outlined text-[16px]">qr_code_scanner</span>
                               VNPay
                             </button>
                            <button onClick={() => openCardPaymentModal(t.bookingId || t.id)} className="w-full border border-primary/40 text-primary hover:bg-primary/10 transition-colors px-4 py-2 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm text-sm">
                               <span className="material-symbols-outlined text-[16px]">credit_card</span>
                              Thanh toán bằng thẻ
                             </button>
                             <button onClick={() => handlePayment(t.bookingId || t.id, "cash")} className="w-full border border-secondary text-secondary hover:bg-secondary hover:text-white transition-colors px-4 py-2 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm text-sm">
                               <span className="material-symbols-outlined text-[16px]">payments</span>
                               Tiền mặt
                             </button>
                           </div>
                           <button onClick={() => navigate(`/my-tickets/${t.id}`)} className="flex-1 md:flex-none border border-primary text-primary hover:bg-primary hover:text-white transition-colors px-6 py-2 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm">
                             Xem chi tiết
                           </button>
                           <button onClick={() => handleCancel(t.id)} className="flex-1 md:flex-none bg-red-50 hover:bg-red-100 text-red-600 px-6 py-2 rounded-xl font-bold transition-colors">
                             Hủy
                           </button>
                         </>
                      ) : (
                         <>
                           <button onClick={() => navigate(`/my-tickets/${t.id}`)} className="flex-1 md:flex-none border border-primary text-primary hover:bg-primary hover:text-white transition-colors px-6 py-2 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm">
                             Xem vé
                           </button>
                           {canShowReviewAction && (
                             (() => {
                               if (!isTripCompleted) {
                                 return (
                                   <div className="flex-1 md:flex-none bg-surface-container text-on-surface-variant px-6 py-2 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm cursor-not-allowed opacity-80" title="Chuyến đi chưa hoàn thành">
                                     <span className="material-symbols-outlined text-[18px]">pending_actions</span>
                                     Chưa hoàn thành
                                   </div>
                                 );
                               }

                               if (t.isReviewed || t.hasRating) {
                                 return (
                                   <div className="flex-1 md:flex-none bg-green-50 text-green-600 border border-green-200 px-6 py-2 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm cursor-default" title="Bạn đã đánh giá chuyến xe này">
                                     <span className="material-symbols-outlined text-[18px]">check_circle</span>
                                     Đã đánh giá
                                   </div>
                                 );
                               }

                               if (isReviewExpired) {
                                 return null;
                               }

                               return (
                                 <button 
                                   onClick={() => {
                                     setReviewTicket({
                                       id: t.id,
                                       tripId: t.tripId || t.tripScheduleId || t.trip?.id || t.tripSchedule?.id || t.scheduleId || t.id,
                                       companyName: t.companyName || t.company?.name || "Chuyến xe của bạn",
                                       departureLocation: t.fromLocation || t.departureLocation || "Điểm đi",
                                       arrivalLocation: t.toLocation || t.arrivalLocation || "Điểm đến",
                                       departureDate: t.departureDate
                                     });
                                     setIsReviewModalOpen(true);
                                   }}
                                   className="flex-1 md:flex-none bg-yellow-400 hover:bg-yellow-500 text-on-surface px-6 py-2 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm transition-colors"
                                 >
                                   <span className="material-symbols-outlined text-[18px]">rate_review</span>
                                   Đánh giá
                                 </button>
                               );
                             })()
                           )}
                         </>
                      )}
                   </div>
                 </div>
               )
              })}
              
              {loadingMore && (
                <div className="flex justify-center items-center py-6">
                  <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin mr-2"></div>
                  <span className="text-sm text-on-surface-variant font-medium">Đang tải thêm vé...</span>
                </div>
              )}
            </div>
          );
        })()}
      </div>
      <SelectPaymentCardModal
        open={showCardModal}
        onClose={() => {
          if (processingCardPayment) return;
          setShowCardModal(false);
        }}
        cards={cards}
        loading={loadingCards}
        selectedCardId={selectedCardId}
        onChangeSelectedCard={(card) =>
          setSelectedCardId(card?.stripePaymentMethodId || card?.id || null)
        }
        onContinueWithSelected={(card) => handleSelectCardAndPay(card)}
        onContinueWithPaymentMethodId={handlePayWithNewCard}
        continuing={processingCardPayment}
      />
      
      {/* Review Modal */}
      <ReviewTripModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        ticket={reviewTicket}
        onSuccess={() => {
          addToast("Cảm ơn bạn đã gửi đánh giá!", "success");
          fetchTickets(); // Refresh để có thể cập nhật trạng thái đã đánh giá nếu backend trả về
        }}
      />
      
      <ConfirmModal 
        isOpen={!!ticketToCancel}
        title="Xác nhận hủy vé"
        message="Bạn có chắc chắn muốn hủy vé này không? Hành động này không thể hoàn tác."
        onConfirm={() => executeCancel(ticketToCancel)}
        onCancel={() => setTicketToCancel(null)}
      />

      <ConfirmModal 
        isOpen={!!ticketToDelete}
        title="Xác nhận xóa vé"
        message="Bạn có chắc chắn muốn xóa vé này khỏi lịch sử đặt vé không?"
        onConfirm={() => {
          handleDeleteTicket(ticketToDelete);
          setTicketToDelete(null);
        }}
        onCancel={() => setTicketToDelete(null)}
      />
    </div>
  );
}
