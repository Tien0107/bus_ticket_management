import { formatTime, isMessageRecalled, RECALLED_MESSAGE } from "./chatUtils";

export default function MessageList({
  loadingMessages,
  messageNext,
  messages,
  messagesEndRef,
  onLoadOlder,
  onRecallMessage,
  peerTyping,
  viewerId,
}) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-surface-container-low/40 p-4">
      {messageNext && (
        <div className="mb-4 text-center">
          <button
            type="button"
            onClick={onLoadOlder}
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
                <div
                  className={`max-w-[82%] rounded-2xl px-4 py-3 shadow-sm ${
                    mine ? "bg-primary text-white" : "bg-white text-on-surface"
                  }`}
                >
                  {!mine && <p className="mb-1 text-xs font-bold text-primary">{message.fullName}</p>}
                  <p className={`whitespace-pre-wrap break-words text-sm ${recalled ? "italic opacity-75" : ""}`}>
                    {recalled ? RECALLED_MESSAGE : message.message}
                  </p>
                  <div
                    className={`mt-2 flex items-center gap-2 text-[11px] ${
                      mine ? "text-white/75" : "text-on-surface-variant"
                    }`}
                  >
                    <span>{formatTime(message.createdAt)}</span>
                    {mine && !recalled && !String(message.id).startsWith("tmp-") && (
                      <button
                        type="button"
                        onClick={() => onRecallMessage(message)}
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
  );
}
