import React, { useState, useRef, useEffect, useCallback } from "react";
import { getStoredToken, getStoredUser } from "../../utils/authStorage";
import { normalizeRole } from "../../pages/login/authUtils";

/**
 * Deep clone helper — tuân thủ nghiêm ngặt "Lưu ý khi copy state"
 * - Phải paste toàn bộ object state, không được thiếu field
 * - Đừng sửa gì trong state (luôn làm việc với bản copy)
 * - Sau khi server trả response mới, lại copy state mới cho lần gửi sau
 */
function cloneState(state) {
  if (state == null || typeof state !== "object") {
    return state ?? null;
  }
  try {
    if (typeof structuredClone === "function") {
      return structuredClone(state);
    }
    return JSON.parse(JSON.stringify(state));
  } catch {
    // Fallback an toàn nhất có thể (shallow)
    if (Array.isArray(state)) return [...state];
    return { ...state };
  }
}

/**
 * Trích xuất quick options từ currentState theo các key phổ biến trong flow đặt vé.
 * Hỗ trợ nhiều dạng: {id, label}, string, number...
 */
function getQuickOptions(state) {
  if (!state || typeof state !== "object") return [];

  const candidateKeys = ["scheduleOptions", "pickupOptions", "dropoffOptions", "seatOptions"];

  for (const key of candidateKeys) {
    const raw = state[key];
    if (Array.isArray(raw) && raw.length > 0) {
      return raw.map((item, index) => {
        if (item == null) return { label: String(index + 1), value: String(index + 1) };

        const label =
          typeof item === "string"
            ? item
            : item.label ||
              item.name ||
              item.title ||
              item.display ||
              item.text ||
              String(item.id ?? index + 1);

        // Ưu tiên id (thường là số hoặc mã), fallback về 1-based index
        const value = String(item.id ?? item.value ?? item.code ?? index + 1);

        return { label: String(label), value };
      });
    }
  }
  return [];
}

/**
 * Lấy text trả lời từ response (hỗ trợ contract chính thức + vài fallback)
 */
function getReplyText(data) {
  if (typeof data === "string") return data;
  if (!data) return "Xin lỗi nhé, mình chưa nắm được phản hồi từ trợ lý.";

  return (
    data.message ||
    data.reply ||
    data.answer ||
    data.content ||
    data.text ||
    (data.data && (data.data.message || data.data.reply)) ||
    "Xin lỗi bạn, mình chưa nắm rõ phản hồi. Bạn hỏi lại nhé?"
  );
}

/**
 * Component AiBookingChat
 * Tích hợp chat AI đặt vé xe với quản lý state nghiêm ngặt theo quy tắc:
 *   - Lần đầu: chỉ gửi { message }
 *   - Lần sau: gửi { message, state: <nguyên object state từ response trước (đã clone)> }
 */
export const AiBookingChat = ({ token, baseUrl = "http://localhost:3000", onBookingCreated }) => {
  // === KIỂM TRA ĐĂNG NHẬP (phải làm trước mọi hooks) ===
  // Component chỉ được sử dụng sau khi login thành công (customer)
  // Nếu không có token prop thì tự động lấy từ storage (giống AiChatWidget)
  const effectiveToken = token || getStoredToken();
  const storedUser = getStoredUser({});
  const isCustomer = !!effectiveToken && normalizeRole(storedUser?.role) === "customer";

  // TẤT CẢ HOOKS PHẢI ĐƯỢC GỌI UNCONDITIONALLY (theo đúng thứ tự mỗi lần render)
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Chào bạn! Mình là trợ lý đặt vé BusGo. Mình sẽ giúp bạn chọn tuyến, chuyến, điểm đón/trả và ghế ngồi một cách dễ dàng nhé. Bạn muốn đi đâu hôm nay ạ?",
    },
  ]);
  const [currentState, setCurrentState] = useState(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);

  // Auto scroll xuống dưới mỗi khi có tin nhắn mới hoặc loading thay đổi
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, loading, currentState]);

  const currentQuickOptions = getQuickOptions(currentState);

  // Gửi tin nhắn đến AI (tuân thủ nghiêm ngặt quy tắc state)
  // useCallback PHẢI được gọi trước mọi early return theo React rules
  const sendMessage = useCallback(
    async (messageText) => {
      const trimmed = messageText.trim();
      if (!trimmed || loading || !effectiveToken) return;

      // 1. Thêm user message vào lịch sử ngay (optimistic UI)
      const userMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: trimmed,
      };
      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setLoading(true);
      setError(null);

      try {
        // 2. Xây dựng payload theo quy tắc VÀNG
        const payload = { message: trimmed };

        if (currentState != null) {
          // Từ lần 2 trở đi: paste NGUYÊN object state (đã deep clone)
          // → Không thiếu field, không mutate, snapshot sạch tại thời điểm gửi
          payload.state = cloneState(currentState);
        }
        // Lần đầu (currentState == null): chỉ có { message }

        // 3. Gọi API
        const url = `${baseUrl.replace(/\/$/, "")}/chat/ai`;
        const res = await fetch(url, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${effectiveToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errText = await res.text().catch(() => "");
          throw new Error(errText || `Lỗi từ server: ${res.status}`);
        }

        const data = await res.json();

        // 4. Lấy text trả lời + cập nhật state MỚI từ response
        const assistantText = getReplyText(data);
        const newState = data?.state ?? data?.data?.state ?? null;

        const assistantMessage = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: assistantText,
        };

        setMessages((prev) => [...prev, assistantMessage]);

        // Cập nhật currentState = bản clone của state mới nhận được
        // (đảm bảo lần gửi tiếp theo dùng đúng state mới nhất, toàn vẹn)
        if (newState) {
          setCurrentState(cloneState(newState));
        }

        // 5. Nếu server báo booking_created → gọi callback (nếu có)
        const bookingId = newState?.bookingId ?? data?.bookingId;
        if (
          (newState?.stage === "booking_created" || data?.stage === "booking_created") &&
          bookingId != null &&
          onBookingCreated
        ) {
          // Gọi callback với bookingId và toàn bộ state hiện tại
          onBookingCreated(Number(bookingId), newState ?? currentState);
        }
      } catch (err) {
        const errorMsg = err?.message || "Xin lỗi, mình đang gặp vấn đề kết nối. Bạn thử lại nhé!";
        setError(errorMsg);

        // Thêm message lỗi vào chat để người dùng thấy
        setMessages((prev) => [
          ...prev,
          {
            id: `error-${Date.now()}`,
            role: "assistant",
            content: `⚠️ ${errorMsg}`,
          },
        ]);
      } finally {
        setLoading(false);
        // Focus lại input sau khi xong
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    },
    [currentState, loading, effectiveToken, baseUrl, onBookingCreated]
  );

  // === SAU KHI CÓ ĐỦ HOOKS, mới được return sớm ===
  if (!isCustomer || !effectiveToken) {
    return (
      <div className="flex h-[620px] w-full max-w-[420px] flex-col items-center justify-center overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
          <span className="material-symbols-outlined text-4xl">lock</span>
        </div>
        <div className="text-lg font-semibold text-slate-700">Vui lòng đăng nhập</div>
        <p className="mt-2 max-w-[260px] text-sm text-slate-500">
          Tính năng Trợ lý đặt vé BusGo chỉ dành cho khách hàng đã đăng nhập.
        </p>
        <a
          href="/login"
          className="mt-5 inline-flex items-center rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-700"
        >
          Đăng nhập ngay
        </a>
      </div>
    );
  }

  // Gửi từ input
  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  // Click chip nhanh → gửi value (số hoặc text phù hợp)
  const handleQuickOptionClick = (option) => {
    sendMessage(option.value);
  };

  // Làm mới toàn bộ cuộc trò chuyện (reset state)
  const handleReset = () => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content:
          "Chào bạn! Mình là trợ lý đặt vé BusGo. Mình sẽ giúp bạn chọn tuyến, chuyến, điểm đón/trả và ghế ngồi một cách dễ dàng nhé. Bạn muốn đi đâu hôm nay ạ?",
      },
    ]);
    setCurrentState(null);
    setInput("");
    setError(null);
    setLoading(false);
    inputRef.current?.focus();
  };

  // Render quick chips (nếu state hiện tại có options)
  const renderQuickChips = () => {
    if (currentQuickOptions.length === 0) return null;

    return (
      <div className="px-3 pb-2">
        <div className="text-[11px] font-medium text-slate-500 mb-1.5 px-1">Chọn nhanh:</div>
        <div className="flex flex-wrap gap-2">
          {currentQuickOptions.map((opt, idx) => (
            <button
              key={`${opt.value}-${idx}`}
              type="button"
              onClick={() => handleQuickOptionClick(opt)}
              disabled={loading}
              className="px-3 py-1.5 text-sm rounded-full border border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50 active:bg-emerald-100 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    );
  };

  // Render card thành công khi booking đã được tạo
  const renderSuccessCard = () => {
    if (!currentState || currentState.stage !== "booking_created") return null;

    const bookingId = currentState.bookingId ?? currentState.booking_id;
    if (bookingId == null) return null;

    return (
      <div className="mx-3 mb-3 rounded-2xl border-2 border-emerald-300 bg-emerald-50 p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
            <span className="material-symbols-outlined text-xl">check_circle</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-emerald-800 text-base">Đặt vé thành công!</div>
            <div className="mt-1 text-sm text-emerald-700">
              Mã booking của bạn: <span className="font-mono font-semibold">#{bookingId}</span>
            </div>
            <button
              type="button"
              onClick={() => onBookingCreated?.(Number(bookingId), currentState)}
              className="mt-3 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-700 active:scale-[0.985] transition"
            >
              Tiến hành thanh toán
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </button>
            <div className="mt-2 text-[11px] text-emerald-600/80">
              Bạn cũng có thể thanh toán sau trong mục "Vé của tôi".
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Badge stage (dùng để debug – có thể ẩn sau)
  const renderStageBadge = () => {
    const stage = currentState?.stage || "start";
    return (
      <span className="ml-2 inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500 ring-1 ring-inset ring-slate-200">
        stage: {stage}
      </span>
    );
  };

  return (
    <div className="flex h-[620px] w-full max-w-[420px] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 bg-white px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <span className="material-symbols-outlined text-[22px]">smart_toy</span>
          </div>
          <div>
            <div className="flex items-center text-base font-extrabold text-slate-900">
              Trợ lý đặt vé BusGo
              {renderStageBadge()}
            </div>
            <div className="text-[11px] text-emerald-600 font-medium">BusGo • Hỗ trợ 24/7</div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 active:bg-slate-100 transition"
          title="Làm mới cuộc trò chuyện"
        >
          <span className="material-symbols-outlined text-base">refresh</span>
          Làm mới
        </button>
      </div>

      {/* Messages area */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto bg-[#f8fafc] px-3 py-4 [scrollbar-width:thin] [scrollbar-color:#cbd5e1_transparent]"
      >
        <div className="flex flex-col gap-3">
          {messages.map((msg, index) => {
            const isUser = msg.role === "user";
            const isLastAssistant =
              msg.role === "assistant" && index === messages.length - 1 && !loading;

            if (isUser) {
              return (
                <div key={msg.id} className="flex justify-end">
                  <div className="max-w-[82%] rounded-2xl rounded-br-md bg-emerald-600 px-3.5 py-2.5 text-[13.5px] leading-[1.35] text-white shadow-sm">
                    <p className="whitespace-pre-line break-words">{msg.content}</p>
                  </div>
                </div>
              );
            }

            return (
              <div key={msg.id} className="flex items-start gap-2">
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <span className="material-symbols-outlined text-[15px]">smart_toy</span>
                </div>
                <div className="max-w-[78%] rounded-2xl rounded-bl-md border border-emerald-200 bg-emerald-50/70 px-3.5 py-2.5 text-[13.5px] leading-[1.35] text-slate-800 shadow-sm">
                  <p className="whitespace-pre-line break-words">{msg.content}</p>

                  {/* Quick chips chỉ hiện dưới message AI cuối cùng (khi có options) */}
                  {isLastAssistant && currentQuickOptions.length > 0 && (
                    <div className="mt-3 -mx-1">{renderQuickChips()}</div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Loading / typing indicator */}
          {loading && (
            <div className="flex items-start gap-2">
              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <span className="material-symbols-outlined text-[15px]">smart_toy</span>
              </div>
              <div className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50/70 px-4 py-2 text-sm text-emerald-700 shadow-sm">
                <span className="flex gap-1">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-500 [animation-delay:-0.3s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-500 [animation-delay:-0.15s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-500" />
                </span>
                Đang suy nghĩ...
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Success card (khi đã tạo booking) */}
      {renderSuccessCard()}

      {/* Quick options (nếu không gắn trực tiếp vào message cuối) - dự phòng */}
      {currentQuickOptions.length > 0 &&
        messages[messages.length - 1]?.role === "assistant" &&
        !loading && (
          <div className="-mt-1">{/* chips đã được render bên trong bubble ở trên */}</div>
        )}

      {/* Error banner (nếu có) */}
      {error && !loading && (
        <div className="mx-3 mb-2 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600 ring-1 ring-red-100">
          {error}
        </div>
      )}

      {/* Input area */}
      <form onSubmit={handleSubmit} className="shrink-0 border-t border-slate-100 bg-white p-3">
        <div className="flex items-center gap-2 rounded-2xl bg-slate-50 p-1 ring-1 ring-slate-200 focus-within:ring-emerald-200">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={loading ? "Đang xử lý..." : "Nhập tin nhắn hoặc chọn nút nhanh..."}
            disabled={loading}
            className="flex-1 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-slate-400 disabled:cursor-not-allowed"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                // Enter đã được form xử lý
              }
            }}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
            aria-label="Gửi tin nhắn"
          >
            <span className="material-symbols-outlined text-[19px]">send</span>
          </button>
        </div>
        <div className="mt-1.5 text-center text-[10px] text-slate-400">
          Nhấn Enter để gửi • Trợ lý AI có thể cần vài giây để phản hồi
        </div>
      </form>
    </div>
  );
};

export default AiBookingChat;
