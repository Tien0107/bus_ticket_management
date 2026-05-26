import React from "react";
import { Outlet, Navigate, useLocation } from "react-router-dom";
import MainNavbar from "./MainNavbar";
import MainFooter from "./MainFooter";
import ChatWidget from "../chat/ChatWidget";

const publicMainPaths = new Set(["/", "/routes", "/companies", "/promotions", "/contact"]);

const MainLayout = () => {
  const location = useLocation();
  const user = localStorage.getItem("user");
  const token = localStorage.getItem("token");
  const isLoggedIn = !!(user && token);
  const isPublicPage = publicMainPaths.has(location.pathname);

  if (!isLoggedIn && !isPublicPage) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-surface text-on-surface font-body flex flex-col">
      <MainNavbar />
      {/* 
        flex-grow giúp đẩy Footer xuống cuối trang.
        Các trang con tự quyết định việc padding-top (ví dụ pt-24) để không bị Navbar đè lên, 
        hoặc không dùng pt nếu muốn banner nằm dưới Navbar (như trang Home).
      */}
      <main className="flex-grow flex flex-col">
        <Outlet />
      </main>
      <MainFooter />
      <ChatWidget />
    </div>
  );
};

export default MainLayout;
