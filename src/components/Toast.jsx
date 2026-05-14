import React from "react";
import { useToast } from "../context/ToastContext";

const toastStyles = {
  success: {
    title: "Thành công",
    icon: "check_circle",
    accent: "bg-emerald-500",
    iconWrap: "bg-emerald-50 text-emerald-600 ring-emerald-100",
    border: "border-emerald-100",
  },
  error: {
    title: "Có lỗi xảy ra",
    icon: "error",
    accent: "bg-red-500",
    iconWrap: "bg-red-50 text-red-600 ring-red-100",
    border: "border-red-100",
  },
  warning: {
    title: "Cần kiểm tra",
    icon: "warning",
    accent: "bg-amber-500",
    iconWrap: "bg-amber-50 text-amber-600 ring-amber-100",
    border: "border-amber-100",
  },
  info: {
    title: "Thông báo",
    icon: "info",
    accent: "bg-sky-500",
    iconWrap: "bg-sky-50 text-sky-600 ring-sky-100",
    border: "border-sky-100",
  },
};

const Toast = () => {
  const { toasts, removeToast } = useToast();

  return (
    <div className="pointer-events-none fixed inset-x-4 top-4 z-[9999] flex flex-col gap-3 sm:inset-x-auto sm:right-6 sm:top-6 sm:w-[420px]">
      {toasts.map((toast) => {
        const style = toastStyles[toast.type] || toastStyles.info;
        const title = toast.title || style.title;

        return (
          <div
            key={toast.id}
            className={`toast-enter pointer-events-auto relative overflow-hidden rounded-xl border ${style.border} bg-white/95 shadow-[0_18px_50px_rgba(15,23,42,0.16)] ring-1 ring-black/5 backdrop-blur`}
          >
            <div className={`absolute left-0 top-0 h-full w-1 ${style.accent}`} />
            <div className="flex min-w-0 items-start gap-3 px-4 py-4 pr-3">
              <div
                className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ring-1 ${style.iconWrap}`}
              >
                <span className="material-symbols-outlined text-[24px] leading-none">
                  {style.icon}
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold leading-5 text-slate-950">
                  {title}
                </p>
                {toast.message && (
                  <p className="mt-1 break-words text-sm leading-5 text-slate-600">
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
              className={`toast-progress h-1 ${style.accent}`}
              style={{ animationDuration: `${toast.duration}ms` }}
            />
          </div>
        );
      })}

      <style>{`
        @keyframes toastEnter {
          0% {
            transform: translate3d(18px, -6px, 0) scale(0.98);
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
          animation: toastEnter 220ms cubic-bezier(0.16, 1, 0.3, 1);
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
