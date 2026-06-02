import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { handleStripeConnectCallback } from "../../api/company";
import axiosClient from "../../api/axiosClient";
import { useToast } from "../../context/ToastContext";
import { getStoredUser, setStoredToken, setStoredUser } from "../../utils/authStorage";

const STRIPE_CONNECT_STARTED_KEY = "busgoStripeConnectStarted";

const markStripeConnectStarted = (accountId) => {
  sessionStorage.setItem(STRIPE_CONNECT_STARTED_KEY, "true");

  if (!accountId) return;

  const user = getStoredUser();
  setStoredUser({ ...user, accountStripeId: accountId });
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
      const urlParams = new URLSearchParams(window.location.search);
      const urlStatus = urlParams.get("status");
      const isPreConfirmedSuccess = urlStatus === "success";

      // If backend already processed and redirected with status=success, we can short-circuit to nice UI
      // but still attempt the callback endpoint (it may be idempotent or just confirm)
      try {
        const response = await handleStripeConnectCallback(window.location.search);
        const data = response.data || {};
        const message = data.message || (isPreConfirmedSuccess ? "Liên kết Stripe đã thành công." : "Liên kết Stripe đã được cập nhật thành công.");
        const nextToken = data.token;
        if (nextToken) {
          setStoredToken(nextToken);
          axiosClient.defaults.headers.common.Authorization = `Bearer ${nextToken}`;
        }
        markStripeConnectStarted(data.accountStripeId || data.stripeAccountId);
        if (data.user) {
          setStoredUser(data.user);
        }

        if (!isMounted) return;
        setState({ status: "success", message });
        addToast(message, "success");

        redirectTimer = setTimeout(() => {
          navigate("/company/dashboard", { replace: true });
        }, 2600);
      } catch (err) {
        const fallbackMessage = err.response?.data?.message || "Không thể hoàn tất liên kết Stripe.";

        if (!isMounted) return;

        if (isPreConfirmedSuccess) {
          // Backend redirected us here as success -> show success UI even if the confirm call "failed" (e.g. already processed)
          const successMsg = "Liên kết Stripe thành công.";
          setState({ status: "success", message: successMsg });
          addToast(successMsg, "success");
          markStripeConnectStarted(); // at least mark it started
          redirectTimer = setTimeout(() => {
            navigate("/company/payments", { replace: true });
          }, 2600);
        } else {
          setState({ status: "error", message: fallbackMessage });
          addToast(fallbackMessage, "error");
        }
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
  const isLoading = state.status === "loading";

  // Read hints from URL (e.g. status=success&provider=stripe)
  const urlParams = new URLSearchParams(window.location.search);
  const urlStatus = urlParams.get("status");
  const urlProvider = urlParams.get("provider") || "stripe";
  const displayProvider = urlProvider === "stripe" ? "Stripe" : urlProvider;

  const handleGoToDashboard = () => {
    navigate("/company/dashboard");
  };

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface via-surface-container-low to-surface-dim flex flex-col justify-center items-center px-4 py-16 relative overflow-hidden font-body">
      {/* Decorative background glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] rounded-full bg-primary/5 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[35rem] h-[35rem] rounded-full bg-emerald-500/5 blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-lg bg-surface-container-lowest/80 backdrop-blur-md rounded-3xl p-6 md:p-8 border border-white/50 shadow-editorial text-center transition-all duration-500 scale-100 animate-fade-in relative z-10">
        
        {/* Icon */}
        <div className="flex justify-center mb-6">
          {isSuccess ? (
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-emerald-500/10 animate-ping duration-1000 scale-150"></div>
              <div className="absolute inset-[-8px] rounded-full bg-emerald-500/20 blur-md"></div>
              <div className="relative w-24 h-24 rounded-full bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-600/30">
                <span className="material-symbols-outlined text-[48px] animate-scale-up font-bold">
                  check_circle
                </span>
              </div>
            </div>
          ) : isError ? (
            <div className="relative">
              <div className="absolute inset-[-8px] rounded-full bg-red-500/20 blur-md"></div>
              <div className="relative w-24 h-24 rounded-full bg-red-600 flex items-center justify-center text-white shadow-lg shadow-red-600/30 animate-shake">
                <span className="material-symbols-outlined text-[48px] font-bold">
                  error
                </span>
              </div>
            </div>
          ) : (
            <div className="relative">
              <div className="absolute inset-[-6px] rounded-full bg-primary/20 blur-md"></div>
              <div className="relative w-24 h-24 rounded-full bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/30">
                <span className="material-symbols-outlined text-[42px] animate-spin font-bold" style={{ animationDuration: "1.2s" }}>
                  progress_activity
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Title */}
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-2">
          {isSuccess ? (
            <span className="text-emerald-700 bg-gradient-to-r from-emerald-600 to-emerald-700 bg-clip-text text-transparent">
              Liên kết Stripe thành công!
            </span>
          ) : isError ? (
            <span className="text-red-600">Kết nối Stripe thất bại</span>
          ) : (
            <span className="text-on-surface">Đang xử lý liên kết Stripe</span>
          )}
        </h1>

        <p className="text-on-surface-variant text-sm md:text-base font-medium mb-6 max-w-sm mx-auto">
          {isSuccess
            ? "Chúc mừng! Tài khoản Stripe của công ty bạn đã được kết nối thành công. Bạn có thể nhận thanh toán từ khách hàng và thực hiện rút tiền."
            : isError
            ? "Đã xảy ra lỗi trong quá trình liên kết. Vui lòng thử lại hoặc liên hệ hỗ trợ."
            : "Hệ thống đang hoàn tất quá trình liên kết với Stripe. Vui lòng đợi trong giây lát..."}
        </p>

        {/* Details card */}
        <div className="bg-surface rounded-2xl p-4 border border-surface-container-high/60 text-left space-y-3 mb-6">
          <h3 className="text-xs font-bold text-on-surface-variant/70 uppercase tracking-widest border-b border-surface-container-high pb-2">
            Chi tiết kết nối
          </h3>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-on-surface-variant font-medium">Trạng thái</span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  isSuccess
                    ? "bg-emerald-100 text-emerald-700"
                    : isError
                    ? "bg-red-100 text-red-700"
                    : "bg-primary/10 text-primary"
                }`}
              >
                {isSuccess ? "Thành công" : isError ? "Thất bại" : "Đang xử lý"}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-on-surface-variant font-medium">Nhà cung cấp</span>
              <span className="font-bold text-on-surface flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px] text-[#635bff]">payments</span>
                {displayProvider}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-on-surface-variant font-medium">Thời gian</span>
              <span className="text-on-surface font-semibold">
                {new Date().toLocaleString("vi-VN", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
              </span>
            </div>

            {state.message && (
              <div className="pt-2 border-t border-dashed border-surface-container-high">
                <span className="text-on-surface-variant font-medium text-xs block mb-1">Thông báo</span>
                <p className="text-sm text-on-surface font-semibold leading-relaxed">
                  {state.message}
                </p>
              </div>
            )}

            {urlStatus && urlStatus !== "success" && (
              <div className="pt-1">
                <span className="inline-block text-[10px] font-mono bg-surface-container-high px-2 py-0.5 rounded text-on-surface-variant/80">
                  status={urlStatus}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 justify-center items-center">
          {isSuccess ? (
            <button
              onClick={handleGoToDashboard}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-6 rounded-2xl shadow-md shadow-emerald-600/20 hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">dashboard</span>
              <span>Về Dashboard</span>
            </button>
          ) : isError ? (
            <>
              <button
                onClick={handleRetry}
                className="w-full sm:flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 px-6 rounded-2xl shadow-md shadow-red-600/20 hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">refresh</span>
                <span>Thử lại</span>
              </button>
              <Link
                to="/company/dashboard"
                className="w-full sm:flex-1 inline-flex items-center justify-center bg-surface-container-highest hover:bg-outline-variant/50 text-on-surface font-bold py-3.5 px-6 rounded-2xl border border-surface-container-high transition-all duration-200 gap-2"
              >
                <span className="material-symbols-outlined text-lg">dashboard</span>
                <span>Về Dashboard</span>
              </Link>
            </>
          ) : (
            <div className="w-full flex items-center justify-center gap-3 text-on-surface-variant text-sm font-medium py-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
              Đang hoàn tất...
            </div>
          )}
        </div>

        {isSuccess && (
          <p className="mt-6 text-[11px] text-on-surface-variant/60">
            Tự động chuyển về Dashboard sau vài giây...
          </p>
        )}
      </div>
    </div>
  );
}
