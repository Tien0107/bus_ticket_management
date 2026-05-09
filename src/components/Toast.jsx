import React, { useEffect } from "react";
import { useToast } from "../context/ToastContext";

const Toast = () => {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="animate-slide-in-out"
          onAnimationEnd={() => removeToast(toast.id)}
        >
          <div
            className={`flex items-center gap-3 px-6 py-4 rounded-lg shadow-lg backdrop-blur-sm ${
              toast.type === "success"
                ? "bg-green-50 border border-green-200 text-green-800"
                : toast.type === "error"
                ? "bg-red-50 border border-red-200 text-red-800"
                : toast.type === "warning"
                ? "bg-yellow-50 border border-yellow-200 text-yellow-800"
                : "bg-blue-50 border border-blue-200 text-blue-800"
            }`}
          >
            <span className="material-symbols-outlined text-xl">
              {toast.type === "success"
                ? "check_circle"
                : toast.type === "error"
                ? "error"
                : toast.type === "warning"
                ? "warning"
                : "info"}
            </span>
            <span className="font-medium">{toast.message}</span>
          </div>
        </div>
      ))}

      <style>{`
        @keyframes slideInOut {
          0% {
            transform: translateX(0);
            opacity: 1;
          }
          85% {
            transform: translateX(0);
            opacity: 1;
          }
          100% {
            transform: translateX(500px);
            opacity: 0;
          }
        }
        .animate-slide-in-out {
          animation: slideInOut 3s ease-in-out forwards;
        }
      `}</style>
    </div>
  );
};

export default Toast;
