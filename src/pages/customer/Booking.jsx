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
import ReturnTripSelection from "./ReturnTripSelection";
import { useToast } from "../../context/ToastContext";

const stripePublishableKey = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || "";
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;

export default function Booking() {
  const { tripId } = useParams(); // Note: This is actually scheduleId
  const navigate = useNavigate();
  const location = useLocation();
  const { addToast } = useToast();
  
  const today = new Date().toISOString().split('T')[0];
  
  // Trạng thái quản lý luồng Booking
  const [step, setStep] = useState(1);
  const [isRoundTrip, setIsRoundTrip] = useState(location.state?.isRoundTrip || false);
  const [bookingPhase, setBookingPhase] = useState("outbound"); // "outbound" | "return"
  const [bookingData, setBookingData] = useState({
    scheduleId: tripId,
    companyId: location.state?.companyId || location.state?.schedule?.companyId,
    date: location.state?.date || today,
    returnDate: location.state?.returnDate || "",
    tripId: null, // Sẽ được lấy sau khi Prepare
    selectedSeats: [],
    pickupId: null,
    dropoffId: null,
    passengerInfo: { name: "", phone: "", email: "", note: "" },
    coupon: null,
    paymentMethod: "vnpay",
    totalPrice: 0,
    schedule: location.state?.schedule || {} // Lưu lại để dùng cho chuyến đi
  });
  const [returnBookingData, setReturnBookingData] = useState(null);
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
      addToast("Đặt vé thành công nhưng không nhận được clientSecret thanh toán thẻ.");
      navigate("/profile/tickets");
      return;
    }
    if (!stripePromise) {
      addToast("Thiếu cấu hình Stripe key (REACT_APP_STRIPE_PUBLISHABLE_KEY).");
      navigate("/profile/tickets");
      return;
    }
    const stripe = await stripePromise;
    if (!stripe) {
      addToast("Không thể khởi tạo Stripe.");
      navigate("/profile/tickets");
      return;
    }
    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: selectedPaymentMethodId || undefined,
    });
    if (error) {
      addToast("Thanh toán thẻ thất bại: " + (error.message || "Unknown error"));
      navigate("/profile/tickets");
      return;
    }
    if (paymentIntent?.status === "succeeded") {
      addToast("Thanh toán bằng thẻ thành công!");
    } else {
      addToast(`Thanh toán trả về trạng thái: ${paymentIntent?.status || "unknown"}`);
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
      addToast("Không thể tải danh sách thẻ: " + (err.response?.data?.message || err.message));
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
        addToast("Thiếu thông tin thẻ hoặc đơn hàng.");
        return;
      }
      await setDefaultPaymentMethod(paymentMethodId);
      setShowCardModal(false);
      await performStripePayment(pendingOrderId, paymentMethodId);
    } catch (err) {
      addToast("Không thể đặt thẻ mặc định để thanh toán: " + (err.response?.data?.message || err.message));
      navigate("/profile/tickets");
    } finally {
      setProcessingCardPayment(false);
    }
  };

  const handlePayWithNewCard = async (paymentMethodId) => {
    try {
      setProcessingCardPayment(true);
      if (!paymentMethodId || !pendingOrderId) {
        addToast("Thiếu thông tin thẻ hoặc đơn hàng.");
        return;
      }
      setShowCardModal(false);
      await performStripePayment(pendingOrderId, paymentMethodId);
    } catch (err) {
      addToast("Không thể thanh toán bằng thẻ mới: " + (err.response?.data?.message || err.message));
      navigate("/profile/tickets");
    } finally {
      setProcessingCardPayment(false);
    }
  };

  const [orderIds, setOrderIds] = useState([]);

  const handleProceedToCheckout = async () => {
    try {
      if (bookingData.selectedSeats.length === 0) {
        addToast("Vui lòng chọn ít nhất 1 ghế chiều đi.", "error");
        return false;
      }
      if (isRoundTrip && (!returnBookingData || returnBookingData.selectedSeats.length === 0)) {
        addToast("Vui lòng chọn ít nhất 1 ghế chiều về.", "error");
        return false;
      }

      const bookingPromises = bookingData.selectedSeats.map((seat, index) => {
        const payload = {
            type: isRoundTrip ? "round_trip" : "one_way",
            outBound: {
               tripId: Number(bookingData.tripId),
               seatId: Number(seat.id),
               fromStationId: Number(bookingData.pickupId),
               toStationId: Number(bookingData.dropoffId),
               companyId: Number(bookingData.companyId)
            }
        };
        
        if (isRoundTrip && returnBookingData && returnBookingData.selectedSeats[index]) {
            payload.returnBound = {
               tripId: Number(returnBookingData.tripId),
               seatId: Number(returnBookingData.selectedSeats[index].id),
               fromStationId: Number(returnBookingData.pickupId),
               toStationId: Number(returnBookingData.dropoffId),
               companyId: Number(returnBookingData.companyId)
            };
        }
        
        if (bookingData.coupon?.id) {
            payload.couponId = Number(bookingData.coupon.id);
        }

        return createBooking(payload);
      });

      const bookingResponses = await Promise.all(bookingPromises);
      const generatedOrderIds = Array.from(
        new Set(
          bookingResponses
            .map((res) => {
              const data = res?.data || {};
              return data.bookingId || data.id || data.ticket?.bookingId || data.ticket?.id || null;
            })
            .filter(Boolean),
        ),
      );

      if (generatedOrderIds.length === 0) {
        addToast("Lỗi: Không thể lấy mã đơn hàng từ Backend.");
        return false;
      }

      setOrderIds(generatedOrderIds);
      setStep(2);
      return true;
    } catch (err) {
      console.error("Booking Error:", err);
      if (err.response?.data?.issues) {
         const msgs = err.response.data.issues.map(i => `${i.field}: ${i.reason}`).join(" | ");
         addToast("Lỗi khi giữ chỗ! " + msgs);
      } else {
         addToast("Lỗi khi giữ chỗ! " + (err.response?.data?.message || err.message));
      }
      return false;
    }
  };

  const handleProcessPayment = async () => {
    try {
      if (orderIds.length === 0) {
        addToast("Chưa có mã vé. Vui lòng quay lại chọn ghế.");
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
        addToast(
          paymentRes.data?.message ||
            "Đặt vé thành công! Đã ghi nhận thanh toán tiền mặt. Vui lòng thanh toán tại quầy trước giờ xuất bến.",
        );
        navigate("/profile/tickets");
        return;
      }

      addToast("Thanh toán thành công! Bạn sẽ được chuyển sang trang quản lý vé.");
      navigate("/profile/tickets");
    } catch (err) {
      console.error("Payment Error:", err);
      addToast("Lỗi khởi tạo thanh toán: " + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="bg-surface min-h-screen text-on-surface">
      {/* Main Content Area */}
      <main className="pt-24 pb-20 max-w-7xl mx-auto px-6">
          {step === 1 && bookingPhase !== "returnSelection" && (
            <BookingSeatStep 
              bookingData={bookingPhase === "outbound" ? bookingData : returnBookingData} 
              setBookingData={bookingPhase === "outbound" ? setBookingData : setReturnBookingData} 
              onNext={() => {
                if (isRoundTrip && bookingPhase === "outbound") {
                  setBookingPhase("returnSelection");
                } else {
                  return handleProceedToCheckout();
                }
              }} 
              isRoundTrip={isRoundTrip}
              setIsRoundTrip={setIsRoundTrip}
              bookingPhase={bookingPhase}
              setBookingPhase={setBookingPhase}
              returnBookingData={returnBookingData}
              setReturnBookingData={setReturnBookingData}
              outboundData={bookingData} // To access outbound locations for return trip
            />
          )}

          {step === 1 && bookingPhase === "returnSelection" && (
             <ReturnTripSelection
               outboundData={bookingData}
               setReturnBookingData={setReturnBookingData}
               setBookingPhase={setBookingPhase}
               onCancel={() => {
                 setIsRoundTrip(false);
                 setBookingPhase("outbound");
               }}
             />
          )}

          {step === 2 && (
            <BookingCheckoutStep 
              bookingData={bookingData} 
              returnBookingData={returnBookingData}
              isRoundTrip={isRoundTrip}
              setBookingData={setBookingData} 
              onBack={() => setStep(1)}
              onConfirm={handleProcessPayment}
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