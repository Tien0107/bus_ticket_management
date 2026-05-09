import React from "react";

export default function CustomerProfileSectionHeader({ title, action }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-6 border-b border-outline-variant/30 pb-3">
      <h1 className="text-2xl md:text-3xl font-bold text-primary">{title}</h1>
      {action ? <div>{action}</div> : null}
    </div>
  );
}
