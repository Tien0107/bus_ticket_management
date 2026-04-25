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
    <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
      <Link
        to="/"
        className="inline-flex items-center gap-3 rounded-2xl px-1 py-1 bg-transparent shadow-none hover:opacity-90 transition-opacity"
        aria-label="Về trang chủ Bus Go"
      >
        <img src="/img/busgo.jpg" alt="BusGo" className="h-10 w-auto mix-blend-multiply" />
        <span className="text-xl font-black text-primary tracking-tighter">Bus Go</span>
      </Link>

      <div className="flex items-center flex-wrap gap-4">
        {navItems.map((item) => {
          const isActive =
            item.to === "/profile"
              ? location.pathname === "/profile"
              : location.pathname.startsWith(item.to);

          return (
            <Link
              key={item.to}
              to={item.to}
              className={`px-6 py-2 rounded-full font-bold transition-colors shadow-sm ${
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
    </div>
  );
}
