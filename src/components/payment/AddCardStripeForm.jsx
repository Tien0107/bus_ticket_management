import React, { useState } from "react";
import {
  CardCvcElement,
  CardExpiryElement,
  CardNumberElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { addPaymentMethod, createSetupIntent, setDefaultPaymentMethod } from "../../api/customer";

const baseStripeStyle = {
  color: "#1f2937",
  fontFamily: "\"Be Vietnam Pro\", sans-serif",
  fontSize: "16px",
  "::placeholder": {
    color: "#9ca3af",
  },
};

const sharedElementOptions = {
  style: {
    base: baseStripeStyle,
    invalid: {
      color: "#dc2626",
    },
  },
};

export default function AddCardStripeForm({ onClose, onAdded }) {
  const stripe = useStripe();
  const elements = useElements();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    try {
      setSubmitting(true);
      setError("");

      const setupIntentRes = await createSetupIntent();
      const clientSecret = setupIntentRes.data?.clientSecret;
      if (!clientSecret) {
        setError("Không nhận được clientSecret từ hệ thống.");
        return;
      }

      const cardNumberElement = elements.getElement(CardNumberElement);
      if (!cardNumberElement) {
        setError("Không thể khởi tạo form thẻ.");
        return;
      }

      const { error: confirmError, setupIntent } = await stripe.confirmCardSetup(clientSecret, {
        payment_method: {
          card: cardNumberElement,
        },
      });

      if (confirmError) {
        setError(confirmError.message || "Xác thực thẻ thất bại.");
        return;
      }

      const paymentMethodId =
        setupIntent?.payment_method && typeof setupIntent.payment_method === "string"
          ? setupIntent.payment_method
          : null;

      if (!paymentMethodId) {
        setError("Không lấy được paymentMethodId từ Stripe.");
        return;
      }

      await addPaymentMethod(paymentMethodId);
      await setDefaultPaymentMethod(paymentMethodId);
      await onAdded?.(paymentMethodId);
      onClose?.();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Không thể thêm thẻ.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-low px-4 py-4">
        <label className="text-xs uppercase tracking-wide text-on-surface-variant font-semibold block mb-2">
          Số thẻ
        </label>
        <CardNumberElement options={sharedElementOptions} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-low px-4 py-4">
          <label className="text-xs uppercase tracking-wide text-on-surface-variant font-semibold block mb-2">
            Ngày hết hạn
          </label>
          <CardExpiryElement options={sharedElementOptions} />
        </div>
        <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-low px-4 py-4">
          <label className="text-xs uppercase tracking-wide text-on-surface-variant font-semibold block mb-2">
            CVC
          </label>
          <CardCvcElement options={sharedElementOptions} />
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm">
          {error}
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={submitting || !stripe}
          className="flex-1 rounded-xl bg-primary text-white px-4 py-3 font-bold hover:bg-primary/90 transition-colors disabled:opacity-60"
        >
          {submitting ? "Đang xử lý..." : "Lưu thẻ"}
        </button>
        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          className="flex-1 rounded-xl bg-surface-container-low text-on-surface px-4 py-3 font-bold hover:bg-surface-container transition-colors disabled:opacity-60"
        >
          Hủy
        </button>
      </div>
    </form>
  );
}
