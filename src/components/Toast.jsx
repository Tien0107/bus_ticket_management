import React from "react";
import { useToast } from "../context/ToastContext";

const toastStyles = {
  success: {
    title: "Thành công",
    icon: "check_circle",
    accent: "bg-emerald-500",
    iconWrap: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    border: "border-emerald-100",
    progress: "bg-emerald-500",
  },
  error: {
    title: "Có lỗi xảy ra",
    icon: "error",
    accent: "bg-red-500",
    iconWrap: "bg-red-50 text-red-700 ring-red-100",
    border: "border-red-100",
    progress: "bg-red-500",
  },
  warning: {
    title: "Cần kiểm tra",
    icon: "warning",
    accent: "bg-amber-500",
    iconWrap: "bg-amber-50 text-amber-700 ring-amber-100",
    border: "border-amber-100",
    progress: "bg-amber-500",
  },
  info: {
    title: "Thông báo",
    icon: "info",
    accent: "bg-sky-500",
    iconWrap: "bg-sky-50 text-sky-700 ring-sky-100",
    border: "border-sky-100",
    progress: "bg-sky-500",
  },
};

const Toast = () => {
  const { toasts, removeToast } = useToast();

  return (
    <div
      className="pointer-events-none fixed inset-x-3 top-3 z-[9999] flex flex-col gap-2.5 sm:inset-x-auto sm:right-5 sm:top-5 sm:w-[390px]"
      aria-live="polite"
      aria-atomic="true"
    >
      {toasts.map((toast) => {
        const style = toastStyles[toast.type] || toastStyles.info;
        const title = toast.title || style.title;

        return (
          <div
            key={toast.id}
            role={toast.type === "error" ? "alert" : "status"}
            className={`toast-enter pointer-events-auto relative overflow-hidden rounded-lg border ${style.border} bg-white shadow-[0_18px_48px_rgba(15,23,42,0.14)] ring-1 ring-slate-900/5`}
          >
            <div className={`absolute left-0 top-0 h-full w-1 ${style.accent}`} aria-hidden="true" />
            <div className="flex min-w-0 items-start gap-3 px-4 py-3.5 pr-3">
              <div
                className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1 ${style.iconWrap}`}
                aria-hidden="true"
              >
                <span className="material-symbols-outlined text-[22px] leading-none">
                  {style.icon}
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-extrabold leading-5 text-slate-950">
                  {title}
                </p>
                {toast.message && (
                  <p className="mt-0.5 break-words text-sm font-medium leading-5 text-slate-600">
                    {toast.message}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
                aria-label="Đóng thông báo"
              >
                <span className="material-symbols-outlined text-[20px] leading-none">
                  close
                </span>
              </button>
            </div>

            <div
              className={`toast-progress h-0.5 ${style.progress}`}
              style={{ animationDuration: `${toast.duration}ms` }}
              aria-hidden="true"
            />
          </div>
        );
      })}

      <style>{`
        @keyframes toastEnter {
          0% {
            transform: translate3d(16px, -4px, 0) scale(0.98);
            opacity: 0;
          }
          100% {
            transform: translate3d(0, 0, 0) scale(1);
            opacity: 1;
          }
        }
        @keyframes toastProgress {
          from { transform: scaleX(1); }
          to { transform: scaleX(0); }
        }
        .toast-enter {
          animation: toastEnter 180ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        .toast-progress {
          transform-origin: left;
          animation-name: toastProgress;
          animation-timing-function: linear;
          animation-fill-mode: forwards;
        }
      `}</style>
    </div>
  );
};

export default Toast;
