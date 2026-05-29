import React from "react";
import { Outlet, Navigate, useLocation } from "react-router-dom";
import MainNavbar from "./MainNavbar";
import MainFooter from "./MainFooter";
import ChatWidget from "../chat/ChatWidget";

const publicMainPaths = new Set(["/routes", "/companies", "/promotions", "/contact"]);

const MainLayout = () => {
  const location = useLocation();
  const user = localStorage.getItem("user");
  const token = localStorage.getItem("token")?.trim();
  const isLoggedIn = !!(user && token);
  const isPublicPage = publicMainPaths.has(location.pathname);

  if (!token && user) {
    localStorage.removeItem("user");
  }

  if (!isLoggedIn && !isPublicPage) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-surface text-on-surface font-body flex flex-col">
      <MainNavbar />
      {



      }
      <main className="flex-grow flex flex-col">
        <Outlet />
      </main>
      <MainFooter />
      <ChatWidget />
    </div>);

};

export default MainLayout;