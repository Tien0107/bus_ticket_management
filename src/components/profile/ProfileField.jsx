import React from "react";

export default function ProfileField({ label, value, icon = "info", emphasized = false }) {
  return (
    <div className="rounded-2xl bg-surface-container-low p-4 border border-outline-variant/20">
      <p className="text-xs uppercase tracking-wide text-on-surface-variant font-semibold mb-2">
        {label}
      </p>
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-primary">{icon}</span>
        <p className={`text-sm md:text-base ${emphasized ? "font-bold text-on-surface" : "font-medium text-on-surface-variant"}`}>
          {value || "-"}
        </p>
      </div>
    </div>
  );
}
