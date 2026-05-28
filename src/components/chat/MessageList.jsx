import { useState } from "react";
import { formatTime, getMessageImageUrl, isMessageRecalled, RECALLED_MESSAGE } from "./chatUtils";

const formatMessageDateTime = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return formatTime(value);

  return date.toLocaleString("en-US", {
    month: "numeric",
    day: "numeric",
    year: "2-digit",
    hour: "numeric",
    minute: "2-digit",
  });
};

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
  const [activeMetaMessageId, setActiveMetaMessageId] = useState(null);

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
            const imageUrl = getMessageImageUrl(message);
            const messageKey = String(message.id);
            const isImageMessage = Boolean(imageUrl && !recalled);
            const metaVisible = activeMetaMessageId === messageKey;
            const toggleMeta = () => {
              setActiveMetaMessageId((current) => (current === messageKey ? null : messageKey));
            };
            const metaClassName = `pointer-events-none absolute top-full z-10 mt-1.5 flex max-w-[240px] items-center gap-2 whitespace-nowrap rounded-xl bg-slate-900 px-3 py-1.5 text-[11px] font-bold text-white opacity-0 shadow-[0_12px_24px_rgba(15,23,42,0.22)] transition-all duration-150 group-hover:opacity-100 group-focus-within:opacity-100 ${
              mine ? "right-0" : "left-0"
            } ${metaVisible ? "opacity-100" : ""
            }`;
            const bubbleClassName = `group relative cursor-pointer outline-none ${
              imageUrl && !recalled
                ? "rounded-2xl bg-white shadow-[0_10px_24px_rgba(15,23,42,0.10)] ring-1 ring-slate-100"
                : `rounded-2xl px-3.5 py-2.5 shadow-[0_8px_22px_rgba(15,23,42,0.06)] ${
                    mine
                      ? "rounded-br-md bg-[#087b2f] text-white"
                      : "rounded-bl-md border border-slate-100 bg-white text-on-surface"
                  }`
            }`;

            return (
              <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`flex max-w-[78%] flex-col ${mine ? "items-end" : "items-start"}`}>
                  {!mine && (
                    <p className={`text-[11px] font-extrabold text-primary ${isImageMessage ? "mb-1 ml-1" : "mb-1"}`}>
                      {message.fullName}
                    </p>
                  )}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={toggleMeta}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        toggleMeta();
                      }
                    }}
                    className={bubbleClassName}
                  >
                    {imageUrl && !recalled ? (
                      <img
                        src={imageUrl}
                        alt="Ảnh trong tin nhắn"
                        className="block max-h-64 w-full max-w-[240px] rounded-2xl object-cover"
                        loading="lazy"
                      />
                    ) : recalled ? (
                      <p className="whitespace-pre-wrap break-words text-[13px] leading-5 italic opacity-75">
                        {RECALLED_MESSAGE}
                      </p>
                    ) : (
                      <p className="whitespace-pre-wrap break-words text-[13px] leading-5">{message.message}</p>
                    )}
                    <div className={metaClassName}>
                      <span>{formatMessageDateTime(message.createdAt)}</span>
                      {mine && !recalled && !String(message.id).startsWith("tmp-") && (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            onRecallMessage(message);
                          }}
                          className="pointer-events-auto border-l border-white/20 pl-2 font-bold text-white/90 underline-offset-2 transition hover:text-white hover:underline"
                        >
                          Thu hồi
                        </button>
                      )}
                    </div>
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
