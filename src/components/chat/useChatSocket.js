import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import {
  appendUniqueMessages,
  normalizeIncomingMessage,
  RECALLED_MESSAGE,
  SOCKET_URL,
  sortBoxesByLatestActivity,
  toNumber,
  zeroUnreadForViewer } from
"./chatUtils";
import { getStoredToken } from "../../utils/authStorage";

export default function useChatSocket({
  activeBoxRef,
  loadBoxes,
  markRead,
  rememberRecalledMessageId,
  selectedBoxRef,
  setBoxes,
  setMessages,
  setOnlineUserIds,
  setRealtimeUnreadByBox,
  setSocketError,
  setTypingByBox,
  socketRef,
  viewerId,
  enabled = true
}) {
  const handledMessageKeysRef = useRef(new Set());

  useEffect(() => {
    if (!enabled) return undefined;

    const token = getStoredToken().replace(/^Bearer\s+/i, "") || "";
    if (!token) {
      setSocketError("Thiếu token đăng nhập.");
      return undefined;
    }

    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      auth: (callback) => callback({ token }),
      reconnection: true,
      reconnectionAttempts: 8,
      reconnectionDelay: 800,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      forceNew: false
    });

    socketRef.current = socket;

    const handleConnect = () => {
      setSocketError("");
      const currentBox = activeBoxRef.current;
      if (currentBox) {
        socket.emit("chat:join", { boxId: currentBox });
      }
      loadBoxes({ reset: true });
    };

    const handleConnectError = (error) => {
      setSocketError(error?.message || "Không kết nối được realtime chat.");
    };

    const handleNewMessage = (payload) => {
      const message = normalizeIncomingMessage(payload);
      if (!message) {
        loadBoxes({ reset: true });
        return;
      }

      const messageKey = [
      message.id,
      message.boxId,
      message.senderId,
      message.createdAt,
      message.message].
      map((value) => String(value ?? "")).join("|");

      if (handledMessageKeysRef.current.has(messageKey)) return;
      handledMessageKeysRef.current.add(messageKey);

      if (handledMessageKeysRef.current.size > 200) {
        const [oldestKey] = handledMessageKeysRef.current;
        handledMessageKeysRef.current.delete(oldestKey);
      }

      const activeBoxId = selectedBoxRef.current;
      const isActiveBox = Number(activeBoxId) === Number(message.boxId);

      if (isActiveBox && Number(message.senderId) !== Number(viewerId)) {
        setMessages((current) => appendUniqueMessages(current, message));
        markRead(message.boxId);
      }

      if (!isActiveBox && Number(message.senderId) !== Number(viewerId)) {
        setRealtimeUnreadByBox((current) => ({
          ...current,
          [message.boxId]: Number(current[message.boxId] || 0) + 1
        }));
      }

      setBoxes((current) =>
      sortBoxesByLatestActivity(
        current.map((box) => {
          if (Number(box.id) !== Number(message.boxId)) return box;
          let nextBox = {
            ...box,
            lastMessage: message.message,
            lastMessageSenderId: message.senderId,
            lastMessageAt: message.createdAt
          };

          if (isActiveBox) {
            nextBox = zeroUnreadForViewer(nextBox, viewerId);
          } else if (Number(message.senderId) !== Number(viewerId)) {
            nextBox.unreadCount = Number(nextBox.unreadCount || 0) + 1;
            if (Number(box.receiverId) === Number(viewerId)) {
              nextBox.unreadReceiverCount = Number(nextBox.unreadReceiverCount || 0) + 1;
            } else if (Number(box.senderId) === Number(viewerId)) {
              nextBox.unreadSenderCount = Number(nextBox.unreadSenderCount || 0) + 1;
            }
          }

          return nextBox;
        })
      )
      );

      if (!isActiveBox && Number(message.senderId) !== Number(viewerId)) {
        window.setTimeout(() => loadBoxes({ reset: true }), 300);
      }
    };

    const handleTypingStart = (payload = {}) => {
      const boxId = toNumber(payload.boxId);
      const userId = toNumber(payload.userId);
      if (!boxId || !userId) return;

      setTypingByBox((current) => {
        const users = new Set(current[boxId] || []);
        users.add(userId);
        return { ...current, [boxId]: Array.from(users) };
      });
    };

    const handleTypingStop = (payload = {}) => {
      const boxId = toNumber(payload.boxId);
      const userId = toNumber(payload.userId);
      if (!boxId || !userId) return;

      setTypingByBox((current) => {
        const users = new Set(current[boxId] || []);
        users.delete(userId);
        return { ...current, [boxId]: Array.from(users) };
      });
    };

    const handleUsersOnline = (payload = {}) => {
      const ids = Array.isArray(payload) ? payload : payload.userIds;
      if (Array.isArray(ids)) setOnlineUserIds(new Set(ids.map(Number)));
    };

    const handleUserOnline = (payload = {}) => {
      const userId = toNumber(payload.userId ?? payload);
      if (!userId) return;
      setOnlineUserIds((current) => new Set([...Array.from(current), userId]));
    };

    const handleUserOffline = (payload = {}) => {
      const userId = toNumber(payload.userId ?? payload);
      if (!userId) return;
      setOnlineUserIds((current) => {
        const next = new Set(current);
        next.delete(userId);
        return next;
      });
    };

    const handleRecall = (payload = {}) => {
      const boxId = toNumber(payload.boxId);
      const messageId = payload.messageId ?? payload.id;
      if (!boxId || !messageId) return;

      setMessages((current) =>
      current.map((message) =>
      String(message.id) === String(messageId) ? { ...message, message: payload.body || RECALLED_MESSAGE, recalled: true } :
      message
      )
      );
      rememberRecalledMessageId(messageId);
      setBoxes((current) =>
      current.map((box) =>
      Number(box.id) === Number(boxId) ? {
        ...box,
        lastMessage: payload.body || RECALLED_MESSAGE,
        lastMessageSenderId: toNumber(payload.senderId) || box.lastMessageSenderId
      } :
      box
      )
      );
    };

    socket.on("connect", handleConnect);
    socket.on("connect_error", handleConnectError);
    socket.on("unauthorized", handleConnectError);
    socket.on("error", handleConnectError);
    socket.on("message:new", handleNewMessage);
    socket.on("message:created", handleNewMessage);
    socket.on("message:send", handleNewMessage);
    socket.on("chat:message:new", handleNewMessage);
    socket.on("chat:message:receive", handleNewMessage);
    socket.on("chat:message:send", handleNewMessage);
    socket.on("chat:new", () => loadBoxes({ reset: true }));
    socket.on("chat:typing:start", handleTypingStart);
    socket.on("chat:typing:stop", handleTypingStop);
    socket.on("message:recalled", handleRecall);
    socket.on("users:online", handleUsersOnline);
    socket.on("user:online", handleUserOnline);
    socket.on("user:offline", handleUserOffline);

    const forwardLegacyCallEvent = (eventName) => (payload) => {
      window.dispatchEvent(new CustomEvent(`legacy-call:${eventName}`, { detail: payload }));
    };

    socket.on("chat:call:active", forwardLegacyCallEvent("active"));
    socket.on("chat:call:start", forwardLegacyCallEvent("start"));
    socket.on("chat:call:offer", forwardLegacyCallEvent("offer"));
    socket.on("chat:call:answer", forwardLegacyCallEvent("answer"));
    socket.on("chat:call:ice-candidate", forwardLegacyCallEvent("ice-candidate"));
    socket.on("chat:call:reject", forwardLegacyCallEvent("reject"));
    socket.on("chat:call:end", forwardLegacyCallEvent("end"));


    const handleCallIncomingFromChat = (payload) => {
      window.dispatchEvent(new CustomEvent("call:incoming:bridge", { detail: payload }));
      window.dispatchEvent(new CustomEvent("call:incoming", { detail: payload }));
    };
    socket.on("call:incoming", handleCallIncomingFromChat);


    window.__chatSocket = socket;

    // Clean disconnect on tab close / refresh
    const handleBeforeUnload = () => {
      try {
        socket.disconnect();
      } catch {}
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      socket.off("call:incoming", handleCallIncomingFromChat);
      window.__chatSocket = null;
      socket.disconnect();
      socketRef.current = null;
    };
  }, [
  activeBoxRef,
  handledMessageKeysRef,
  loadBoxes,
  markRead,
  rememberRecalledMessageId,
  selectedBoxRef,
  setBoxes,
  setMessages,
  setOnlineUserIds,
  setRealtimeUnreadByBox,
  setSocketError,
  setTypingByBox,
  socketRef,
  viewerId,
  enabled]
  );
}
