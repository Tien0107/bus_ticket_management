import React from "react";

const statusLabelMap = {
  active: "Đang hoạt động",
  inactive: "Tạm khóa",
  pending: "Chờ kích hoạt",
  suspended: "Đã tạm ngưng",
};

const statusClassMap = {
  active: "bg-green-100 text-green-700 border-green-200",
  inactive: "bg-gray-100 text-gray-700 border-gray-200",
  pending: "bg-orange-100 text-orange-700 border-orange-200",
  suspended: "bg-red-100 text-red-700 border-red-200",
};

export default function ProfileStatusBadge({ status }) {
  const normalizedStatus = String(status || "inactive").toLowerCase();
  const label = statusLabelMap[normalizedStatus] || normalizedStatus;
  const className = statusClassMap[normalizedStatus] || statusClassMap.inactive;

  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold ${className}`}>
      {label}
    </span>
  );
}
