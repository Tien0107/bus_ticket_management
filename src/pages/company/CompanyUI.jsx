import React from "react";

export const pageSurfaceClass = "min-h-screen bg-[#f6f8f5] px-5 py-6 lg:px-8";

export function CompanyPageShell({ eyebrow, title, description, actions, children, maxWidth = "max-w-7xl" }) {
  return (
    <div className={pageSurfaceClass}>
      <div className={`mx-auto ${maxWidth}`}>
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            {eyebrow && (
              <p className="mb-2 text-sm font-bold uppercase tracking-wide text-primary">
                {eyebrow}
              </p>
            )}
            <h1 className="text-3xl font-extrabold tracking-tight text-on-surface lg:text-4xl">
              {title}
            </h1>
            {description && (
              <p className="mt-2 max-w-3xl text-sm leading-6 text-on-surface-variant lg:text-base">
                {description}
              </p>
            )}
          </div>
          {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
        </div>
        {children}
      </div>
    </div>
  );
}

export function PrimaryButton({ icon, children, className = "", ...props }) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      {...props}
    >
      {icon && <span className="material-symbols-outlined text-[20px]">{icon}</span>}
      {children}
    </button>
  );
}

export function SecondaryButton({ icon, children, className = "", ...props }) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-lg border border-outline-variant/60 bg-white px-4 py-3 text-sm font-bold text-on-surface transition-colors hover:bg-surface-container-low disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      {...props}
    >
      {icon && <span className="material-symbols-outlined text-[20px]">{icon}</span>}
      {children}
    </button>
  );
}

export function DangerButton({ icon, children, className = "", ...props }) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      {...props}
    >
      {icon && <span className="material-symbols-outlined text-[20px]">{icon}</span>}
      {children}
    </button>
  );
}

export function IconButton({ icon, label, variant = "secondary", className = "", ...props }) {
  const variantClass = {
    primary: "border-primary bg-primary text-white hover:bg-primary/90",
    secondary: "border-outline-variant/60 bg-white text-on-surface hover:bg-surface-container-low",
    danger: "border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
    success: "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
  }[variant] || "border-outline-variant/60 bg-white text-on-surface hover:bg-surface-container-low";

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${variantClass} ${className}`}
      {...props}
    >
      <span className="material-symbols-outlined text-[20px] leading-none">{icon}</span>
    </button>
  );
}

export function StatCard({ icon, label, value, tone = "primary" }) {
  const toneClass = {
    primary: "bg-primary/10 text-primary",
    emerald: "bg-emerald-50 text-emerald-700",
    blue: "bg-sky-50 text-sky-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-700",
    violet: "bg-violet-50 text-violet-700",
    slate: "bg-slate-100 text-slate-700",
  }[tone] || "bg-primary/10 text-primary";

  const valueText = value === undefined || value === null ? "" : String(value);
  const isCurrencyValue = /[₫đ]/i.test(valueText);
  const valueClass = isCurrencyValue ? "text-[1.65rem]" : valueText.length > 10 ? "text-2xl" : "text-3xl";

  return (
    <div className="rounded-xl border border-outline-variant/30 bg-white p-5 shadow-sm">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
        <div className="min-w-0">
          <p className="min-h-[2.75rem] text-sm font-medium leading-6 text-on-surface-variant">
            {label}
          </p>
          <p className={`mt-1 leading-tight ${valueClass} font-extrabold text-on-surface`}>
            {value}
          </p>
        </div>
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${toneClass}`}>
          <span className="material-symbols-outlined text-[24px]">{icon}</span>
        </span>
      </div>
    </div>
  );
}

export function ToolbarCard({ children }) {
  return (
    <div className="mb-6 rounded-xl border border-outline-variant/30 bg-white p-4 shadow-sm">
      {children}
    </div>
  );
}

export function SearchInput({ value, onChange, placeholder }) {
  return (
    <div className="relative">
      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">
        search
      </span>
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full rounded-lg border border-outline-variant/50 bg-white py-3 pl-12 pr-4 text-sm font-medium outline-none transition-all placeholder:text-outline focus:border-primary focus:ring-4 focus:ring-primary/10"
      />
    </div>
  );
}

export function SelectControl(props) {
  return (
    <select
      className="w-full rounded-lg border border-outline-variant/50 bg-white px-4 py-3 text-sm font-medium text-on-surface outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10"
      {...props}
    />
  );
}

export function LoadingState({ label = "Đang tải dữ liệu..." }) {
  return (
    <div className="rounded-xl border border-outline-variant/30 bg-white p-10 text-center shadow-sm">
      <div className="mx-auto h-11 w-11 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
      <p className="mt-4 text-sm font-medium text-on-surface-variant">{label}</p>
    </div>
  );
}

export function ErrorState({ message }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-700">
      {message}
    </div>
  );
}

export function EmptyState({ icon = "inbox", title, description }) {
  return (
    <div className="rounded-xl border border-dashed border-outline-variant/60 bg-white p-10 text-center">
      <span className="material-symbols-outlined text-5xl text-outline">{icon}</span>
      <p className="mt-3 font-bold text-on-surface">{title}</p>
      {description && <p className="mt-1 text-sm text-on-surface-variant">{description}</p>}
    </div>
  );
}

export function StatusBadge({ children, tone = "slate" }) {
  const toneClass = {
    emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    amber: "bg-amber-50 text-amber-700 ring-amber-100",
    red: "bg-red-50 text-red-700 ring-red-100",
    blue: "bg-sky-50 text-sky-700 ring-sky-100",
    violet: "bg-violet-50 text-violet-700 ring-violet-100",
    slate: "bg-slate-100 text-slate-700 ring-slate-200",
  }[tone] || "bg-slate-100 text-slate-700 ring-slate-200";

  return (
    <span className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-bold ring-1 ${toneClass}`}>
      {children}
    </span>
  );
}

export function ModalShell({ title, subtitle, onClose, children, footer, maxWidth = "max-w-2xl" }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className={`flex max-h-[90vh] w-full ${maxWidth} flex-col overflow-hidden rounded-xl bg-white shadow-[0_24px_80px_rgba(15,23,42,0.28)]`}>
        <div className="border-b border-outline-variant/20 px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-extrabold text-on-surface">{title}</h2>
              {subtitle && <p className="mt-1 text-sm text-on-surface-variant">{subtitle}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-on-surface"
              aria-label="Đóng"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>
        <div className="overflow-y-auto p-5">{children}</div>
        {footer && <div className="border-t border-outline-variant/20 p-5">{footer}</div>}
      </div>
    </div>
  );
}

export function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-on-surface">{label}</span>
      {children}
    </label>
  );
}

export const inputClass =
  "w-full rounded-lg border border-outline-variant/50 bg-white px-4 py-3 text-sm font-medium outline-none transition-all placeholder:text-outline focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:bg-surface-container-low disabled:text-on-surface-variant";
