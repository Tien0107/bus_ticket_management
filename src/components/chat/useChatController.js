import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
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
import {
  getChatRecipientSearchQueries,
  mergeUniqueUsers,
  normalizeSearchValue,
  normalizeUsersResponse,
} from "./chatRecipientUtils";
import {
  appendUniqueMessages,
  getRecallCacheKey,
  getStoredUser,
  getUnreadForViewer,
  normalizeBoxesResponse,
  normalizeMessage,
  normalizeMessagesResponse,
  PAGE_SIZE,
  readRecalledMessageIds,
  RECALLED_MESSAGE,
  sortBoxesByLatestActivity,
  sortMessagesOldestFirst,
  toNumber,
  zeroUnreadForViewer,
} from "./chatUtils";
import useChatSocket from "./useChatSocket";

const MAX_RECIPIENT_QUERY_PAGES = 8;

const getSentMessagePayload = (data) => {
  const candidates = [
    data?.message,
    data?.chatMessage,
    data?.data?.message,
    data?.data?.chatMessage,
    data?.data,
  ];

  return candidates.find((candidate) => candidate && typeof candidate === "object" && !Array.isArray(candidate)) || null;
};

export default function useChatController() {
  const { addToast } = useToast();
  const [currentUser] = useState(getStoredUser);
  const [token] = useState(() => localStorage.getItem("token"));
  const viewerId = currentUser?.id ? Number(currentUser.id) : null;
  const isAuthenticated = Boolean(currentUser?.id && token);
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
  const [typingByBox, setTypingByBox] = useState(() => ({}));
  const [recalledMessageIds, setRecalledMessageIds] = useState(
    () => new Set(readRecalledMessageIds(viewerId))
  );

  const socketRef = useRef(null);
  const selectedBoxRef = useRef(null);
  const activeBoxRef = useRef(null);
  const messagesScrollRef = useRef(null);
  const messagesEndRef = useRef(null);
  const olderScrollSnapshotRef = useRef(null);
  const skipNextAutoScrollRef = useRef(false);
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

  const selectedPeerOnline = selectedPeerId ? onlineUserIds.has(Number(selectedPeerId)) : false;

  const filteredRecipientUsers = useMemo(() => {
    const keyword = normalizeSearchValue(recipientSearch.trim());
    if (!keyword) return recipientUsers;

    return recipientUsers.filter((user) =>
      [user.fullName, user.email, user.phone, user.role, user.staffProfileRole, user.username, user.id]
        .filter(Boolean)
        .some((value) => normalizeSearchValue(value).includes(keyword))
    );
  }, [recipientSearch, recipientUsers]);

  const selectedRecipient = useMemo(
    () => recipientUsers.find((user) => String(user.id) === String(receiverId)) || null,
    [receiverId, recipientUsers]
  );

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
      if (!isAuthenticated) {
        setBoxes([]);
        setBoxNext(null);
        setLoadingBoxes(false);
        return;
      }

      try {
        setLoadingBoxes(reset);
        const response = await getChatBoxes({ limit: PAGE_SIZE, ...(next ? { next } : {}) });
        const data = normalizeBoxesResponse(response.data);

        setBoxes((current) => {
          if (reset) return data.boxes;
          const known = new Set(current.map((box) => String(box.id)));
          return sortBoxesByLatestActivity([
            ...current,
            ...data.boxes.filter((box) => !known.has(String(box.id))),
          ]);
        });
        setBoxNext(data.next);
      } catch (err) {
        console.error("Lỗi tải hội thoại:", err);
        addToast(err.response?.data?.message || "Không thể tải hội thoại", "error");
      } finally {
        setLoadingBoxes(false);
      }
    },
    [addToast, isAuthenticated]
  );

  const loadRecipients = useCallback(async () => {
    const keyword = recipientSearch.trim();

    if (!keyword) {
      setRecipientUsers([]);
      setReceiverId("");
      return;
    }

    try {
      setLoadingRecipients(true);
      const recipientQueries = getChatRecipientSearchQueries(keyword);

      if (!recipientQueries.length) {
        setRecipientUsers([]);
        setReceiverId("");
        return;
      }

      const loadRecipientQueryPages = async (params) => {
        const scopedCompanyId = toNumber(params?.companyId);
        const loadedUsers = [];
        const seenNext = new Set();
        let next = params?.next ?? null;

        for (let page = 0; page < MAX_RECIPIENT_QUERY_PAGES; page += 1) {
          const response = await getUsers({ ...params, ...(next ? { next } : {}) });
          const data = normalizeUsersResponse(response.data, viewerId);

          loadedUsers.push(
            ...data.users.map((user) => ({
              ...user,
              companyId: user.companyId ?? scopedCompanyId,
            }))
          );

          if (!data.next) break;

          const nextKey = String(data.next);
          if (seenNext.has(nextKey)) break;

          seenNext.add(nextKey);
          next = data.next;
        }

        return loadedUsers;
      };

      const responses = await Promise.allSettled(
        recipientQueries.map((params) => loadRecipientQueryPages(params))
      );
      const successfulResponses = responses.filter((result) => result.status === "fulfilled");

      if (!successfulResponses.length) {
        throw responses.find((result) => result.status === "rejected")?.reason;
      }

      const users = mergeUniqueUsers(
        responses.flatMap((result) => {
          if (result.status !== "fulfilled") return [];
          return result.value;
        })
      );

      setRecipientUsers(users);
      setReceiverId((currentReceiverId) =>
        users.some((user) => String(user.id) === String(currentReceiverId)) ? currentReceiverId : ""
      );
    } catch (err) {
      console.error("Lỗi tải danh sách người nhận:", err);
      addToast(err.response?.data?.message || "Không thể tải danh sách người nhận", "error");
    } finally {
      setLoadingRecipients(false);
    }
  }, [addToast, recipientSearch, viewerId]);

  const loadMessages = useCallback(
    async ({ boxId, reset = true, next = null, silent = false } = {}) => {
      if (!boxId || !isAuthenticated) return;

      try {
        if (!silent) setLoadingMessages(reset);
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
        if (!silent) setLoadingMessages(false);
      }
    },
    [addToast, applyRecallCache, isAuthenticated]
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

  useChatSocket({
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
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      setLoadingBoxes(false);
      return;
    }

    loadBoxes({ reset: true });
  }, [isAuthenticated, loadBoxes]);

  useEffect(() => {
    if (!open || !showCreate) {
      setRecipientUsers([]);
      setReceiverId("");
      return undefined;
    }

    const timer = window.setTimeout(loadRecipients, 350);
    return () => window.clearTimeout(timer);
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

  useLayoutEffect(() => {
    const snapshot = olderScrollSnapshotRef.current;
    const scroller = messagesScrollRef.current;

    if (!snapshot || !scroller) return;

    scroller.scrollTop = Math.max(0, scroller.scrollHeight - snapshot.scrollHeight + snapshot.scrollTop);
    olderScrollSnapshotRef.current = null;
  }, [messages.length]);

  useEffect(() => {
    if (skipNextAutoScrollRef.current) {
      skipNextAutoScrollRef.current = false;
      return;
    }

    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, selectedBoxId]);

  const stopTyping = useCallback(() => {
    if (!typingActiveRef.current || !selectedBoxId) return;
    socketRef.current?.emit("chat:typing:stop", { boxId: selectedBoxId });
    typingActiveRef.current = false;
  }, [selectedBoxId]);

  const handleComposeChange = useCallback(
    (event) => {
      setComposeValue(event.target.value);
      if (!selectedBoxId || !socketRef.current?.connected) return;

      if (!typingActiveRef.current) {
        socketRef.current.emit("chat:typing:start", { boxId: selectedBoxId });
        typingActiveRef.current = true;
      }

      window.clearTimeout(typingTimerRef.current);
      typingTimerRef.current = window.setTimeout(stopTyping, 1200);
    },
    [selectedBoxId, stopTyping]
  );

  const handleSendMessage = useCallback(
    async (event) => {
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
        sortBoxesByLatestActivity(
          current.map((box) =>
            Number(box.id) === Number(selectedBoxId)
              ? { ...box, lastMessage: text, lastMessageSenderId: currentUser.id, lastMessageAt: createdAt }
              : box
          )
        )
      );

      try {
        const response = await sendChatMessage(selectedBoxId, { message: text });
        const sentMessagePayload = getSentMessagePayload(response.data);
        if (sentMessagePayload) {
          const sentMessage = normalizeMessage(
            {
              ...sentMessagePayload,
              boxId: selectedBoxId,
              message: sentMessagePayload.message ?? sentMessagePayload.body ?? text,
              senderId: sentMessagePayload.senderId ?? currentUser.id,
              fullName: sentMessagePayload.fullName || sentMessagePayload.senderName || currentUser.fullName,
              createdAt: sentMessagePayload.createdAt || createdAt,
            },
            selectedBoxId
          );

          setMessages((current) =>
            current.map((message) => (String(message.id) === String(optimisticMessage.id) ? sentMessage : message))
          );
        }

        socketRef.current?.emit("chat:message:send", {
          body: text,
          message: text,
          boxId: selectedBoxId,
          createdAt,
          senderName: currentUser.fullName || "Người dùng",
          senderId: currentUser.id,
        });
        if (!sentMessagePayload) {
          window.setTimeout(() => {
            loadMessages({ boxId: selectedBoxId, reset: true, silent: true });
          }, 300);
        }
      } catch (err) {
        console.error("Lỗi gửi tin nhắn:", err);
        addToast(err.response?.data?.message || "Gửi tin nhắn thất bại", "error");
      }
    },
    [addToast, composeValue, currentUser, loadMessages, selectedBoxId, stopTyping]
  );

  const handleCreateBox = useCallback(
    async (event) => {
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
    },
    [addToast, firstMessage, loadBoxes, receiverId]
  );

  const handleRecallMessage = useCallback(
    async (message) => {
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
      } catch (err) {
        console.error("Lỗi thu hồi tin nhắn:", err);
        addToast(err.response?.data?.message || "Thu hồi tin nhắn thất bại", "error");
      }
    },
    [addToast, rememberRecalledMessageId, selectedBoxId]
  );

  const handleClose = useCallback(() => {
    setOpen(false);
    setShowCreate(false);
    setSelectedBoxId(null);
  }, []);

  const handleRecipientSearchChange = useCallback((event) => {
    const value = event.target.value;
    setRecipientSearch(value);
    setReceiverId("");

    if (!value.trim()) {
      setRecipientUsers([]);
    }
  }, []);

  const handleFirstMessageChange = useCallback((event) => {
    setFirstMessage(event.target.value);
  }, []);

  const handleLoadMoreBoxes = useCallback(() => {
    loadBoxes({ reset: false, next: boxNext });
  }, [boxNext, loadBoxes]);

  const handleLoadOlderMessages = useCallback(async () => {
    if (!selectedBoxId || !messageNext) return;

    const scroller = messagesScrollRef.current;
    if (scroller) {
      olderScrollSnapshotRef.current = {
        scrollHeight: scroller.scrollHeight,
        scrollTop: scroller.scrollTop,
      };
      skipNextAutoScrollRef.current = true;
    }

    await loadMessages({ boxId: selectedBoxId, reset: false, next: messageNext });

    window.requestAnimationFrame(() => {
      if (olderScrollSnapshotRef.current) {
        olderScrollSnapshotRef.current = null;
        skipNextAutoScrollRef.current = false;
      }
    });
  }, [loadMessages, messageNext, selectedBoxId]);

  return {
    boxNext,
    boxes,
    composeValue,
    filteredRecipientUsers,
    firstMessage,
    handleClose,
    handleComposeChange,
    handleCreateBox,
    handleFirstMessageChange,
    handleLoadMoreBoxes,
    handleLoadOlderMessages,
    handleRecallMessage,
    handleRecipientSearchChange,
    handleSendMessage,
    loadingBoxes,
    loadingMessages,
    loadingRecipients,
    messageNext,
    messages,
    messagesEndRef,
    messagesScrollRef,
    isAuthenticated,
    onlineUserIds,
    open,
    peerTyping,
    receiverId,
    recipientSearch,
    selectedBox,
    selectedPeerOnline,
    selectedRecipient,
    setOpen,
    setReceiverId,
    setSelectedBoxId,
    setShowCreate,
    showCreate,
    socketError,
    stopTyping,
    totalUnread,
    viewerId,
  };
}
