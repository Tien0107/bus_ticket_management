import { formatTime, isMessageRecalled, RECALLED_MESSAGE } from "./chatUtils";

export default function MessageList({
  loadingMessages,
  messageNext,
  messages,
  messagesEndRef,
  messagesScrollRef,
  onLoadOlder,
  onRecallMessage,
  peerTyping,
  viewerId,
}) {
  return (
    <div
      ref={messagesScrollRef}
      className="min-h-0 flex-1 overflow-y-auto bg-[#f8faf9] px-3 py-3 [scrollbar-color:#cbd5d1_transparent] [scrollbar-width:thin]"
    >
      {messageNext && (
        <div className="mb-3 text-center">
          <button
            type="button"
            onClick={onLoadOlder}
            className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-on-surface shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50"
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
        <div className="flex min-h-full flex-col justify-end gap-2.5">
          {messages.map((message) => {
            const mine = Number(message.senderId) === Number(viewerId);
            const recalled = isMessageRecalled(message);

            return (
              <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 shadow-[0_8px_22px_rgba(15,23,42,0.06)] ${
                    mine
                      ? "rounded-br-md bg-[#087b2f] text-white"
                      : "rounded-bl-md border border-slate-100 bg-white text-on-surface"
                  }`}
                >
                  {!mine && <p className="mb-1 text-[11px] font-extrabold text-primary">{message.fullName}</p>}
                  <p className={`whitespace-pre-wrap break-words text-[13px] leading-5 ${recalled ? "italic opacity-75" : ""}`}>
                    {recalled ? RECALLED_MESSAGE : message.message}
                  </p>
                  <div
                    className={`mt-1.5 flex items-center gap-2 text-[10.5px] font-semibold ${
                      mine ? "text-white/75" : "text-on-surface-variant"
                    }`}
                  >
                    <span>{formatTime(message.createdAt)}</span>
                    {mine && !recalled && !String(message.id).startsWith("tmp-") && (
                      <button
                        type="button"
                        onClick={() => onRecallMessage(message)}
                        className="font-bold text-white/80 underline-offset-2 transition hover:text-white hover:underline"
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
              <div className="rounded-full border border-slate-100 bg-white px-3.5 py-2 text-xs font-semibold text-on-surface-variant shadow-sm">
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
  );
}
