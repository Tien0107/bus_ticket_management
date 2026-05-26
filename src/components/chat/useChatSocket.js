import { useEffect } from "react";
import { io } from "socket.io-client";
import {
  appendUniqueMessages,
  normalizeIncomingMessage,
  RECALLED_MESSAGE,
  SOCKET_URL,
  toNumber,
  zeroUnreadForViewer,
} from "./chatUtils";

export default function useChatSocket({
  activeBoxRef,
  loadBoxes,
  markRead,
  rememberRecalledMessageId,
  selectedBoxRef,
  setBoxes,
  setMessages,
  setOnlineUserIds,
  setSocketError,
  setTypingByBox,
  socketRef,
  viewerId,
  enabled = true,
}) {
  useEffect(() => {
    if (!enabled) return undefined;

    const token = localStorage.getItem("token")?.replace(/^Bearer\s+/i, "");
    if (!token) {
      setSocketError("Thiếu token đăng nhập.");
      return undefined;
    }

    const socket = io(SOCKET_URL, {
      transports: ["websocket"],
      auth: (callback) => callback({ token }),
    });

    socketRef.current = socket;

    const handleConnect = () => {
      setSocketError("");
      if (activeBoxRef.current) socket.emit("chat:join", { boxId: activeBoxRef.current });
    };

    const handleConnectError = (error) => {
      setSocketError(error?.message || "Không kết nối được realtime chat.");
    };

    const handleNewMessage = (payload) => {
      const message = normalizeIncomingMessage(payload);
      if (!message) return;

      const activeBoxId = selectedBoxRef.current;
      const isActiveBox = Number(activeBoxId) === Number(message.boxId);

      if (isActiveBox && Number(message.senderId) !== Number(viewerId)) {
        setMessages((current) => appendUniqueMessages(current, message));
        markRead(message.boxId);
      }

      setBoxes((current) =>
        current.map((box) => {
          if (Number(box.id) !== Number(message.boxId)) return box;
          let nextBox = { ...box, lastMessage: message.message, lastMessageSenderId: message.senderId };

          if (isActiveBox) {
            nextBox = zeroUnreadForViewer(nextBox, viewerId);
          } else if (Number(message.senderId) !== Number(viewerId)) {
            if (Number(box.receiverId) === Number(viewerId)) {
              nextBox.unreadReceiverCount = Number(nextBox.unreadReceiverCount || 0) + 1;
            } else if (Number(box.senderId) === Number(viewerId)) {
              nextBox.unreadSenderCount = Number(nextBox.unreadSenderCount || 0) + 1;
            }
          }

          return nextBox;
        })
      );
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
          String(message.id) === String(messageId)
            ? { ...message, message: payload.body || RECALLED_MESSAGE, recalled: true }
            : message
        )
      );
      rememberRecalledMessageId(messageId);
      setBoxes((current) =>
        current.map((box) =>
          Number(box.id) === Number(boxId)
            ? {
                ...box,
                lastMessage: payload.body || RECALLED_MESSAGE,
                lastMessageSenderId: toNumber(payload.senderId) || box.lastMessageSenderId,
              }
            : box
        )
      );
    };

    socket.on("connect", handleConnect);
    socket.on("connect_error", handleConnectError);
    socket.on("unauthorized", handleConnectError);
    socket.on("error", handleConnectError);
    socket.on("message:new", handleNewMessage);
    socket.on("chat:new", () => loadBoxes({ reset: true }));
    socket.on("chat:typing:start", handleTypingStart);
    socket.on("chat:typing:stop", handleTypingStop);
    socket.on("message:recalled", handleRecall);
    socket.on("users:online", handleUsersOnline);
    socket.on("user:online", handleUserOnline);
    socket.on("user:offline", handleUserOffline);

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [
    activeBoxRef,
    loadBoxes,
    markRead,
    rememberRecalledMessageId,
    selectedBoxRef,
    setBoxes,
    setMessages,
    setOnlineUserIds,
    setSocketError,
    setTypingByBox,
    socketRef,
    viewerId,
    enabled,
  ]);
}
