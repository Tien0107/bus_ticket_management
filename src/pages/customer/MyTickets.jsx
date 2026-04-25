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

const stripePublishableKey = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || "";
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;

export default function MyTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const [cards, setCards] = useState([]);
  const [loadingCards, setLoadingCards] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState(null);
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [processingCardPayment, setProcessingCardPayment] = useState(false);
  const navigate = useNavigate();

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await getMyTickets();
      setTickets(res.data?.tickets || res.data || []);
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
  }, []);

  const handleCancel = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn hủy vé này?")) return;
    try {
      await cancelTicket(id);
      alert("Hủy vé thành công!");
      fetchTickets();
    } catch (err) {
      alert("Hủy vé thất bại: " + (err.response?.data?.message || err.message));
    }
  };

  const handlePayment = async (id, method, selectedPaymentMethodId = null) => {
    try {
      const res = await createPaymentMethod(id, method);
      
      if (method === "vnpay") {
        const url = res.data?.paymentUrl || res.data?.url || (typeof res.data === 'string' ? res.data : null);
        if (url) {
           window.location.href = url;
        } else {
           alert("Lỗi: Không nhận được URL thanh toán từ Backend. " + JSON.stringify(res.data));
        }
      } else if (method === "stripe") {
        const clientSecret = res.data?.clientSecret;
        const paymentIntentId = res.data?.paymentIntentId;

        if (!clientSecret) {
          alert("Không nhận được clientSecret từ backend để thanh toán Stripe.");
          return;
        }
        if (!stripePromise) {
          alert("Thiếu cấu hình Stripe key (REACT_APP_STRIPE_PUBLISHABLE_KEY).");
          return;
        }

        const stripe = await stripePromise;
        if (!stripe) {
          alert("Không thể khởi tạo Stripe.");
          return;
        }

        const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
          payment_method: selectedPaymentMethodId || undefined,
        });
        if (error) {
          alert("Thanh toán Stripe thất bại: " + (error.message || "Unknown error"));
          return;
        }

        const paidIntentId = paymentIntent?.id || paymentIntentId;
        if (paymentIntent?.status === "succeeded") {
          alert(`Thanh toán thành công! ${paidIntentId ? `(PI: ${paidIntentId})` : ""}`);
          fetchTickets();
          return;
        }
        fetchTickets();
      } else if (method === "cash") {
        alert(res.data?.message || "Đã ghi nhận yêu cầu thanh toán Tiền mặt! Vui lòng thanh toán tại quầy trước giờ xuất bến.");
        fetchTickets();
      }
      
    } catch (err) {
      alert("Lỗi gọi thanh toán: " + (err.response?.data?.message || err.message));
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
      alert("Không thể tải danh sách thẻ: " + (err.response?.data?.message || err.message));
    } finally {
      setLoadingCards(false);
    }
  };

  const handleSelectCardAndPay = async (card) => {
    try {
      setProcessingCardPayment(true);
      const paymentMethodId = card?.stripePaymentMethodId || card?.id;
      if (!paymentMethodId || !pendingOrderId) {
        alert("Thiếu thông tin thẻ hoặc đơn hàng.");
        return;
      }

      await setDefaultPaymentMethod(paymentMethodId);
      setShowCardModal(false);
      await handlePayment(pendingOrderId, "stripe", paymentMethodId);
    } catch (err) {
      alert("Không thể đặt thẻ mặc định để thanh toán: " + (err.response?.data?.message || err.message));
    } finally {
      setProcessingCardPayment(false);
    }
  };

  const handlePayWithNewCard = async (paymentMethodId) => {
    try {
      setProcessingCardPayment(true);
      if (!paymentMethodId || !pendingOrderId) {
        alert("Thiếu thông tin thẻ hoặc đơn hàng.");
        return;
      }
      setShowCardModal(false);
      await handlePayment(pendingOrderId, "stripe", paymentMethodId);
    } catch (err) {
      alert("Không thể thanh toán bằng thẻ mới: " + (err.response?.data?.message || err.message));
    } finally {
      setProcessingCardPayment(false);
    }
  };

  return (
    <div className="bg-surface min-h-screen pt-10 pb-12 px-6">
      <div className="max-w-4xl mx-auto">
        <CustomerProfileSectionHeader title="Vé đã đặt" />
        
        <CustomerProfileNav />

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
               const currentStatus = String(t.status || 'pending').toUpperCase();
               const isPending = currentStatus === "PENDING" || currentStatus === "RESERVED";
               
               const statusLabelMap = {
                 'PENDING': 'Chờ thanh toán', 'RESERVED': 'Đã giữ chỗ',
                 'PAID': 'Đã thanh toán', 'COMPLETED': 'Hoàn thành',
                 'CANCELLED': 'Đã hủy', 'EXPIRED': 'Hết hạn',
                 'CHECKED_IN': 'Đã lên xe'
               };
               const statusLabel = statusLabelMap[currentStatus] || currentStatus;
               
               return (
                 <div key={idx} className="bg-white border rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                   <div className="space-y-2">
                      <div className="flex items-center gap-3">
                         <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold border border-primary/20">Mã vé: #{t.id} {t.bookingId ? `(Order #${t.bookingId})` : ''}</span>
                         <span className={`px-3 py-1 rounded-full text-xs font-bold ${currentStatus === 'COMPLETED' || currentStatus === 'PAID' ? 'bg-green-100 text-green-700' : currentStatus === 'CANCELLED' ? 'bg-red-100 text-red-700' : currentStatus === 'EXPIRED' ? 'bg-gray-200 text-gray-600' : 'bg-orange-100 text-orange-700'}`}>
                           {statusLabel}
                         </span>
                      </div>
                      <h3 className="font-bold text-lg">Loại hành trình: {t.bookingType === 'round_trip' ? 'Khứ hồi' : 'Một chiều'}</h3>
                      <p className="text-sm text-on-surface-variant"><span className="material-symbols-outlined text-[16px] align-text-bottom mr-1">calendar_month</span>Khởi hành: {t.departureDate ? new Date(t.departureDate).toLocaleString('vi-VN') : 'N/A'}</p>
                      
                      <p className="text-sm font-bold text-secondary">
                        Tổng tiền: {(t.totalAmount || 0).toLocaleString()}đ
                      </p>
                      
                      {t.expiredAt && isPending && (
                         <p className="text-xs text-red-500 font-medium">Hết hạn thanh toán: {new Date(t.expiredAt).toLocaleString('vi-VN')}</p>
                      )}
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
                         <button onClick={() => navigate(`/my-tickets/${t.id}`)} className="flex-1 md:flex-none border border-primary text-primary hover:bg-primary hover:text-white transition-colors px-6 py-2 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm">
                           Xem vé
                         </button>
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
    </div>
  );
}