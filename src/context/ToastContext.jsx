import React, { createContext, useContext, useState, useCallback } from "react";

const ToastContext = createContext();

const TOAST_DURATIONS = {
  success: 1800,   // ngắn để không vướng, quan trọng thì truyền duration dài hơn
  info: 2400,
  warning: 4200,
  error: 5200,
};

const normalizeToastType = (type = "info") => {
  const normalized = String(type || "info").toLowerCase();
  if (["success", "error", "warning", "info"].includes(normalized)) return normalized;
  return "info";
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toastInput, type = "success", duration) => {
    const payload =
      typeof toastInput === "object" && toastInput !== null
        ? toastInput
        : { message: toastInput, type, duration };

    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const toastType = normalizeToastType(payload.type || type);
    const toastDuration = payload.duration ?? duration ?? TOAST_DURATIONS[toastType];
    const toast = {
      id,
      type: toastType,
      title: payload.title || "",
      message: payload.message || "",
      duration: toastDuration,
    };

    setToasts((prev) => {
      const withoutDuplicate = prev.filter(
        (item) =>
          item.type !== toast.type ||
          item.title !== toast.title ||
          item.message !== toast.message
      );

      return [...withoutDuplicate, toast].slice(-4);
    });

    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, toastDuration);

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast phải được dùng trong ToastProvider");
  }
  return context;
};
