import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { getStaff, updateStaff, verifyCompanyAccount } from "../../api/company";
import { createNotification, getNotifications, markNotificationRead } from "../../api/notification";
import { useToast } from "../../context/ToastContext";
import { getStoredUser } from "../../utils/authStorage";

const accountActions = [
{
  status: "active",
  label: "Duyệt",
  icon: "check_circle",
  description: "Cho phép tài khoản hoạt động",
  className: "border-primary bg-primary text-white hover:bg-primary/90"
},
{
  status: "inactive",
  label: "Tạm ngưng",
  icon: "pause_circle",
  description: "Tạm khóa tài khoản",
  className: "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
},
{
  status: "banned",
  label: "Cấm",
  icon: "block",
  description: "Chặn tài khoản khỏi hệ thống",
  className: "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
}];


const accountTypeLabel = {
  account: "Tài khoản mới",
  driver: "Tài xế",
  staff: "Nhân viên điều hành"
};

const accountStatusNotification = {
  driver: {
    active: {
      title: "Tài khoản tài xế của bạn đã được duyệt",
      body: "Công ty đã duyệt tài khoản tài xế của bạn. Bạn có thể truy cập hệ thống."
    },
    inactive: {
      title: "Tài khoản tài xế của bạn đã bị tạm ngưng",
      body: "Công ty đã tạm ngưng tài khoản tài xế của bạn. Vui lòng liên hệ quản trị công ty nếu cần hỗ trợ."
    },
    banned: {
      title: "Tài khoản tài xế của bạn đã bị cấm",
      body: "Công ty đã cấm tài khoản tài xế của bạn. Vui lòng liên hệ quản trị công ty nếu cần hỗ trợ."
    }
  },
  operator: {
    active: {
      title: "Tài khoản điều hành của bạn đã được duyệt",
      body: "Công ty đã duyệt tài khoản điều hành của bạn. Bạn có thể truy cập trang điều phối."
    },
    inactive: {
      title: "Tài khoản điều hành của bạn đã bị tạm ngưng",
      body: "Công ty đã tạm ngưng tài khoản điều hành của bạn. Vui lòng liên hệ quản trị công ty nếu cần hỗ trợ."
    },
    banned: {
      title: "Tài khoản điều hành của bạn đã bị cấm",
      body: "Công ty đã cấm tài khoản điều hành của bạn. Vui lòng liên hệ quản trị công ty nếu cần hỗ trợ."
    }
  }
};

const getAccountHomePath = (accountType) => accountType === "driver" ? "/driver/dashboard" : "/operator/dashboard";

const getAccountStatusNotification = (accountType, status) => {
  const group = accountType === "driver" ? accountStatusNotification.driver : accountStatusNotification.operator;
  return group[status];
};

const parseNotificationData = (data) => {
  if (!data || typeof data !== "string") return {};

  const trimmed = data.trim();
  if (!trimmed) return {};

  try {
    const parsed = JSON.parse(trimmed);
    if (typeof parsed === "string") {
      return parsed.startsWith("/") ? { path: parsed } : { raw: parsed };
    }
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed;
    }
  } catch (err) {

  }

  return trimmed.startsWith("/") ? { path: trimmed } : { raw: trimmed };
};

const getCurrentUser = () => getStoredUser(null);

const normalizeRole = (value) => String(value || "").replace(/[\s-]+/g, "_").toLowerCase();

const isCompanyAdminUser = (user) => {
  const role = normalizeRole(user?.role);
  const staffProfileRole = normalizeRole(user?.staffProfileRole);
  return role === "admin" || role === "operator" && ["company_admin", "operator_admin", "admin"].includes(staffProfileRole);
};

const isDispatcherUser = (user) => {
  const role = normalizeRole(user?.role);
  const staffProfileRole = normalizeRole(user?.staffProfileRole);
  return role === "operator" && ["dispatcher", "operator_dispatcher"].includes(staffProfileRole);
};

const isSupportUser = (user) => {
  const role = normalizeRole(user?.role);
  const staffProfileRole = normalizeRole(user?.staffProfileRole);
  return role === "operator" && ["support", "company_support", "operator_support"].includes(staffProfileRole);
};

const getUserDashboardPath = (user) => {
  const role = normalizeRole(user?.role);
  if (role === "driver") return "/driver/dashboard";
  if (isCompanyAdminUser(user)) return "/company/dashboard";
  if (isSupportUser(user)) return "/company-support/tickets";
  if (isDispatcherUser(user)) return "/operator/dashboard";
  if (role === "super_admin" || role === "superadmin") return "/super-admin/dashboard";
  return "/";
};

const resolveNotificationPath = (context, user) => {
  const path = context?.path;
  const type = normalizeRole(context?.meta?.type);
  const userDashboardPath = getUserDashboardPath(user);

  if (type === "account_status") {
    return userDashboardPath;
  }

  if (path?.startsWith("/company") && !isCompanyAdminUser(user)) {
    return userDashboardPath;
  }

  if (path?.startsWith("/operator") && !isDispatcherUser(user)) {
    return userDashboardPath;
  }

  if (path?.startsWith("/driver") && normalizeRole(user?.role) !== "driver") {
    return userDashboardPath;
  }

  return path;
};

const getTargetUserId = (meta) => {
  const value =
  meta.userNewAccountId ??
  meta.targetUserId ??
  meta.targetId ??
  meta.accountId ??
  meta.staffUserId ??
  meta.driverUserId ??
  meta.userId ??
  meta.id;
  const id = Number(value);
  return Number.isFinite(id) && id > 0 ? id : null;
};

const inferAccountType = (meta, notification) => {
  const text = [
  meta.type,
  meta.accountType,
  meta.targetType,
  meta.role,
  meta.path,
  notification?.title,
  notification?.body].

  filter(Boolean).
  join(" ").
  toLowerCase();

  if (text.includes("driver") || text.includes("tài xế") || text.includes("tai xe")) {
    return "driver";
  }

  if (
  text.includes("staff") ||
  text.includes("operator") ||
  text.includes("dispatcher") ||
  text.includes("support") ||
  text.includes("điều hành") ||
  text.includes("dieu hanh") ||
  text.includes("nhân viên") ||
  text.includes("nhan vien"))
  {
    return "staff";
  }

  return "";
};

const getNotificationContext = (notification) => {
  const meta = parseNotificationData(notification?.data);
  const targetUserId = getTargetUserId(meta);
  const accountType = inferAccountType(meta, notification) || (targetUserId ? "account" : "");
  const path =
  typeof meta.path === "string" && meta.path.startsWith("/") ?
  meta.path :
  accountType === "driver" ?
  "/company/drivers" :
  accountType === "staff" ?
  "/company/staff" :
  null;

  return {
    meta,
    accountType,
    targetUserId,
    path,
    isAccountAction: Boolean(targetUserId && ["account", "driver", "staff"].includes(accountType))
  };
};

const getStaffMemberId = (member) => {
  const id = Number(member?.userId ?? member?.id);
  return Number.isFinite(id) && id > 0 ? id : null;
};

export default function NotificationBell({ align = "right" }) {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState("");
  const [accountDialogNotification, setAccountDialogNotification] = useState(null);
  const [dropdownPosition, setDropdownPosition] = useState(null);
  const dropdownRef = useRef(null);
  const dropdownMenuRef = useRef(null);
  const navigate = useNavigate();
  const { addToast } = useToast();
  const currentUser = getCurrentUser();
  const canManageAccountActions = isCompanyAdminUser(currentUser);

  const fetchNotifications = async () => {
    try {

      const res = await getNotifications({ limit: 20 });
      let list = res.data?.notifications || res.data || [];
      if (!Array.isArray(list)) list = [];


      list.sort((a, b) => b.id - a.id);

      setNotifications(list);
    } catch {
      setNotifications([]);
    }
  };

  const markAsRead = async (notification) => {
    if (!notification?.id) return false;
    if (notification.isRead) return true;

    setNotifications((current) =>
    current.map((item) => item.id === notification.id ? { ...item, isRead: true } : item)
    );

    try {
      const response = await markNotificationRead(notification.id);
      const updatedNotification = response.data;
      setNotifications((current) =>
      current.map((item) => item.id === notification.id ? { ...item, ...updatedNotification, isRead: true } : item)
      );
      return true;
    } catch {
      setNotifications((current) =>
      current.map((item) => item.id === notification.id ? { ...item, isRead: false } : item)
      );
      return false;
    }
  };

  const resolveStaffForUpdate = async (meta, targetUserId) => {
    const directPayload = {
      fullName: meta.fullName || meta.name || "",
      email: meta.email || "",
      phone: meta.phone || ""
    };

    if (directPayload.fullName && directPayload.email && directPayload.phone) {
      return { userId: targetUserId, payload: directPayload };
    }

    const response = await getStaff({ limit: 10 });
    const staffList = Array.isArray(response.data?.staff) ? response.data.staff : [];
    const member = staffList.find((item) =>
    [item?.userId, item?.id].
    map((value) => Number(value)).
    some((value) => Number.isFinite(value) && value === targetUserId)
    );

    if (!member) {
      throw new Error("Không tìm thấy nhân viên cần cập nhật.");
    }

    const payload = {
      fullName: member.fullName || "",
      email: member.email || "",
      phone: member.phone || ""
    };

    if (!payload.fullName || !payload.email || !payload.phone) {
      throw new Error("Thiếu thông tin nhân viên để cập nhật trạng thái.");
    }

    return { userId: getStaffMemberId(member) || targetUserId, payload };
  };

  const handleAccountAction = async (event, notification, status) => {
    event?.stopPropagation();

    const context = getNotificationContext(notification);
    if (!context.isAccountAction) {
      addToast("Thông báo này chưa có đủ dữ liệu tài khoản để xử lý.", "error");
      return;
    }

    const loadingKey = `${notification.id}-${status}`;

    try {
      setActionLoading(loadingKey);

      if (context.accountType === "driver" || context.accountType === "account") {
        await verifyCompanyAccount({ id: context.targetUserId, status });
      } else {
        const staff = await resolveStaffForUpdate(context.meta, context.targetUserId);
        await updateStaff(staff.userId, { ...staff.payload, status });
      }

      const notificationCopy = getAccountStatusNotification(context.accountType, status);
      if (notificationCopy) {
        await createNotification({
          userId: context.targetUserId,
          title: notificationCopy.title,
          body: notificationCopy.body,
          data: JSON.stringify({
            type: "account_status",
            status,
            path: getAccountHomePath(context.accountType)
          })
        });
      }

      await markAsRead(notification);
      await fetchNotifications();

      addToast(
        status === "active" ?
        "Đã duyệt tài khoản" :
        status === "inactive" ?
        "Đã tạm ngưng tài khoản" :
        "Đã cấm tài khoản",
        "success"
      );
      setIsOpen(false);
      setAccountDialogNotification(null);
    } catch (err) {
      addToast(err.response?.data?.message || err.message || "Không thể cập nhật trạng thái tài khoản", "error");
    } finally {
      setActionLoading("");
    }
  };

  useEffect(() => {

    fetchNotifications();


    const interval = setInterval(() => {
      fetchNotifications();
    }, 60000);

    return () => clearInterval(interval);
  }, []);


  useEffect(() => {
    const handleClickOutside = (event) => {
      const clickedTrigger = dropdownRef.current?.contains(event.target);
      const clickedMenu = dropdownMenuRef.current?.contains(event.target);

      if (!clickedTrigger && !clickedMenu) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setDropdownPosition(null);
      return undefined;
    }

    const updateDropdownPosition = () => {
      const trigger = dropdownRef.current;
      if (!trigger) return;

      const rect = trigger.getBoundingClientRect();
      const gap = 8;
      const width = window.innerWidth >= 640 ? 384 : 300;
      const rawLeft = align === "left" ? rect.left : rect.right - width;
      const left = Math.min(Math.max(8, rawLeft), window.innerWidth - width - 8);
      const top = Math.min(rect.bottom + gap, window.innerHeight - 96);

      setDropdownPosition({ left, top, width });
    };

    updateDropdownPosition();
    const frameId = window.requestAnimationFrame(updateDropdownPosition);
    window.addEventListener("resize", updateDropdownPosition);
    window.addEventListener("scroll", updateDropdownPosition, true);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", updateDropdownPosition);
      window.removeEventListener("scroll", updateDropdownPosition, true);
    };
  }, [align, isOpen]);

  const handleNotificationClick = async (notification) => {
    if (!notification?.id) return;

    const context = getNotificationContext(notification);
    const marked = await markAsRead(notification);
    if (!marked) return;

    if (canManageAccountActions && context.isAccountAction) {
      setAccountDialogNotification({ ...notification, isRead: true });
      setIsOpen(false);
      return;
    }

    setIsOpen(false);

    const navigationPath = resolveNotificationPath(context, currentUser);
    if (navigationPath) {
      navigate(navigationPath);
    } else if (notification.title?.toLowerCase().includes("vé") || notification.body?.toLowerCase().includes("vé")) {
      navigate("/profile/tickets");
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const accountDialogContext = accountDialogNotification ? getNotificationContext(accountDialogNotification) : null;

  return (
    <div className="relative" ref={dropdownRef}>
      {}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-surface-container-high transition-colors flex items-center justify-center text-on-surface-variant focus:outline-none"
        title="Thông báo">
        
        <span className="material-symbols-outlined text-[24px]">notifications</span>
        
        {}
        {unreadCount > 0 &&
        <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] bg-error text-white text-[10px] font-bold rounded-full px-1 border-2 border-surface animate-in zoom-in">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        }
      </button>

      {}
      {isOpen && dropdownPosition && createPortal(
        <div
          ref={dropdownMenuRef}
          style={{
            left: dropdownPosition.left,
            top: dropdownPosition.top,
            width: dropdownPosition.width
          }}
          className="fixed z-[120] overflow-hidden rounded-2xl border border-outline-variant/20 bg-surface-container-lowest shadow-[0_18px_60px_rgba(15,23,42,0.22)] animate-in fade-in slide-in-from-top-2 duration-200">
          
          <div className="px-4 py-3 border-b border-outline-variant/20 flex items-center justify-between bg-surface/50">
            <h3 className="font-bold text-lg text-on-surface">Thông báo</h3>
          </div>
          
          <div className="max-h-[400px] overflow-y-auto overscroll-contain">
            {notifications.length === 0 ?
            <div className="py-12 text-center text-on-surface-variant flex flex-col items-center">
                <span className="material-symbols-outlined text-4xl opacity-50 mb-2">notifications_paused</span>
                <p className="text-sm font-medium">Bạn chưa có thông báo nào</p>
              </div> :

            <div className="flex flex-col">
                {notifications.map((notif) => {
                const isRead = Boolean(notif.isRead);
                const context = getNotificationContext(notif);
                const showAccountActions = canManageAccountActions && context.isAccountAction;
                return (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`p-4 border-b border-outline-variant/10 cursor-pointer transition-colors flex gap-3 ${
                    isRead ?
                    "bg-surface-container-lowest hover:bg-surface-container-lowest/80 opacity-70" :
                    "bg-primary/5 hover:bg-primary/10"}`
                    }>
                    
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isRead ? "bg-surface-container-high text-on-surface-variant" : "bg-primary text-white"}`}>
                        <span className="material-symbols-outlined text-[20px]">
                          {notif.title?.toLowerCase().includes("thành công") ? "check_circle" : "notifications"}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2 mb-1">
                          <h4 className={`text-sm truncate ${isRead ? "font-medium text-on-surface-variant" : "font-bold text-on-surface"}`}>
                            {notif.title || "Thông báo"}
                          </h4>
                          {!isRead &&
                        <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5"></span>
                        }
                        </div>
                        <p className={`text-xs line-clamp-2 ${isRead ? "text-on-surface-variant/80" : "text-on-surface-variant font-medium"}`}>
                          {notif.body}
                        </p>
                        {showAccountActions &&
                      <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary">
                            <span className="material-symbols-outlined text-[14px]">manage_accounts</span>
                            Bấm để chọn trạng thái
                          </div>
                      }
                      </div>
                    </div>);

              })}
              </div>
            }
          </div>
          
          {notifications.length > 0 &&
          <div className="p-2 bg-surface border-t border-outline-variant/20 text-center">
              <button
              onClick={() => setIsOpen(false)}
              className="text-xs font-bold text-on-surface-variant hover:text-on-surface transition-colors w-full py-1">
              
                Đóng
              </button>
            </div>
          }
        </div>,

        document.body
      )}

      {accountDialogNotification && accountDialogContext?.isAccountAction &&
      <div
        className="fixed inset-0 z-[130] flex items-center justify-center bg-black/40 p-4"
        onMouseDown={() => {
          if (!actionLoading) setAccountDialogNotification(null);
        }}>
        
          <div
          className="w-full max-w-md overflow-hidden rounded-2xl border border-outline-variant/20 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.24)]"
          onMouseDown={(event) => event.stopPropagation()}>
          
            <div className="flex items-start justify-between gap-4 border-b border-outline-variant/20 px-5 py-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-primary">
                  {accountTypeLabel[accountDialogContext.accountType] || "Tài khoản"}
                </p>
                <h3 className="mt-1 text-lg font-bold text-on-surface">Xử lý tài khoản</h3>
              </div>
              <button
              type="button"
              onClick={() => setAccountDialogNotification(null)}
              disabled={Boolean(actionLoading)}
              className="rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container-high disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Đóng">
              
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="space-y-4 px-5 py-4">
              <div className="rounded-xl bg-surface-container-low p-4">
                <p className="font-bold text-on-surface">{accountDialogNotification.title || "Thông báo"}</p>
                <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
                  {accountDialogNotification.body || "Không có nội dung thông báo."}
                </p>
                <p className="mt-3 text-xs font-medium text-on-surface-variant">
                  ID tài khoản: {accountDialogContext.targetUserId}
                </p>
              </div>

              <div>
                <p className="mb-2 text-sm font-bold text-on-surface">Chọn trạng thái</p>
                <div className="space-y-2">
                  {accountActions.map((action) => {
                  const loading = actionLoading === `${accountDialogNotification.id}-${action.status}`;

                  return (
                    <button
                      key={action.status}
                      type="button"
                      onClick={(event) => handleAccountAction(event, accountDialogNotification, action.status)}
                      disabled={Boolean(actionLoading)}
                      className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${action.className}`}>
                      
                        <span className="material-symbols-outlined text-[22px]">{action.icon}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-bold">{loading ? "Đang xử lý..." : action.label}</span>
                          <span className="block text-xs font-medium opacity-80">{action.description}</span>
                        </span>
                      </button>);

                })}
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-outline-variant/20 bg-surface-container-low px-5 py-4 sm:flex-row sm:justify-end">
              <button
              type="button"
              onClick={() => {
                setAccountDialogNotification(null);
                if (accountDialogContext.path) navigate(accountDialogContext.path);
              }}
              disabled={Boolean(actionLoading)}
              className="rounded-xl border border-outline-variant/30 bg-white px-4 py-2 text-sm font-bold text-on-surface transition-colors hover:bg-surface-container-high disabled:cursor-not-allowed disabled:opacity-60">
              
                Xem danh sách
              </button>
              <button
              type="button"
              onClick={() => setAccountDialogNotification(null)}
              disabled={Boolean(actionLoading)}
              className="rounded-xl px-4 py-2 text-sm font-bold text-on-surface-variant transition-colors hover:bg-surface-container-high disabled:cursor-not-allowed disabled:opacity-60">
              
                Đóng
              </button>
            </div>
          </div>
        </div>
      }
    </div>);

}
