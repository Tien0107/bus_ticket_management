import React, { createContext, useContext, useState, useCallback } from "react";

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toastInput, type = "success", duration = 1000) => {
    const payload =
      typeof toastInput === "object" && toastInput !== null
        ? toastInput
        : { message: toastInput, type, duration };

    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const toastDuration = payload.duration ?? duration;
    const toast = {
      id,
      type: payload.type || type,
      title: payload.title || "",
      message: payload.message || "",
      duration: toastDuration,
    };

    setToasts((prev) => [...prev, toast].slice(-5));

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
