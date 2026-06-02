import React from "react";
import { Link, useLocation } from "react-router-dom";

const navItems = [
  { to: "/profile", label: "Hồ sơ" },
  { to: "/profile/tickets", label: "Vé đã đặt" },
  { to: "/profile/payment-methods", label: "Thanh Toán" },
];

export default function CustomerProfileNav() {
  const location = useLocation();

  return (
    <div className="flex items-center flex-wrap gap-2 mb-4">
      {navItems.map((item) => {
        const isActive =
            item.to === "/profile"
              ? location.pathname === "/profile"
              : location.pathname.startsWith(item.to);

          return (
            <Link
              key={item.to}
              to={item.to}
              className={`px-4 py-1.5 rounded-full text-sm font-bold transition-colors shadow-sm ${
                isActive
                  ? "bg-primary text-white shadow-md"
                  : "bg-surface-container-low text-on-surface hover:bg-surface-container hover:text-primary"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
    </div>
  );
}
