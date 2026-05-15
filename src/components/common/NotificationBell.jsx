import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getNotifications } from "../../api/notification";

const LOCAL_STORAGE_KEY = "busgo_read_notifications";

export default function NotificationBell({ align = "right" }) {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [readIds, setReadIds] = useState(new Set());
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Load read IDs from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        setReadIds(new Set(JSON.parse(stored)));
      }
    } catch (e) {
      console.error("Error parsing read notifications from localStorage", e);
    }
  }, []);

  const fetchNotifications = async () => {
    try {
      // Just fetch recent 20 for the dropdown
      const res = await getNotifications({ limit: 20 });
      let list = res.data?.notifications || res.data || [];
      if (!Array.isArray(list)) list = [];
      
      // Sort by ID descending (newest first) assuming higher ID is newer
      list.sort((a, b) => b.id - a.id);
      
      setNotifications(list);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchNotifications();

    // Polling every 60 seconds
    const interval = setInterval(() => {
      fetchNotifications();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // Handle clicking outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotificationClick = (notification) => {
    // Mark as read locally
    if (!readIds.has(notification.id)) {
      const newReadIds = new Set(readIds);
      newReadIds.add(notification.id);
      setReadIds(newReadIds);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(Array.from(newReadIds)));
    }

    setIsOpen(false);

    // If data contains a URL or route, navigate. Otherwise, if title contains "vé", navigate to tickets.
    if (notification.data && notification.data.startsWith("/")) {
      navigate(notification.data);
    } else if (notification.title?.toLowerCase().includes("vé") || notification.body?.toLowerCase().includes("vé")) {
      navigate("/profile/tickets");
    }
  };

  const markAllAsRead = () => {
    const newReadIds = new Set(readIds);
    notifications.forEach((n) => newReadIds.add(n.id));
    setReadIds(newReadIds);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(Array.from(newReadIds)));
  };

  // Calculate unread count (isRead from backend is ignored if it's true, but we mainly rely on local state)
  const unreadCount = notifications.filter((n) => !n.isRead && !readIds.has(n.id)).length;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-surface-container-high transition-colors flex items-center justify-center text-on-surface-variant focus:outline-none"
        title="Thông báo"
      >
        <span className="material-symbols-outlined text-[24px]">notifications</span>
        
        {/* Badge */}
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] bg-error text-white text-[10px] font-bold rounded-full px-1 border-2 border-surface animate-in zoom-in">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className={`absolute ${align === "left" ? "left-0" : "right-0"} mt-2 w-[300px] sm:w-96 bg-surface-container-lowest rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-outline-variant/20 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200`}>
          <div className="px-4 py-3 border-b border-outline-variant/20 flex items-center justify-between bg-surface/50">
            <h3 className="font-bold text-lg text-on-surface">Thông báo</h3>
          </div>
          
          <div className="max-h-[400px] overflow-y-auto overscroll-contain">
            {notifications.length === 0 ? (
              <div className="py-12 text-center text-on-surface-variant flex flex-col items-center">
                <span className="material-symbols-outlined text-4xl opacity-50 mb-2">notifications_paused</span>
                <p className="text-sm font-medium">Bạn chưa có thông báo nào</p>
              </div>
            ) : (
              <div className="flex flex-col">
                {notifications.map((notif) => {
                  const isReadLocally = readIds.has(notif.id) || notif.isRead;
                  return (
                    <div
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`p-4 border-b border-outline-variant/10 cursor-pointer transition-colors flex gap-3 ${
                        isReadLocally 
                          ? "bg-surface-container-lowest hover:bg-surface-container-lowest/80 opacity-70" 
                          : "bg-primary/5 hover:bg-primary/10"
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isReadLocally ? "bg-surface-container-high text-on-surface-variant" : "bg-primary text-white"}`}>
                        <span className="material-symbols-outlined text-[20px]">
                          {notif.title?.toLowerCase().includes("thành công") ? "check_circle" : "notifications"}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2 mb-1">
                          <h4 className={`text-sm truncate ${isReadLocally ? "font-medium text-on-surface-variant" : "font-bold text-on-surface"}`}>
                            {notif.title || "Thông báo"}
                          </h4>
                          {!isReadLocally && (
                            <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5"></span>
                          )}
                        </div>
                        <p className={`text-xs line-clamp-2 ${isReadLocally ? "text-on-surface-variant/80" : "text-on-surface-variant font-medium"}`}>
                          {notif.body}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          {notifications.length > 0 && (
            <div className="p-2 bg-surface border-t border-outline-variant/20 text-center">
              <button 
                onClick={() => setIsOpen(false)}
                className="text-xs font-bold text-on-surface-variant hover:text-on-surface transition-colors w-full py-1"
              >
                Đóng
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
