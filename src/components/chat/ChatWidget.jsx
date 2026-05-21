import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import {
  createChatBox,
  getChatBoxes,
  getChatMessages,
  markChatBoxRead,
  recallChatMessage,
  sendChatMessage,
} from "../../api/chat";
import { getUsers } from "../../api/auth";
import { useToast } from "../../context/ToastContext";

const PAGE_SIZE = 10;
const RECALLED_MESSAGE = "Tin nhắn đã được thu hồi";
const SOCKET_URL =
  process.env.REACT_APP_SOCKET_SERVER_URL ||
  process.env.REACT_APP_SOCKET_URL ||
  process.env.VITE_SOCKET_URL ||
  "https://socket-server-b5r4.onrender.com";

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
};

const getRecallCacheKey = (userId) => `driverChatRecalledMessages:${userId || "guest"}`;

const readRecalledMessageIds = (userId) => {
  try {
    const raw = localStorage.getItem(getRecallCacheKey(userId));
    const ids = JSON.parse(raw || "[]");
    return Array.isArray(ids) ? ids.map(String) : [];
  } catch {
    return [];
  }
};

const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const isRecalledText = (value) => {
  const text = String(value || "").trim().toLowerCase();
  return (
    text === RECALLED_MESSAGE.toLowerCase() ||
    text === "tin nhắn đã thu hồi" ||
    text === "message recalled" ||
    text === "recalled"
  );
};

const isMessageRecalled = (message = {}) =>
  Boolean(
    message.recalled ||
      message.isRecalled ||
      message.is_recalled ||
      message.status === "recalled" ||
      message.messageStatus === "recalled" ||
      message.deletedAt ||
      message.recalledAt ||
      isRecalledText(message.message) ||
      isRecalledText(message.body)
  );

const normalizeBox = (box = {}) => ({
  ...box,
  id: toNumber(box.id ?? box.boxId),
  senderId: toNumber(box.senderId),
  receiverId: toNumber(box.receiverId),
  lastMessageSenderId: toNumber(box.lastMessageSenderId),
  unreadReceiverCount: Number(box.unreadReceiverCount || 0),
  unreadSenderCount: Number(box.unreadSenderCount || 0),
  displayName: box.displayName || `Hội thoại #${box.id ?? box.boxId ?? ""}`,
  lastMessage: box.lastMessage || "",
});

const normalizeBoxesResponse = (data) => {
  const boxes = Array.isArray(data?.boxes)
    ? data.boxes
    : Array.isArray(data?.data?.boxes)
    ? data.data.boxes
    : Array.isArray(data?.data)
    ? data.data
    : Array.isArray(data)
    ? data
    : [];

  return {
    boxes: boxes.map(normalizeBox).filter((box) => box.id),
    next: data?.next ?? data?.data?.next ?? null,
  };
};

const normalizeMessage = (message = {}, boxId) => ({
  ...message,
  id: message.id ?? message.messageId ?? `local-${Date.now()}-${Math.random()}`,
  boxId: toNumber(message.boxId ?? boxId),
  message: message.message ?? message.body ?? "",
  senderId: toNumber(message.senderId),
  fullName: message.fullName || message.senderName || "Người dùng",
  createdAt: message.createdAt || new Date().toISOString(),
  recalled: isMessageRecalled(message),
});

const normalizeMessagesResponse = (data, boxId) => {
  const messages = Array.isArray(data?.messages)
    ? data.messages
    : Array.isArray(data?.data?.messages)
    ? data.data.messages
    : Array.isArray(data?.data)
    ? data.data
    : Array.isArray(data)
    ? data
    : [];

  return {
    messages: messages.map((message) => normalizeMessage(message, boxId)).filter((message) => message.message || message.id),
    next: data?.next ?? data?.data?.next ?? null,
  };
};

const normalizeUser = (user = {}) => ({
  ...user,
  id: toNumber(user.id ?? user.userId),
  fullName: user.fullName || user.username || `Người dùng #${user.id ?? user.userId ?? ""}`,
  email: user.email || "",
  phone: user.phone || "",
  role: user.role || "",
  status: user.status || "",
});

const normalizeUsersResponse = (data, viewerId) => {
  const users = Array.isArray(data?.users)
    ? data.users
    : Array.isArray(data?.data?.users)
    ? data.data.users
    : Array.isArray(data?.data)
    ? data.data
    : Array.isArray(data)
    ? data
    : [];

  return {
    users: users
      .map(normalizeUser)
      .filter((user) => user.id && Number(user.id) !== Number(viewerId)),
    next: data?.next ?? data?.data?.next ?? null,
  };
};

const normalizeIncomingMessage = (payload = {}) => {
  const boxId = toNumber(payload.boxId ?? payload.box?.id);
  const body = payload.body ?? payload.message ?? payload.lastMessage;
  if (!boxId || !body) return null;

  return normalizeMessage(
    {
      id: payload.messageId ?? payload.id,
      boxId,
      message: body,
      senderId: payload.senderId,
      fullName: payload.fullName || payload.senderName,
      createdAt: payload.createdAt,
    },
    boxId
  );
};

const getUnreadForViewer = (box, viewerId) => {
  if (!viewerId) return Math.max(Number(box.unreadReceiverCount || 0), Number(box.unreadSenderCount || 0));
  if (Number(box.receiverId) === Number(viewerId)) return Number(box.unreadReceiverCount || 0);
  if (Number(box.senderId) === Number(viewerId)) return Number(box.unreadSenderCount || 0);
  return 0;
};

const zeroUnreadForViewer = (box, viewerId) => {
  if (Number(box.receiverId) === Number(viewerId)) return { ...box, unreadReceiverCount: 0 };
  if (Number(box.senderId) === Number(viewerId)) return { ...box, unreadSenderCount: 0 };
  return box;
};

const getBoxPreview = (box, viewerId) => {
  if (!box.lastMessage) return "Chưa có tin nhắn";

  const senderName = Number(box.lastMessageSenderId) === Number(viewerId) ? "Bạn" : box.displayName;
  return `${senderName}: ${box.lastMessage}`;
};

const appendUniqueMessages = (current, incoming) => {
  const items = Array.isArray(incoming) ? incoming : [incoming];
  const existing = new Set(current.map((message) => String(message.id)));
  const next = [...current];

  items.forEach((message) => {
    if (!existing.has(String(message.id))) {
      next.push(message);
      existing.add(String(message.id));
    }
  });

  return next.sort((left, right) => new Date(left.createdAt) - new Date(right.createdAt));
};

const sortMessagesOldestFirst = (items = []) =>
  [...items].sort((left, right) => new Date(left.createdAt) - new Date(right.createdAt));

const getInitials = (name = "") => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "BG";
  return parts.slice(-2).map((part) => part[0]).join("").toUpperCase();
};

const formatTime = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
};

export default function ChatWidget() {
  const { addToast } = useToast();
  const [currentUser] = useState(getStoredUser);
  const viewerId = currentUser?.id ? Number(currentUser.id) : null;
  const [open, setOpen] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [boxes, setBoxes] = useState([]);
  const [boxNext, setBoxNext] = useState(null);
  const [selectedBoxId, setSelectedBoxId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageNext, setMessageNext] = useState(null);
  const [loadingBoxes, setLoadingBoxes] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [composeValue, setComposeValue] = useState("");
  const [receiverId, setReceiverId] = useState("");
  const [recipientUsers, setRecipientUsers] = useState([]);
  const [loadingRecipients, setLoadingRecipients] = useState(false);
  const [recipientSearch, setRecipientSearch] = useState("");
  const [firstMessage, setFirstMessage] = useState("");
  const [socketError, setSocketError] = useState("");
  const [onlineUserIds, setOnlineUserIds] = useState(new Set());
  const [typingByBox, setTypingByBox] = useState({});
  const [recalledMessageIds, setRecalledMessageIds] = useState(
    () => new Set(readRecalledMessageIds(viewerId))
  );

  const socketRef = useRef(null);
  const selectedBoxRef = useRef(null);
  const activeBoxRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimerRef = useRef(null);
  const typingActiveRef = useRef(false);
  const recallCacheKey = useMemo(() => getRecallCacheKey(viewerId), [viewerId]);

  const selectedBox = useMemo(
    () => boxes.find((box) => Number(box.id) === Number(selectedBoxId)) || null,
    [boxes, selectedBoxId]
  );

  const totalUnread = useMemo(
    () => boxes.reduce((sum, box) => sum + getUnreadForViewer(box, viewerId), 0),
    [boxes, viewerId]
  );

  const peerTyping = useMemo(() => {
    const typingUsers = typingByBox[selectedBoxId] || [];
    return typingUsers.some((userId) => Number(userId) !== Number(viewerId));
  }, [selectedBoxId, typingByBox, viewerId]);

  const selectedPeerId = useMemo(() => {
    if (!selectedBox || !viewerId) return null;
    return Number(selectedBox.senderId) === Number(viewerId)
      ? selectedBox.receiverId
      : selectedBox.senderId;
  }, [selectedBox, viewerId]);

  const isPeerDriver = useMemo(() => {
    if (!selectedBox) return false;
    const nameLower = selectedBox.displayName?.toLowerCase() || "";
    if (nameLower.includes("tài xế") || nameLower.includes("driver")) return true;
    const peerUser = recipientUsers.find(u => Number(u.id) === Number(selectedPeerId));
    return peerUser?.role === "driver";
  }, [selectedBox, selectedPeerId, recipientUsers]);

  const selectedPeerOnline = selectedPeerId ? onlineUserIds.has(Number(selectedPeerId)) : false;

  const filteredRecipientUsers = useMemo(() => {
    const keyword = recipientSearch.trim().toLowerCase();
    if (!keyword) return recipientUsers;

    return recipientUsers.filter((user) =>
      [user.fullName, user.email, user.phone, user.role, user.username]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword))
    );
  }, [recipientSearch, recipientUsers]);

  const rememberRecalledMessageId = useCallback(
    (messageId) => {
      if (!messageId) return;

      setRecalledMessageIds((current) => {
        const normalizedId = String(messageId);
        if (current.has(normalizedId)) return current;

        const next = new Set(current);
        next.add(normalizedId);
        localStorage.setItem(recallCacheKey, JSON.stringify(Array.from(next)));
        return next;
      });
    },
    [recallCacheKey]
  );

  const applyRecallCache = useCallback(
    (items) =>
      items.map((message) =>
        recalledMessageIds.has(String(message.id))
          ? { ...message, message: RECALLED_MESSAGE, recalled: true }
          : message
      ),
    [recalledMessageIds]
  );

  const loadBoxes = useCallback(
    async ({ reset = true, next = null } = {}) => {
      try {
        setLoadingBoxes(reset);
        const response = await getChatBoxes({ limit: PAGE_SIZE, ...(next ? { next } : {}) });
        const data = normalizeBoxesResponse(response.data);

        setBoxes((current) => {
          if (reset) return data.boxes;
          const known = new Set(current.map((box) => String(box.id)));
          return [...current, ...data.boxes.filter((box) => !known.has(String(box.id)))];
        });
        setBoxNext(data.next);
      } catch (err) {
        console.error("Lỗi tải hội thoại:", err);
        addToast(err.response?.data?.message || "Không thể tải hội thoại", "error");
      } finally {
        setLoadingBoxes(false);
      }
    },
    [addToast]
  );

  const loadRecipients = useCallback(async () => {
    try {
      setLoadingRecipients(true);
      const params = {
        status: "active",
        limit: 100,
      };

      if (currentUser?.companyId) {
        params.companyId = currentUser.companyId;
      }

      const response = await getUsers(params);
      const data = normalizeUsersResponse(response.data, viewerId);
      setRecipientUsers(data.users);
    } catch (err) {
      console.error("Lỗi tải danh sách người nhận:", err);
      addToast(err.response?.data?.message || "Không thể tải danh sách người nhận", "error");
    } finally {
      setLoadingRecipients(false);
    }
  }, [addToast, currentUser?.companyId, viewerId]);

  const loadMessages = useCallback(
    async ({ boxId, reset = true, next = null } = {}) => {
      if (!boxId) return;

      try {
        setLoadingMessages(reset);
        const response = await getChatMessages(boxId, { limit: PAGE_SIZE, ...(next ? { next } : {}) });
        const data = normalizeMessagesResponse(response.data, boxId);
        const messagesWithRecallState = applyRecallCache(data.messages);

        setMessages((current) =>
          reset
            ? sortMessagesOldestFirst(messagesWithRecallState)
            : appendUniqueMessages(messagesWithRecallState, current)
        );
        setMessageNext(data.next);
      } catch (err) {
        console.error("Lỗi tải tin nhắn:", err);
        addToast(err.response?.data?.message || "Không thể tải tin nhắn", "error");
      } finally {
        setLoadingMessages(false);
      }
    },
    [addToast, applyRecallCache]
  );

  const markRead = useCallback(
    async (boxId) => {
      if (!boxId) return;
      setBoxes((current) =>
        current.map((box) => (Number(box.id) === Number(boxId) ? zeroUnreadForViewer(box, viewerId) : box))
      );

      try {
        await markChatBoxRead(boxId);
        socketRef.current?.emit("chat:read", { boxId });
      } catch (err) {
        console.error("Lỗi cập nhật đã đọc:", err);
      }
    },
    [viewerId]
  );

  useEffect(() => {
    loadBoxes({ reset: true });
  }, [loadBoxes]);

  useEffect(() => {
    if (open && showCreate) {
      loadRecipients();
    }
  }, [loadRecipients, open, showCreate]);

  useEffect(() => {
    selectedBoxRef.current = selectedBoxId;
    const socket = socketRef.current;
    const previousBoxId = activeBoxRef.current;

    if (socket?.connected && previousBoxId && Number(previousBoxId) !== Number(selectedBoxId)) {
      socket.emit("chat:leave", { boxId: previousBoxId });
    }

    activeBoxRef.current = selectedBoxId;

    if (!selectedBoxId) {
      setMessages([]);
      setMessageNext(null);
      return;
    }

    if (socket?.connected) socket.emit("chat:join", { boxId: selectedBoxId });
    loadMessages({ boxId: selectedBoxId, reset: true });
    markRead(selectedBoxId);
  }, [loadMessages, markRead, selectedBoxId]);

  useEffect(() => {
    const handleOpenChatTrigger = async (e) => {
      const { receiverId, displayName } = e.detail || {};
      if (!receiverId || !viewerId) return;

      setOpen(true);

      const existingBox = boxes.find(
        (box) =>
          (Number(box.senderId) === Number(viewerId) && Number(box.receiverId) === Number(receiverId)) ||
          (Number(box.receiverId) === Number(viewerId) && Number(box.senderId) === Number(receiverId))
      );

      if (existingBox) {
        setSelectedBoxId(existingBox.id);
        setShowCreate(false);
      } else {
        try {
          // Tự động tạo hộp chat mới trong background cho khách hàng mà không cần hiển thị form soạn tin nhắn thủ công
          await createChatBox({
            receiverId: Number(receiverId),
            message: "Xin chào! Tôi có một số câu hỏi về chuyến xe."
          });

          // Tải lại danh sách chat
          await loadBoxes({ reset: true });

          // Sau khi tải lại, tự động tìm và chọn hộp thoại vừa tạo để mở ra
          const updatedResponse = await getChatBoxes({ limit: 50 });
          const boxesArray = Array.isArray(updatedResponse.data?.boxes)
            ? updatedResponse.data.boxes
            : Array.isArray(updatedResponse.data?.data?.boxes)
            ? updatedResponse.data.data.boxes
            : Array.isArray(updatedResponse.data?.data)
            ? updatedResponse.data.data
            : Array.isArray(updatedResponse.data)
            ? updatedResponse.data
            : [];

          const newBox = boxesArray.find(
            (box) =>
              (Number(box.senderId) === Number(viewerId) && Number(box.receiverId) === Number(receiverId)) ||
              (Number(box.receiverId) === Number(viewerId) && Number(box.senderId) === Number(receiverId))
          );

          if (newBox) {
            setSelectedBoxId(newBox.id);
          }
          setShowCreate(false);
        } catch (err) {
          console.error("Lỗi tự động tạo chat box:", err);
          addToast("Không thể tạo cuộc hội thoại: " + (err.response?.data?.message || err.message), "error");
        }
      }
    };

    window.addEventListener("chat:open-with-user", handleOpenChatTrigger);
    return () => window.removeEventListener("chat:open-with-user", handleOpenChatTrigger);
  }, [boxes, viewerId, addToast, loadBoxes]);

  useEffect(() => {
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
      if (activeBoxRef.current) socket.emit("chat:leave", { boxId: activeBoxRef.current });
      socket.disconnect();
      socketRef.current = null;
    };
  }, [loadBoxes, markRead, rememberRecalledMessageId, viewerId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, selectedBoxId]);

  const stopTyping = useCallback(() => {
    if (!typingActiveRef.current || !selectedBoxId) return;
    socketRef.current?.emit("chat:typing:stop", { boxId: selectedBoxId });
    typingActiveRef.current = false;
  }, [selectedBoxId]);

  const handleComposeChange = (event) => {
    setComposeValue(event.target.value);
    if (!selectedBoxId || !socketRef.current?.connected) return;

    if (!typingActiveRef.current) {
      socketRef.current.emit("chat:typing:start", { boxId: selectedBoxId });
      typingActiveRef.current = true;
    }

    window.clearTimeout(typingTimerRef.current);
    typingTimerRef.current = window.setTimeout(stopTyping, 1200);
  };

  const handleSendMessage = async (event) => {
    event.preventDefault();
    const text = composeValue.trim();
    if (!text || !selectedBoxId || !currentUser?.id) return;

    setComposeValue("");
    stopTyping();

    const createdAt = new Date().toISOString();
    const optimisticMessage = normalizeMessage(
      {
        id: `tmp-${Date.now()}`,
        boxId: selectedBoxId,
        message: text,
        senderId: currentUser.id,
        fullName: currentUser.fullName || "Người dùng",
        createdAt,
        optimistic: true,
      },
      selectedBoxId
    );

    setMessages((current) => appendUniqueMessages(current, optimisticMessage));
    setBoxes((current) =>
      current.map((box) =>
        Number(box.id) === Number(selectedBoxId)
          ? { ...box, lastMessage: text, lastMessageSenderId: currentUser.id }
          : box
      )
    );

    try {
      await sendChatMessage(selectedBoxId, { message: text });
      socketRef.current?.emit("chat:message:send", {
        body: text,
        message: text,
        boxId: selectedBoxId,
        createdAt,
        senderName: currentUser.fullName || "Người dùng",
        senderId: currentUser.id,
      });
    } catch (err) {
      console.error("Lỗi gửi tin nhắn:", err);
      addToast(err.response?.data?.message || "Gửi tin nhắn thất bại", "error");
    }
  };

  const handleCreateBox = async (event) => {
    event.preventDefault();
    const receiver = Number(receiverId);
    const message = firstMessage.trim();

    if (!receiver || !message) {
      addToast("Chọn người nhận và nhập tin nhắn đầu tiên", "error");
      return;
    }

    try {
      await createChatBox({ receiverId: receiver, message });
      setReceiverId("");
      setFirstMessage("");
      setRecipientSearch("");
      setShowCreate(false);
      await loadBoxes({ reset: true });
      addToast("Đã tạo hội thoại", "success");
    } catch (err) {
      console.error("Lỗi tạo hội thoại:", err);
      addToast(err.response?.data?.message || "Tạo hội thoại thất bại", "error");
    }
  };

  const handleRecallMessage = async (message) => {
    if (!selectedBoxId || !message?.id || String(message.id).startsWith("tmp-") || message.recalled) return;

    try {
      await recallChatMessage(selectedBoxId, message.id);
      setMessages((current) =>
        current.map((item) =>
          String(item.id) === String(message.id)
            ? { ...item, message: RECALLED_MESSAGE, recalled: true }
            : item
        )
      );
      rememberRecalledMessageId(message.id);
      setBoxes((current) =>
        current.map((box) => {
          if (Number(box.id) !== Number(selectedBoxId)) return box;
          if (box.lastMessage && box.lastMessage !== message.message) return box;

          return {
            ...box,
            lastMessage: RECALLED_MESSAGE,
            lastMessageSenderId: message.senderId,
          };
        })
      );
      addToast("Đã thu hồi tin nhắn", "success");
    } catch (err) {
      console.error("Lỗi thu hồi tin nhắn:", err);
      addToast(err.response?.data?.message || "Thu hồi tin nhắn thất bại", "error");
    }
  };

  const handleClose = () => {
    setOpen(false);
    setShowCreate(false);
    setSelectedBoxId(null);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="relative inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-[0_14px_34px_rgba(0,128,43,0.28)] ring-4 ring-white transition-all hover:-translate-y-0.5 hover:bg-primary/90"
          aria-label="Mở trò chuyện"
        >
          <span className="material-symbols-outlined text-[28px]">chat_bubble</span>
          {totalUnread > 0 && (
            <span className="absolute -right-1 -top-1 rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
              {totalUnread}
            </span>
          )}
        </button>
      )}

      {open && (
        <section className="flex h-[min(620px,calc(100vh-96px))] w-[min(380px,calc(100vw-28px))] flex-col overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.20)]">
          <div className="flex h-[74px] shrink-0 items-center justify-between border-b border-emerald-100 bg-white px-4">
            <div className="flex min-w-0 items-center gap-2">
              {selectedBox && (
                <button
                  type="button"
                  onClick={() => setSelectedBoxId(null)}
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
                  aria-label="Quay lại danh sách"
                >
                  <span className="material-symbols-outlined text-[23px]">arrow_back</span>
                </button>
              )}
              <div className="min-w-0">
                <h2 className="truncate text-xl font-bold text-on-surface">
                  {selectedBox ? selectedBox.displayName : "Trò chuyện"}
                </h2>
                {selectedBox && (
                  <p className="truncate text-sm font-medium text-on-surface-variant">
                    {peerTyping ? "Đang nhập..." : selectedPeerOnline ? "Đang online" : "Đang offline"}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!selectedBox && (
                <button
                  type="button"
                  onClick={() => setShowCreate((current) => !current)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-primary hover:bg-emerald-50"
                  aria-label="Tạo hội thoại"
                  title="Tạo hội thoại"
                >
                  <span className="material-symbols-outlined text-[26px]">add</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleClose}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-primary hover:bg-emerald-50"
                aria-label="Đóng trò chuyện"
                title="Đóng"
              >
                <span className="material-symbols-outlined text-[26px]">close</span>
              </button>
            </div>
          </div>

          {socketError && (
            <div className="mx-5 mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
              {socketError}
            </div>
          )}

          {!selectedBox ? (
            <div className="min-h-0 flex-1 overflow-y-auto bg-[#fbfdfc] p-4">
              {showCreate && (
                <form onSubmit={handleCreateBox} className="mb-4 space-y-3 rounded-xl border border-emerald-100 bg-white p-3">
                  <input
                    type="text"
                    value={recipientSearch}
                    onChange={(event) => setRecipientSearch(event.target.value)}
                    className="w-full rounded-lg border border-outline-variant/40 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                    placeholder="Tìm người nhận theo tên, email hoặc số điện thoại"
                  />
                  <select
                    value={receiverId}
                    onChange={(event) => setReceiverId(event.target.value)}
                    disabled={loadingRecipients || filteredRecipientUsers.length === 0}
                    className="w-full rounded-lg border border-outline-variant/40 bg-white px-3 py-2.5 text-sm font-medium text-on-surface outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:bg-surface-container-low disabled:text-on-surface-variant"
                  >
                    <option value="">
                      {loadingRecipients
                        ? "Đang tải người nhận..."
                        : filteredRecipientUsers.length
                        ? "Chọn người nhận"
                        : "Không có người nhận phù hợp"}
                    </option>
                    {filteredRecipientUsers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.fullName} - {user.phone || user.email || user.role || `ID ${user.id}`}
                      </option>
                    ))}
                  </select>
                  <textarea
                    value={firstMessage}
                    onChange={(event) => setFirstMessage(event.target.value)}
                    className="min-h-20 w-full resize-none rounded-lg border border-outline-variant/40 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                    placeholder="Tin nhắn đầu tiên"
                  />
                  <button
                    type="submit"
                    className="inline-flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-primary/90"
                  >
                    Tạo hội thoại
                  </button>
                </form>
              )}

              {loadingBoxes ? (
                <div className="flex h-full items-center justify-center text-sm text-on-surface-variant">
                  Đang tải hội thoại...
                </div>
              ) : boxes.length ? (
                <div className="space-y-3">
                  {boxes.map((box) => {
                    const unread = getUnreadForViewer(box, viewerId);
                    const boxPeerId = Number(box.senderId) === Number(viewerId) ? box.receiverId : box.senderId;
                    const online = boxPeerId && onlineUserIds.has(Number(boxPeerId));

                    return (
                      <button
                        key={box.id}
                        type="button"
                        onClick={() => setSelectedBoxId(box.id)}
                        className="w-full rounded-xl bg-white p-3 text-left shadow-sm ring-1 ring-slate-100 transition-all hover:-translate-y-0.5 hover:shadow-md"
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary text-lg font-extrabold text-white">
                            {getInitials(box.displayName)}
                            {online && <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-400" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="truncate text-base font-bold text-on-surface">{box.displayName}</p>
                              {unread > 0 && (
                                <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-white">
                                  {unread}
                                </span>
                              )}
                            </div>
                            <p className="mt-1 truncate text-sm font-semibold text-slate-500">
                              {getBoxPreview(box, viewerId)}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                  {boxNext && (
                    <button
                      type="button"
                      onClick={() => loadBoxes({ reset: false, next: boxNext })}
                      className="w-full rounded-xl border border-emerald-100 bg-white px-4 py-3 text-sm font-bold text-on-surface hover:bg-emerald-50"
                    >
                      Tải thêm
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex h-full items-center justify-center text-center">
                  <div>
                    <span className="material-symbols-outlined text-5xl text-outline">forum</span>
                    <p className="mt-3 font-bold text-on-surface">Chưa có hội thoại</p>
                    <p className="mt-1 text-sm text-on-surface-variant">Bấm dấu cộng để tạo hội thoại.</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="min-h-0 flex-1 overflow-y-auto bg-surface-container-low/40 p-4">
                {isPeerDriver && (
                  <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-800 flex items-start gap-2 shadow-sm">
                    <span className="material-symbols-outlined text-[16px] shrink-0 mt-0.5 animate-pulse text-amber-600">warning</span>
                    <span>
                      <strong>Chú ý:</strong> Tài xế có thể đang vận hành xe. Vui lòng hạn chế nhắn tin hoặc gọi điện trực tiếp nếu không khẩn cấp để đảm bảo an toàn!
                    </span>
                  </div>
                )}
                {messageNext && (
                  <div className="mb-4 text-center">
                    <button
                      type="button"
                      onClick={() => loadMessages({ boxId: selectedBoxId, reset: false, next: messageNext })}
                      className="rounded-full border border-outline-variant/40 bg-white px-4 py-2 text-sm font-bold text-on-surface hover:bg-surface-container-low"
                    >
                      Tải tin cũ hơn
                    </button>
                  </div>
                )}

                {loadingMessages ? (
                  <div className="flex h-full items-center justify-center text-sm text-on-surface-variant">
                    Đang tải tin nhắn...
                  </div>
                ) : messages.length ? (
                  <div className="flex min-h-full flex-col justify-end space-y-3">
                    {messages.map((message) => {
                      const mine = Number(message.senderId) === Number(viewerId);
                      const recalled = isMessageRecalled(message);
                      return (
                        <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[82%] rounded-2xl px-4 py-3 shadow-sm ${
                            mine ? "bg-primary text-white" : "bg-white text-on-surface"
                          }`}>
                            {!mine && <p className="mb-1 text-xs font-bold text-primary">{message.fullName}</p>}
                            <p className={`whitespace-pre-wrap break-words text-sm ${recalled ? "italic opacity-75" : ""}`}>
                              {recalled ? RECALLED_MESSAGE : message.message}
                            </p>
                            <div className={`mt-2 flex items-center gap-2 text-[11px] ${mine ? "text-white/75" : "text-on-surface-variant"}`}>
                              <span>{formatTime(message.createdAt)}</span>
                              {mine && !recalled && !String(message.id).startsWith("tmp-") && (
                                <button
                                  type="button"
                                  onClick={() => handleRecallMessage(message)}
                                  className="font-bold underline-offset-2 hover:underline"
                                >
                                  Thu hồi
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {peerTyping && (
                      <div className="flex justify-start">
                        <div className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-on-surface-variant shadow-sm">
                          Đang nhập...
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center text-center">
                    <div>
                      <span className="material-symbols-outlined text-5xl text-outline">chat_bubble</span>
                      <p className="mt-2 font-bold text-on-surface">Chưa có tin nhắn</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Replies */}
              <div className="flex gap-2 overflow-x-auto px-3 py-2 bg-slate-50 border-t border-outline-variant/10" style={{ scrollbarWidth: "none" }}>
                {[
                  "Tôi đã đến điểm đón!",
                  "Xe chạy tới đâu rồi ạ?",
                  "Vui lòng đợi tôi 2 phút.",
                  "Tôi mang nhiều hành lý không?",
                ].map((reply, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setComposeValue(reply)}
                    className="shrink-0 rounded-full border border-primary/20 bg-white px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/5 transition-all shadow-sm cursor-pointer"
                  >
                    {reply}
                  </button>
                ))}
              </div>
              <form onSubmit={handleSendMessage} className="shrink-0 border-t border-outline-variant/20 bg-white p-3">
                <div className="flex items-end gap-2">
                  <textarea
                    value={composeValue}
                    onChange={handleComposeChange}
                    onBlur={stopTyping}
                    className="min-h-10 flex-1 resize-none rounded-lg border border-outline-variant/40 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                    placeholder="Nhập tin nhắn..."
                    rows={1}
                  />
                  <button
                    type="submit"
                    disabled={!composeValue.trim()}
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Gửi tin nhắn"
                  >
                    <span className="material-symbols-outlined text-[21px]">send</span>
                  </button>
                </div>
              </form>
            </>
          )}
        </section>
      )}
    </div>
  );
}
