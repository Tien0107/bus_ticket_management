import { useEffect, useRef, useState } from "react";
import { sendAiChatMessage } from "../../api/chat";
import { useToast } from "../../context/ToastContext";
import { getStoredToken, getStoredUser } from "../../utils/authStorage";
import { normalizeRole } from "../../pages/login/authUtils";

const createMessage = (role, content) => ({
  id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  role,
  content,
  createdAt: new Date().toISOString(),
});

const getAiReplyText = (data) => {
  if (typeof data === "string") return data;

  const candidates = [
    data?.message,
    data?.reply,
    data?.answer,
    data?.content,
    data?.response,
    data?.result,
    data?.data,
    data?.data?.message,
    data?.data?.reply,
    data?.data?.answer,
    data?.data?.content,
    data?.data?.response,
    data?.data?.result,
    data?.choices?.[0]?.message?.content,
    data?.data?.choices?.[0]?.message?.content,
  ];

  const reply = candidates.find((value) => typeof value === "string" && value.trim());
  return reply?.trim() || "Mình chưa nhận được phản hồi từ trợ lý AI.";
};

const getCurrentCustomerAccess = () => {
  const token = getStoredToken();
  const user = getStoredUser(null);
  return Boolean(token && normalizeRole(user?.role) === "customer");
};

export default function AiChatWidget() {
  const { addToast } = useToast();
  const [canUseAi, setCanUseAi] = useState(getCurrentCustomerAccess);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState(() => [
    createMessage("assistant", "Xin chào, mình có thể hỗ trợ bạn về đặt vé và chuyến đi."),
  ]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const syncAccess = () => {
      const nextCanUseAi = getCurrentCustomerAccess();
      setCanUseAi(nextCanUseAi);
      if (!nextCanUseAi) {
        setOpen(false);
      }
    };

    window.addEventListener("storage", syncAccess);
    window.addEventListener("focus", syncAccess);
    window.addEventListener("pageshow", syncAccess);
    window.addEventListener("busgo:user-updated", syncAccess);

    return () => {
      window.removeEventListener("storage", syncAccess);
      window.removeEventListener("focus", syncAccess);
      window.removeEventListener("pageshow", syncAccess);
      window.removeEventListener("busgo:user-updated", syncAccess);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open, sending]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const message = draft.trim();
    if (!message || sending || !canUseAi) return;
    if (!getCurrentCustomerAccess()) {
      setCanUseAi(false);
      setOpen(false);
      return;
    }

    setDraft("");
    setSending(true);
    setMessages((current) => [...current, createMessage("customer", message)]);

    try {
      const response = await sendAiChatMessage({ message });
      setMessages((current) => [...current, createMessage("assistant", getAiReplyText(response.data))]);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || "Không thể gửi tin nhắn đến trợ lý AI";
      addToast(errorMessage, "error");
      setMessages((current) => [
        ...current,
        createMessage("assistant", "Trợ lý AI đang gặp lỗi kết nối. Vui lòng thử lại sau."),
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key !== "Enter" || event.shiftKey || event.isComposing) return;
    event.preventDefault();
    event.currentTarget.form?.requestSubmit();
  };

  if (!canUseAi) return null;

  return (
    <div className="fixed bottom-[92px] right-5 z-50 flex flex-col items-end gap-3">
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="relative inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-[0_14px_34px_rgba(0,128,43,0.28)] ring-4 ring-white transition-all hover:-translate-y-0.5 hover:bg-primary/90"
          aria-label="Mở trợ lý AI"
          title="Trợ lý AI"
        >
          <span className="material-symbols-outlined text-[28px]">smart_toy</span>
        </button>
      )}

      {open && (
        <section className="flex h-[min(540px,calc(100vh-116px))] w-[min(360px,calc(100vw-24px))] flex-col overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-[0_22px_60px_rgba(15,23,42,0.18)]">
          <div className="flex h-[58px] shrink-0 items-center justify-between border-b border-slate-100 bg-white px-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <span className="material-symbols-outlined text-[22px]">smart_toy</span>
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-base font-extrabold leading-5 text-on-surface">Trợ lý AI</h2>
                <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs font-semibold text-on-surface-variant">
                  <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                  Sẵn sàng hỗ trợ
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-primary transition hover:bg-emerald-50"
              aria-label="Đóng trợ lý AI"
              title="Đóng"
            >
              <span className="material-symbols-outlined text-[23px]">close</span>
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto bg-[#fbfdfc] px-3 py-3 [scrollbar-color:#cbd5d1_transparent] [scrollbar-width:thin]">
            <div className="flex min-h-full flex-col justify-end gap-2.5">
              {messages.map((message) => {
                const mine = message.role === "customer";
                return (
                  <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-[13px] font-medium leading-5 shadow-[0_8px_22px_rgba(15,23,42,0.06)] ${
                        mine
                          ? "rounded-br-md bg-[#087b2f] text-white"
                          : "rounded-bl-md border border-slate-100 bg-white text-on-surface"
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{message.content}</p>
                    </div>
                  </div>
                );
              })}

              {sending && (
                <div className="flex justify-start">
                  <div className="inline-flex items-center gap-2 rounded-full border border-slate-100 bg-white px-3.5 py-2 text-xs font-semibold text-on-surface-variant shadow-sm">
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
                    Đang phản hồi...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="shrink-0 border-t border-slate-100 bg-white px-2.5 py-2.5">
            <div className="flex items-end gap-2 rounded-2xl bg-[#f8faf9] p-1 ring-1 ring-slate-200 focus-within:ring-2 focus-within:ring-primary/25">
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={handleKeyDown}
                className="max-h-24 min-h-9 flex-1 resize-none border-0 bg-transparent px-2.5 py-2 text-sm leading-5 outline-none placeholder:text-slate-400"
                placeholder={sending ? "Đang gửi..." : "Nhập tin nhắn..."}
                rows={1}
                disabled={sending}
              />
              <button
                type="submit"
                disabled={!draft.trim() || sending}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-[0_8px_20px_rgba(0,128,43,0.22)] transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-emerald-200 disabled:shadow-none"
                aria-label="Gửi tin nhắn đến trợ lý AI"
              >
                <span className="material-symbols-outlined text-[20px]">send</span>
              </button>
            </div>
          </form>
        </section>
      )}
    </div>
  );
}
