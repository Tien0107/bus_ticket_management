import React, { useEffect, useState } from "react";
import {
  getMyTickets,
  cancelTicket,
  createPaymentMethod,
  getPaymentMethods,
  setDefaultPaymentMethod,
} from "../../api/customer";
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
  
  const navigate = useNavigate();
  const { addToast } = useToast();

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await getMyTickets({ limit: 10 });
      let list = res.data?.tickets || res.data || [];
      
      // Xóa vé ảo (Lọc khỏi danh sách hiển thị)
      const deletedIds = JSON.parse(localStorage.getItem("busgo_deleted_tickets") || "[]");
      if (deletedIds.length > 0) {
        list = list.filter(t => !deletedIds.includes(t.id));
      }
      
      setTickets(list);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) {
         navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const executeCancel = async (id, isAuto = false) => {
    try {
      await cancelTicket(id);
      if (!isAuto) addToast("Hủy vé thành công!", "success");
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
    const deletedIds = JSON.parse(localStorage.getItem("busgo_deleted_tickets") || "[]");
    if (!deletedIds.includes(id)) {
      deletedIds.push(id);
      localStorage.setItem("busgo_deleted_tickets", JSON.stringify(deletedIds));
    }
    setTickets(prev => prev.filter(t => t.id !== id));
    addToast("Đã xóa vé khỏi lịch sử!", "success");
  };

  const handlePayment = async (id, method, selectedPaymentMethodId = null) => {
    try {
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
      } else if (method === "cash") {
        addToast(res.data?.message || "Đã ghi nhận yêu cầu thanh toán Tiền mặt! Vui lòng thanh toán tại quầy trước giờ xuất bến.", "success");
        // Kế hoạch A: Lưu cờ giả vào LocalStorage vì Backend chưa hỗ trợ lưu trạng thái Tiền mặt
        localStorage.setItem(`busgo_cash_ticket_${id}`, "true");
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
          <p className="text-on-surface-variant animate-pulse">Đang tải danh sách vé...</p>
        ) : tickets.length === 0 ? (
          <div className="bg-surface-container-lowest p-12 text-center rounded-2xl shadow-sm border border-surface-container">
             <span className="material-symbols-outlined text-6xl text-on-surface-variant mb-4">confirmation_number</span>
             <h2 className="text-xl font-bold text-on-surface mb-2">Chưa có vé nào</h2>
             <p className="text-on-surface-variant mb-6">Bạn chưa đặt chuyến xe nào cùng BusGo.</p>
             <button onClick={() => navigate("/")} className="bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-primary/90 transition-colors">Tìm chuyến ngay</button>
          </div>
        ) : (
          <div className="space-y-6">
            {tickets.map((t, idx) => {
               let currentStatus = String(t.status || 'pending').toUpperCase();
               const isCashDB = String(t.paymentMethod || t.paymentType || '').toUpperCase() === 'CASH';
               const isCashLocal = localStorage.getItem(`busgo_cash_ticket_${t.id}`) === "true" || localStorage.getItem(`busgo_cash_ticket_${t.bookingId}`) === "true";
               const isCash = isCashDB || isCashLocal;

               // Kế hoạch A: Ép vé Tiền mặt thành Đã thanh toán ảo ở giao diện
               if (isCash && (currentStatus === 'PENDING' || currentStatus === 'RESERVED')) {
                   currentStatus = 'FAKE_CASH_PAID';
               }

               const isPending = currentStatus === "PENDING" || currentStatus === "RESERVED";
               
               const statusLabelMap = {
                 'PENDING': 'Chờ thanh toán', 'RESERVED': 'Đã giữ chỗ',
                 'PAID': 'Đã thanh toán', 'COMPLETED': 'Hoàn thành',
                 'CANCELLED': 'Đã hủy', 'EXPIRED': 'Hết hạn',
                 'CHECKED_IN': 'Đã lên xe',
                 'FAKE_CASH_PAID': 'Thanh toán (Tiền mặt)'
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
                         <span className={`px-3 py-1 rounded-full text-xs font-bold ${currentStatus === 'COMPLETED' || currentStatus === 'PAID' || currentStatus === 'FAKE_CASH_PAID' ? 'bg-green-100 text-green-700' : currentStatus === 'CANCELLED' ? 'bg-red-100 text-red-700' : currentStatus === 'EXPIRED' ? 'bg-gray-200 text-gray-600' : 'bg-orange-100 text-orange-700'}`}>
                           {statusLabel}
                         </span>
                      </div>
                      <h3 className="font-bold text-lg">Loại hành trình: {t.bookingType === 'round_trip' ? 'Khứ hồi' : 'Một chiều'}</h3>
                      <p className="text-sm text-on-surface-variant"><span className="material-symbols-outlined text-[16px] align-text-bottom mr-1">calendar_month</span>Khởi hành: {t.departureDate ? new Date(t.departureDate).toLocaleString('vi-VN') : 'N/A'}</p>
                      
                       <p className="text-sm font-bold text-secondary">
                         Tổng tiền: {(t.totalAmount || 0).toLocaleString()}đ
                       </p>
                       
                       {(() => {
                         const rawTime = t.expiredAt || t.createdAt || t.created_at || t.createdDate || t.createAt || t.bookingDate || t.bookingTime || t.orderDate;
                         let baseTime = t.expiredAt ? t.expiredAt : (rawTime ? new Date(new Date(rawTime).getTime() + 10 * 60000).toISOString() : null);
                         const isCash = String(t.paymentMethod || t.paymentType || '').toUpperCase() === 'CASH';
                         
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
                           {(currentStatus === 'COMPLETED' || currentStatus === 'PAID' || currentStatus === 'CHECKED_IN' || currentStatus === 'FAKE_CASH_PAID') && (
                             isReviewExpired ? (
                               <div className="flex-1 md:flex-none bg-surface-container text-on-surface-variant px-6 py-2 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm cursor-not-allowed opacity-80" title="Đã quá hạn 7 ngày để đánh giá">
                                 <span className="material-symbols-outlined text-[18px]">history_toggle_off</span>
                                 Hết hạn ĐG
                               </div>
                             ) : (
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
                             )
                           )}
                           
                           {(currentStatus === 'CANCELLED' || currentStatus === 'EXPIRED') && (
                             <button 
                               onClick={() => setTicketToDelete(t.id)} 
                               className="flex-1 md:flex-none border border-red-200 text-red-500 hover:bg-red-50 transition-colors px-6 py-2 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm"
                             >
                               <span className="material-symbols-outlined text-[18px]">delete</span>
                               Xóa vé
                             </button>
                           )}
                         </>
                      )}
                   </div>
                 </div>
               )
            })}
          </div>
        )}
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