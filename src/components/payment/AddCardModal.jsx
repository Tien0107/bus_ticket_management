import React from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import AddCardStripeForm from "./AddCardStripeForm";

const stripePublishableKey = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || "";
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;

export default function AddCardModal({ open, onClose, onAdded }) {
  if (!open) return null;

  const hasStripeKey = Boolean(stripePublishableKey);

  return (
    <div className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-[1px] px-4 flex items-center justify-center">
      <div className="w-full max-w-lg bg-white rounded-3xl border border-outline-variant/20 shadow-xl p-6 md:p-8">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h3 className="text-xl font-black text-on-surface">Thêm thẻ thanh toán</h3>
            <p className="text-sm text-on-surface-variant mt-1">
              Liên kết thẻ mới với tài khoản BusGo của bạn.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-surface-container-low hover:bg-surface-container transition-colors flex items-center justify-center"
            aria-label="Đóng"
          >
            <span className="material-symbols-outlined text-on-surface">close</span>
          </button>
        </div>

        {!hasStripeKey ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 text-red-700 p-4 text-sm font-medium">
            Thiếu cấu hình cổng thanh toán thẻ. Vui lòng thêm biến môi trường
            <span className="font-bold"> REACT_APP_STRIPE_PUBLISHABLE_KEY</span>.
          </div>
        ) : (
          <Elements stripe={stripePromise}>
            <AddCardStripeForm onClose={onClose} onAdded={onAdded} />
          </Elements>
        )}
      </div>
    </div>
  );
}
