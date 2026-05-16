import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { handleStripeConnectCallback } from "../../api/company";
import { useToast } from "../../context/ToastContext";

const STRIPE_CONNECT_STARTED_KEY = "busgoStripeConnectStarted";

const markStripeConnectStarted = (accountId) => {
  sessionStorage.setItem(STRIPE_CONNECT_STARTED_KEY, "true");

  if (!accountId) return;

  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    localStorage.setItem("user", JSON.stringify({ ...user, accountStripeId: accountId }));
  } catch {
    localStorage.setItem("user", JSON.stringify({ accountStripeId: accountId }));
  }
};

export default function StripeConnectCallback() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [state, setState] = useState({
    status: "loading",
    message: "Đang hoàn tất liên kết Stripe...",
  });

  useEffect(() => {
    let isMounted = true;
    let redirectTimer;

    const completeConnect = async () => {
      try {
        const response = await handleStripeConnectCallback(window.location.search);
        const message = response.data?.message || "Liên kết Stripe đã được cập nhật.";
        markStripeConnectStarted(response.data?.accountStripeId || response.data?.stripeAccountId);

        if (!isMounted) return;
        setState({ status: "success", message });
        addToast(message, "success");

        redirectTimer = setTimeout(() => {
          navigate("/company/payments", { replace: true });
        }, 1200);
      } catch (err) {
        const message = err.response?.data?.message || "Không thể hoàn tất liên kết Stripe.";

        if (!isMounted) return;
        setState({ status: "error", message });
        addToast(message, "error");
      }
    };

    completeConnect();

    return () => {
      isMounted = false;
      clearTimeout(redirectTimer);
    };
  }, [addToast, navigate]);

  const isSuccess = state.status === "success";
  const isError = state.status === "error";

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f6f8f5] px-5 py-8">
      <div className="w-full max-w-md rounded-xl border border-outline-variant/30 bg-white p-8 text-center shadow-sm">
        <div
          className={`mx-auto flex h-14 w-14 items-center justify-center rounded-lg ${
            isSuccess
              ? "bg-emerald-50 text-emerald-700"
              : isError
              ? "bg-red-50 text-red-700"
              : "bg-primary/10 text-primary"
          }`}
        >
          <span className="material-symbols-outlined text-3xl">
            {isSuccess ? "check_circle" : isError ? "error" : "progress_activity"}
          </span>
        </div>

        <h1 className="mt-5 text-2xl font-extrabold text-on-surface">
          {isSuccess ? "Stripe đã kết nối" : isError ? "Kết nối thất bại" : "Đang xử lý Stripe"}
        </h1>
        <p className="mt-3 text-sm leading-6 text-on-surface-variant">{state.message}</p>

        {state.status === "loading" && (
          <div className="mx-auto mt-6 h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
        )}

        {isError && (
          <div className="mt-6 flex flex-col gap-3">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-primary/90"
            >
              <span className="material-symbols-outlined text-[20px]">refresh</span>
              Thử lại
            </button>
            <Link
              to="/company/payments"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-outline-variant/60 bg-white px-4 py-3 text-sm font-bold text-on-surface transition-colors hover:bg-surface-container-low"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
              Về trang thanh toán
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
