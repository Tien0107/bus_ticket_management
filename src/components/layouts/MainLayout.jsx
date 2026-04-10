import React from "react";
import { Outlet } from "react-router-dom";

// Placeholder cho Layout Công khai (Website Khách)
export default function MainLayout() {
  return (
    <div>
      <header className="bg-primary text-white p-4 text-center font-bold">Main Navigation Placeholder</header>
      <main>
        <Outlet />
      </main>
      <footer className="bg-gray-100 p-4 text-center text-sm font-medium mt-10">Footer Placeholder</footer>
    </div>
  );
}
