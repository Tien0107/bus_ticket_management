import React from "react";

export const operatorSurfaceClass = "min-h-screen bg-[#f7f9f7] px-4 py-4 lg:px-6";

export function OperatorPageShell({ eyebrow, title, description, actions, children, maxWidth = "max-w-7xl" }) {
  return (
    <div className={operatorSurfaceClass}>
      <div className={`mx-auto ${maxWidth}`}>
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            {eyebrow && (
              <p className="mb-1 text-xs font-bold uppercase tracking-wide text-primary">{eyebrow}</p>
            )}
            <h1 className="text-2xl font-extrabold tracking-tight text-on-surface lg:text-3xl">{title}</h1>
            {description && (
              <p className="mt-1 max-w-3xl text-xs leading-5 text-on-surface-variant lg:text-sm">{description}</p>
            )}
          </div>
          {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
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
      className={`inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
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
      className={`inline-flex items-center justify-center gap-2 rounded-lg border border-outline-variant/60 bg-white px-3.5 py-2 text-sm font-bold text-on-surface transition-colors hover:bg-surface-container-low disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
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
    warning: "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100",
  }[variant] || "border-outline-variant/60 bg-white text-on-surface hover:bg-surface-container-low";

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${variantClass} ${className}`}
      {...props}
    >
      <span className="material-symbols-outlined text-[18px] leading-none">{icon}</span>
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

  return (
    <div className="rounded-xl border border-outline-variant/30 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-on-surface-variant">{label}</p>
          <p className="mt-0.5 truncate text-2xl font-extrabold text-on-surface">{value}</p>
        </div>
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${toneClass}`}>
          <span className="material-symbols-outlined text-[20px]">{icon}</span>
        </span>
      </div>
    </div>
  );
}

export function ToolbarCard({ children }) {
  return (
    <div className="mb-4 rounded-xl border border-outline-variant/30 bg-white p-3 shadow-sm">{children}</div>
  );
}

export function SearchInput({ value, onChange, placeholder }) {
  return (
    <div className="relative">
      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">search</span>
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full rounded-lg border border-outline-variant/50 bg-white py-2.5 pl-10 pr-3 text-sm font-medium outline-none transition-all placeholder:text-outline focus:border-primary focus:ring-3 focus:ring-primary/10"
      />
    </div>
  );
}

export function SelectControl(props) {
  return (
    <select
      className="w-full rounded-lg border border-outline-variant/50 bg-white px-3 py-2.5 text-sm font-medium text-on-surface outline-none transition-all focus:border-primary focus:ring-3 focus:ring-primary/10"
      {...props}
    />
  );
}

export function LoadingState({ label = "Đang tải dữ liệu..." }) {
  return (
    <div className="rounded-xl border border-outline-variant/30 bg-white p-6 text-center shadow-sm">
      <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
      <p className="mt-3 text-xs font-medium text-on-surface-variant">{label}</p>
    </div>
  );
}

export function ErrorState({ message }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{message}</div>
  );
}

export function EmptyState({ icon = "inbox", title, description }) {
  return (
    <div className="rounded-xl border border-dashed border-outline-variant/60 bg-white p-6 text-center">
      <span className="material-symbols-outlined text-4xl text-outline">{icon}</span>
      <p className="mt-2 font-bold text-on-surface text-sm">{title}</p>
      {description && <p className="mt-0.5 text-xs text-on-surface-variant">{description}</p>}
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

export function ModalShell({
  title,
  subtitle,
  onClose,
  children,
  footer,
  maxWidth = "max-w-2xl",
  headerClassName = "border-b border-outline-variant/20 px-4 py-3",
  titleClassName = "text-lg font-extrabold text-on-surface",
  subtitleClassName = "mt-0.5 text-xs text-on-surface-variant",
  bodyClassName = "overflow-y-auto",
  bodyPaddingClassName = "p-4",
  footerClassName = "border-t border-outline-variant/20 p-4",
  panelOverflowClassName = "overflow-hidden",
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 backdrop-blur-sm">
      <div className={`flex max-h-[90vh] w-full ${maxWidth} flex-col ${panelOverflowClassName} rounded-xl bg-white shadow-[0_24px_80px_rgba(15,23,42,0.28)]`}>
        <div className={headerClassName}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className={titleClassName}>{title}</h2>
              {subtitle && <p className={subtitleClassName}>{subtitle}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-on-surface"
              aria-label="Đóng"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        </div>
        <div className={`${bodyClassName} ${bodyPaddingClassName}`}>{children}</div>
        {footer && <div className={footerClassName}>{footer}</div>}
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
  "w-full rounded-lg border border-outline-variant/50 bg-white px-3 py-2.5 text-sm font-medium outline-none transition-all placeholder:text-outline focus:border-primary focus:ring-3 focus:ring-primary/10 disabled:bg-surface-container-low disabled:text-on-surface-variant";

export const formatCurrency = (value) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
