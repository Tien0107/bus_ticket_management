import React from "react";
import { Outlet, Link } from "react-router-dom";

// Placeholder cho Sidebar Dashboard (Quản trị, Tài xế)
export default function DashboardLayout() {
  return (
    <div className="flex min-h-screen bg-surface">
      <aside className="w-64 bg-surface-container shadow-md p-4">
        <h2 className="text-xl font-bold text-primary mb-6">BusGo Dashboard</h2>
        <nav className="flex flex-col gap-2">
          <Link to="/" className="p-2 hover:bg-gray-200 rounded text-sm text-gray-700">← Về trang chủ</Link>
          
          <div className="text-xs font-bold uppercase text-primary mt-4 mb-2 border-b pb-1">Support Admin</div>
          <Link to="/company-support/tickets" className="p-2 hover:bg-surface-container-high rounded-lg text-sm text-on-surface font-medium block">🎟️ Quản lý Vé</Link>
          <Link to="/company-support/coupons" className="p-2 hover:bg-surface-container-high rounded-lg text-sm text-on-surface font-medium block">🏷️ Khuyến mãi</Link>
          
          <div className="text-xs font-bold uppercase text-gray-400 mt-4 mb-2">Các Role Khác</div>
          <p className="p-2 bg-gray-100 text-gray-500 rounded text-sm">(Menu khác chưa hiện)</p>
        </nav>
      </aside>
      <main className="flex-1 p-8">
        <Outlet />
      </main>
    </div>
  );
}
