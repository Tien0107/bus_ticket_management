import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import ChatBoxList from "./ChatBoxList";
import CreateChatForm from "./CreateChatForm";
import MessageInput from "./MessageInput";
import MessageList from "./MessageList";
import {
  appendUniqueMessages,
  getRecallCacheKey,
  getStoredUser,
  getUnreadForViewer,
  normalizeBoxesResponse,
  normalizeMessage,
  normalizeMessagesResponse,
  normalizeSearchValue,
  normalizeUsersResponse,
  PAGE_SIZE,
  readRecalledMessageIds,
  RECALLED_MESSAGE,
  sortMessagesOldestFirst,
  zeroUnreadForViewer,
} from "./chatUtils";
import useChatSocket from "./useChatSocket";

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
  const [typingByBox, setTypingByBox] = useState(() => ({}));
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

  const selectedPeerOnline = selectedPeerId ? onlineUserIds.has(Number(selectedPeerId)) : false;

  const filteredRecipientUsers = useMemo(() => {
    const keyword = normalizeSearchValue(recipientSearch.trim());
    if (!keyword) return recipientUsers;

    return recipientUsers.filter((user) =>
      [user.fullName, user.email, user.phone, user.role, user.username, user.id]
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
      const response = await getUsers();
      const data = normalizeUsersResponse(response.data, viewerId);
      setRecipientUsers(data.users);
    } catch (err) {
      console.error("Lỗi tải danh sách người nhận:", err);
      addToast(err.response?.data?.message || "Không thể tải danh sách người nhận", "error");
    } finally {
      setLoadingRecipients(false);
    }
  }, [addToast, viewerId]);

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
  });

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
                <CreateChatForm
                  filteredRecipientUsers={filteredRecipientUsers}
                  firstMessage={firstMessage}
                  loadingRecipients={loadingRecipients}
                  onFirstMessageChange={(event) => setFirstMessage(event.target.value)}
                  onReceiverChange={setReceiverId}
                  onRecipientSearchChange={(event) => setRecipientSearch(event.target.value)}
                  onSubmit={handleCreateBox}
                  receiverId={receiverId}
                  recipientSearch={recipientSearch}
                  selectedRecipient={selectedRecipient}
                />
              )}

              <ChatBoxList
                boxes={boxes}
                boxNext={boxNext}
                loadingBoxes={loadingBoxes}
                onLoadMore={() => loadBoxes({ reset: false, next: boxNext })}
                onSelectBox={setSelectedBoxId}
                onlineUserIds={onlineUserIds}
                viewerId={viewerId}
              />
            </div>
          ) : (
            <>
              <MessageList
                loadingMessages={loadingMessages}
                messageNext={messageNext}
                messages={messages}
                messagesEndRef={messagesEndRef}
                onLoadOlder={() => loadMessages({ boxId: selectedBoxId, reset: false, next: messageNext })}
                onRecallMessage={handleRecallMessage}
                peerTyping={peerTyping}
                viewerId={viewerId}
              />

              <MessageInput
                composeValue={composeValue}
                onChange={handleComposeChange}
                onStopTyping={stopTyping}
                onSubmit={handleSendMessage}
              />
            </>
          )}
        </section>
      )}
    </div>
  );
}
