export const PAGE_SIZE = 10;
export const RECALLED_MESSAGE = "Tin nhắn đã được thu hồi";
export const SOCKET_URL =
process.env.REACT_APP_SOCKET_SERVER_URL ||
process.env.REACT_APP_SOCKET_URL ||
process.env.VITE_SOCKET_URL ||
"https://socket-server-b5r4.onrender.com";

export const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
};

export const getRecallCacheKey = (userId) => `driverChatRecalledMessages:${userId || "guest"}`;

export const readRecalledMessageIds = (userId) => {
  try {
    const raw = localStorage.getItem(getRecallCacheKey(userId));
    const ids = JSON.parse(raw || "[]");
    return Array.isArray(ids) ? ids.map(String) : [];
  } catch {
    return [];
  }
};

export const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const isRecalledText = (value) => {
  const text = String(value || "").trim().toLowerCase();
  return (
    text === RECALLED_MESSAGE.toLowerCase() ||
    text === "tin nhắn đã thu hồi" ||
    text === "message recalled" ||
    text === "recalled");

};

export const isMessageRecalled = (message = {}) =>
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
  lastMessageAt:
  box.lastMessageAt ??
  box.lastMessageCreatedAt ??
  box.lastMessageTime ??
  box.lastMessageDate ??
  box.updatedAt ??
  box.createdAt ??
  null,
  unreadCount: Number(box.unreadCount ?? box.unread_count ?? 0),
  unreadReceiverCount: Number(box.unreadReceiverCount || 0),
  unreadSenderCount: Number(box.unreadSenderCount || 0),
  displayName: box.displayName || `Hội thoại #${box.id ?? box.boxId ?? ""}`,
  lastMessage: box.lastMessage || ""
});

const getBoxActivityTime = (box = {}) => {
  const candidates = [
  box.lastMessageAt,
  box.lastMessageCreatedAt,
  box.lastMessageTime,
  box.lastMessageDate,
  box.updatedAt,
  box.createdAt];


  for (const value of candidates) {
    const time = new Date(value).getTime();
    if (Number.isFinite(time)) return time;
  }

  return 0;
};

export const sortBoxesByLatestActivity = (items = []) =>
items.
map((box, index) => ({ box, index, time: getBoxActivityTime(box) })).
sort((left, right) => right.time - left.time || left.index - right.index).
map(({ box }) => box);

export const normalizeBoxesResponse = (data) => {
  const boxes = Array.isArray(data?.boxes) ?
  data.boxes :
  Array.isArray(data?.data?.boxes) ?
  data.data.boxes :
  Array.isArray(data?.data) ?
  data.data :
  Array.isArray(data) ?
  data :
  [];

  return {
    boxes: sortBoxesByLatestActivity(boxes.map(normalizeBox).filter((box) => box.id)),
    next: data?.next ?? data?.data?.next ?? null
  };
};

export const normalizeMessage = (message = {}, boxId) => ({
  ...message,
  id: message.id ?? message.messageId ?? `local-${Date.now()}-${Math.random()}`,
  boxId: toNumber(message.boxId ?? boxId),
  message: message.message ?? message.body ?? "",
  senderId: toNumber(message.senderId),
  fullName: message.fullName || message.senderName || "Người dùng",
  createdAt: message.createdAt || new Date().toISOString(),
  recalled: isMessageRecalled(message)
});

export const normalizeMessagesResponse = (data, boxId) => {
  const messages = Array.isArray(data?.messages) ?
  data.messages :
  Array.isArray(data?.data?.messages) ?
  data.data.messages :
  Array.isArray(data?.data) ?
  data.data :
  Array.isArray(data) ?
  data :
  [];

  return {
    messages: messages.
    map((message) => normalizeMessage(message, boxId)).
    filter((message) => message.message || message.id),
    next: data?.next ?? data?.data?.next ?? null
  };
};

export const normalizeIncomingMessage = (payload = {}) => {
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
      createdAt: payload.createdAt
    },
    boxId
  );
};

export const getUnreadForViewer = (box, viewerId) => {
  const unreadCount = Number(box.unreadCount ?? box.unread_count ?? 0);
  if (unreadCount > 0) return unreadCount;
  if (!viewerId) return Math.max(Number(box.unreadReceiverCount || 0), Number(box.unreadSenderCount || 0));
  if (Number(box.receiverId) === Number(viewerId)) return Number(box.unreadReceiverCount || 0);
  if (Number(box.senderId) === Number(viewerId)) return Number(box.unreadSenderCount || 0);
  return 0;
};

export const zeroUnreadForViewer = (box, viewerId) => {
  if (Number(box.receiverId) === Number(viewerId)) return { ...box, unreadCount: 0, unreadReceiverCount: 0 };
  if (Number(box.senderId) === Number(viewerId)) return { ...box, unreadCount: 0, unreadSenderCount: 0 };
  return box;
};

export const getBoxPreview = (box, viewerId) => {
  if (!box.lastMessage) return "Chưa có tin nhắn";

  const senderName = Number(box.lastMessageSenderId) === Number(viewerId) ? "Bạn" : box.displayName;
  return `${senderName}: ${getImageUrlFromText(box.lastMessage) ? "Đã gửi một ảnh" : box.lastMessage}`;
};

export const getImageUrlFromText = (value) => {
  const text = String(value || "").trim();
  if (!/^https?:\/\//i.test(text)) return "";

  const withoutQuery = text.split("?")[0].toLowerCase();
  if (/\.(png|jpe?g|webp|gif|avif|bmp|svg)$/i.test(withoutQuery)) return text;
  if (text.includes("/image/upload/")) return text;

  return "";
};

export const getMessageImageUrl = (message = {}) =>
getImageUrlFromText(
  message.imageUrl ??
  message.image_url ??
  message.fileUrl ??
  message.file_url ??
  message.attachmentUrl ??
  message.attachment_url ??
  message.mediaUrl ??
  message.media_url ??
  message.url ??
  message.message ??
  message.body
);

export const appendUniqueMessages = (current, incoming) => {
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

export const sortMessagesOldestFirst = (items = []) =>
[...items].sort((left, right) => new Date(left.createdAt) - new Date(right.createdAt));

export const getInitials = (name = "") => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "BG";
  return parts.slice(-2).map((part) => part[0]).join("").toUpperCase();
};

export const formatTime = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
};