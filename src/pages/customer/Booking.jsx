import React, { useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import {
  createBooking,
  createPaymentMethod,
  getPaymentMethods,
  setDefaultPaymentMethod,
} from "../../api/customer";
import BookingSeatStep from "./BookingSeatStep";
import BookingCheckoutStep from "./BookingCheckoutStep";
import SelectPaymentCardModal from "../../components/payment/SelectPaymentCardModal";

const stripePublishableKey = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || "";
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;

export default function Booking() {
  const { tripId } = useParams(); // Note: This is actually scheduleId
  const navigate = useNavigate();
  const location = useLocation();
  
  const today = new Date().toISOString().split('T')[0];
  
  // Trạng thái quản lý luồng Booking
  const [step, setStep] = useState(1);
  const [bookingData, setBookingData] = useState({
    scheduleId: tripId,
    companyId: location.state?.companyId || location.state?.schedule?.companyId,
    date: location.state?.date || today,
    tripId: null, // Sẽ được lấy sau khi Prepare
    selectedSeats: [],
    pickupId: null,
    dropoffId: null,
    passengerInfo: { name: "", phone: "", email: "", note: "" },
    coupon: null,
    paymentMethod: "vnpay",
    totalPrice: 0
  });
  const [showCardModal, setShowCardModal] = useState(false);
  const [cards, setCards] = useState([]);
  const [loadingCards, setLoadingCards] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState(null);
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [processingCardPayment, setProcessingCardPayment] = useState(false);

  const performStripePayment = async (orderId, selectedPaymentMethodId = null) => {
    const paymentRes = await createPaymentMethod(orderId, "stripe");
    const clientSecret = paymentRes.data?.clientSecret;
    if (!clientSecret) {
      alert("Đặt vé thành công nhưng không nhận được clientSecret thanh toán thẻ.");
      navigate("/profile/tickets");
      return;
    }
    if (!stripePromise) {
      alert("Thiếu cấu hình Stripe key (REACT_APP_STRIPE_PUBLISHABLE_KEY).");
      navigate("/profile/tickets");
      return;
    }
    const stripe = await stripePromise;
    if (!stripe) {
      alert("Không thể khởi tạo Stripe.");
      navigate("/profile/tickets");
      return;
    }
    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: selectedPaymentMethodId || undefined,
    });
    if (error) {
      alert("Thanh toán thẻ thất bại: " + (error.message || "Unknown error"));
      navigate("/profile/tickets");
      return;
    }
    if (paymentIntent?.status === "succeeded") {
      alert("Thanh toán bằng thẻ thành công!");
    } else {
      alert(`Thanh toán trả về trạng thái: ${paymentIntent?.status || "unknown"}`);
    }
    navigate("/profile/tickets");
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
      navigate("/profile/tickets");
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
      await performStripePayment(pendingOrderId, paymentMethodId);
    } catch (err) {
      alert("Không thể đặt thẻ mặc định để thanh toán: " + (err.response?.data?.message || err.message));
      navigate("/profile/tickets");
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
      await performStripePayment(pendingOrderId, paymentMethodId);
    } catch (err) {
      alert("Không thể thanh toán bằng thẻ mới: " + (err.response?.data?.message || err.message));
      navigate("/profile/tickets");
    } finally {
      setProcessingCardPayment(false);
    }
  };

  const handleConfirmBooking = async () => {
    try {
      if (bookingData.selectedSeats.length === 0) {
        alert("Vui lòng chọn ít nhất 1 ghế.");
        return;
      }

      // Backend API booking thiết kế outBound chỉ nhận 1 seatId mỗi order.
      // Cần lặp từng ghế để giữ chỗ thành công đồng loạt
      const bookingPromises = bookingData.selectedSeats.map((seat) => {
        const payload = {
            type: "one_way",
            outBound: {
               tripId: Number(bookingData.tripId),
               seatId: Number(seat.id),
               fromStationId: Number(bookingData.pickupId),
               toStationId: Number(bookingData.dropoffId),
               companyId: Number(bookingData.companyId)
            }
        };
        
        if (bookingData.coupon?.id) {
            payload.couponId = Number(bookingData.coupon.id);
        }

        return createBooking(payload);
      });

      const bookingResponses = await Promise.all(bookingPromises);
      const orderIds = Array.from(
        new Set(
          bookingResponses
            .map((res) => {
              const data = res?.data || {};
              return data.bookingId || data.id || data.ticket?.bookingId || data.ticket?.id || null;
            })
            .filter(Boolean),
        ),
      );

      if (orderIds.length === 0) {
        alert("Đặt vé thành công! Bạn sẽ được chuyển sang trang quản lý vé.");
        navigate("/profile/tickets");
        return;
      }

      if (bookingData.paymentMethod === "stripe") {
        await openCardPaymentModal(orderIds[0]);
        return;
      }

      const paymentRes = await createPaymentMethod(orderIds[0], bookingData.paymentMethod || "vnpay");

      if (bookingData.paymentMethod === "vnpay") {
        const url =
          paymentRes.data?.paymentUrl ||
          paymentRes.data?.url ||
          (typeof paymentRes.data === "string" ? paymentRes.data : null);
        if (url) {
          window.location.href = url;
          return;
        }
      }

      if (bookingData.paymentMethod === "cash") {
        alert(
          paymentRes.data?.message ||
            "Đặt vé thành công! Đã ghi nhận thanh toán tiền mặt. Vui lòng thanh toán tại quầy trước giờ xuất bến.",
        );
        navigate("/profile/tickets");
        return;
      }

      alert("Đặt vé thành công! Bạn sẽ được chuyển sang trang quản lý vé.");
      navigate("/profile/tickets");
    } catch (err) {
      console.error("Booking Error:", err);
      // Hiển thị mảng validation lỗi của backend nếu có
      if (err.response?.data?.issues) {
         const msgs = err.response.data.issues.map(i => `${i.field}: ${i.reason}`).join(" | ");
         alert("Đặt vé thất bại! Lỗi cấu trúc: " + msgs);
      } else {
         alert("Đặt vé thất bại! " + (err.response?.data?.message || err.message));
      }
    }
  };

  return (
    <div className="bg-surface min-h-screen text-on-surface">
      {/* Main Content Area */}
      <main className="pt-24 pb-20 max-w-7xl mx-auto px-6">
          {step === 1 && (
            <BookingSeatStep 
              bookingData={bookingData} 
              setBookingData={setBookingData} 
              onNext={() => setStep(2)} 
            />
          )}

          {step === 2 && (
            <BookingCheckoutStep 
              bookingData={bookingData} 
              setBookingData={setBookingData} 
              onBack={() => setStep(1)}
              onConfirm={handleConfirmBooking}
            />
          )}
      </main>
      <SelectPaymentCardModal
        open={showCardModal}
        onClose={() => {
          if (processingCardPayment) return;
          setShowCardModal(false);
          navigate("/profile/tickets");
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