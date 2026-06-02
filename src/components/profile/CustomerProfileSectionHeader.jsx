import React from "react";

export default function CustomerProfileSectionHeader({ title, action }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 mb-3 border-b border-outline-variant/30 pb-2">
      <h1 className="text-xl md:text-2xl font-bold text-primary">{title}</h1>
      {action ? <div>{action}</div> : null}
    </div>
  );
}
