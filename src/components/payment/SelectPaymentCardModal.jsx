import React, { useState } from "react";
import {
  CardCvcElement,
  CardExpiryElement,
  CardNumberElement,
  Elements,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

const normalizeBrand = (brand) => {
  const value = String(brand || "CARD").toLowerCase();
  if (value === "mastercard") return "Mastercard";
  if (value === "visa") return "VISA";
  if (value === "amex") return "American Express";
  return value.toUpperCase();
};

const getPaymentMethodIdentifier = (method) => {
  return method?.stripePaymentMethodId || method?.id;
};

const stripePublishableKey = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || "";
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;

const sharedElementOptions = {
  style: {
    base: {
      color: "#1f2937",
      fontFamily: "\"Be Vietnam Pro\", sans-serif",
      fontSize: "15px",
      "::placeholder": {
        color: "#9ca3af",
      },
    },
    invalid: {
      color: "#dc2626",
    },
  },
};

function NewCardPaymentForm({ onContinueWithPaymentMethodId, continuing }) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState("");
  const [resetVersion, setResetVersion] = useState(0);

  const handlePayWithNewCard = async () => {
    if (!stripe || !elements) return;
    const cardNumberElement = elements.getElement(CardNumberElement);
    if (!cardNumberElement) {
      setError("Không thể khởi tạo thông tin thẻ.");
      return;
    }

    setError("");
    const { error: createError, paymentMethod } = await stripe.createPaymentMethod({
      type: "card",
      card: cardNumberElement,
    });

    if (createError || !paymentMethod?.id) {
      setError(createError?.message || "Không thể tạo payment method từ thẻ mới.");
      return;
    }
    onContinueWithPaymentMethodId?.(paymentMethod.id);
  };

  return (
    <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4 space-y-3">
      <p className="text-sm font-bold text-on-surface">Hoặc nhập thẻ mới để thanh toán ngay</p>
      <p className="text-xs text-on-surface-variant">
        Bạn có thể nhập lại hoặc sửa trực tiếp thông tin thẻ trước khi thanh toán.
      </p>
      <div className="rounded-xl border border-outline-variant/30 bg-white px-3 py-3">
        <CardNumberElement key={`number-${resetVersion}`} options={sharedElementOptions} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-outline-variant/30 bg-white px-3 py-3">
          <CardExpiryElement key={`expiry-${resetVersion}`} options={sharedElementOptions} />
        </div>
        <div className="rounded-xl border border-outline-variant/30 bg-white px-3 py-3">
          <CardCvcElement key={`cvc-${resetVersion}`} options={sharedElementOptions} />
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex items-center gap-3">
        <button
          onClick={handlePayWithNewCard}
          disabled={continuing || !stripe}
          className="flex-1 bg-primary text-white rounded-xl px-4 py-3 font-bold hover:bg-primary/90 transition-colors disabled:opacity-60"
        >
          {continuing ? "Đang xử lý..." : "Thanh toán với thẻ mới"}
        </button>
        <button
          onClick={() => {
            setError("");
            setResetVersion((prev) => prev + 1);
          }}
          disabled={continuing}
          className="px-4 py-3 rounded-xl font-semibold bg-white text-on-surface border border-outline-variant/30 hover:bg-surface-container-low transition-colors disabled:opacity-60"
        >
          Nhập lại
        </button>
      </div>
    </div>
  );
}

export default function SelectPaymentCardModal({
  open,
  onClose,
  cards,
  loading,
  selectedCardId,
  onChangeSelectedCard,
  onContinueWithSelected,
  onContinueWithPaymentMethodId,
  onGoToManageCards,
  continuing = false,
}) {
  const [showNewCardForm, setShowNewCardForm] = useState(false);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] bg-black/40 px-4 flex items-center justify-center">
      <div className="w-full max-w-xl bg-white rounded-3xl border border-outline-variant/20 shadow-xl p-6">
        <div className="flex items-start justify-between gap-3 mb-5">
          <div>
            <h3 className="text-xl font-black text-on-surface">Thanh toán bằng thẻ</h3>
            <p className="text-sm text-on-surface-variant mt-1">
              Chọn thẻ đã lưu để thực hiện thanh toán.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-surface-container-low hover:bg-surface-container transition-colors flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-on-surface">close</span>
          </button>
        </div>

        {loading ? (
          <p className="text-on-surface-variant animate-pulse">Đang tải danh sách thẻ...</p>
        ) : cards.length === 0 ? (
          <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-5 text-center">
            <p className="font-semibold text-on-surface mb-2">Bạn chưa có thẻ nào.</p>
            <p className="text-sm text-on-surface-variant mb-4">
              Bạn có thể nhập thẻ mới trực tiếp để thanh toán ngay.
            </p>
            {stripePromise ? (
              <Elements stripe={stripePromise}>
                <NewCardPaymentForm
                  onContinueWithPaymentMethodId={onContinueWithPaymentMethodId}
                  continuing={continuing}
                />
              </Elements>
            ) : (
              <button
                onClick={onGoToManageCards}
                className="bg-primary text-white px-4 py-2 rounded-xl font-bold hover:bg-primary/90 transition-colors"
              >
                Đi tới quản lý thẻ
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {cards.map((card) => (
              <button
                key={getPaymentMethodIdentifier(card)}
                onClick={() => onChangeSelectedCard?.(card)}
                className={`w-full text-left rounded-2xl border transition-all px-4 py-4 ${
                  selectedCardId === getPaymentMethodIdentifier(card)
                    ? "border-primary bg-primary/5"
                    : "border-outline-variant/20 bg-surface-container-low hover:border-primary/30 hover:bg-primary/5"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary text-lg">
                      {selectedCardId === getPaymentMethodIdentifier(card)
                        ? "radio_button_checked"
                        : "radio_button_unchecked"}
                    </span>
                    <div>
                    <p className="font-bold text-on-surface">
                      {normalizeBrand(card.brand)} •••• {card.last4 || "****"}
                    </p>
                    <p className="text-sm text-on-surface-variant mt-1">
                      HSD: {(card.expMonth || 0).toString().padStart(2, "0")}/{(card.expYear || 0)
                        .toString()
                        .slice(-2)}
                    </p>
                    </div>
                  </div>
                  {card.isDefault && (
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-primary text-white">
                      Mặc định
                    </span>
                  )}
                </div>
              </button>
            ))}
            <div className="pt-3 flex items-center gap-3">
              <button
                onClick={() => {
                  const chosen = cards.find(
                    (card) => getPaymentMethodIdentifier(card) === selectedCardId,
                  );
                  if (chosen) {
                    onContinueWithSelected?.(chosen);
                  } else if (cards[0] && onContinueWithSelected) {
                    onContinueWithSelected(cards[0]);
                  }
                }}
                disabled={continuing}
                className="flex-1 bg-primary text-white rounded-xl px-4 py-3 font-bold hover:bg-primary/90 transition-colors disabled:opacity-60"
              >
                {continuing ? "Đang thanh toán..." : "Tiếp tục thanh toán"}
              </button>
              <button
                onClick={onClose}
                disabled={continuing}
                className="px-4 py-3 rounded-xl font-semibold bg-surface-container-low text-on-surface hover:bg-surface-container transition-colors disabled:opacity-60"
              >
                Hủy
              </button>
            </div>
            <button
              onClick={() => setShowNewCardForm((prev) => !prev)}
              disabled={continuing}
              className="w-full text-sm font-bold text-primary bg-primary/5 hover:bg-primary/10 border border-primary/20 rounded-xl px-4 py-3 transition-colors disabled:opacity-60"
            >
              {showNewCardForm ? "Ẩn nhập thẻ khác" : "Thanh toán bằng thẻ khác"}
            </button>
            {showNewCardForm && stripePromise && (
              <Elements stripe={stripePromise}>
                <NewCardPaymentForm
                  onContinueWithPaymentMethodId={onContinueWithPaymentMethodId}
                  continuing={continuing}
                />
              </Elements>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
