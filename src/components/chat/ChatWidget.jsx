import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ChatBoxList from "./ChatBoxList";
import CreateChatForm from "./CreateChatForm";
import MessageInput from "./MessageInput";
import MessageList from "./MessageList";
import useChatController from "./useChatController";

export default function ChatWidget() {
  const chat = useChatController();
  const navigate = useNavigate();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const handleOpenChat = () => {
    if (!chat.isAuthenticated) {
      setShowLoginPrompt(true);
      return;
    }

    setShowLoginPrompt(false);
    chat.setOpen(true);
  };

  const handleLoginNow = () => {
    setShowLoginPrompt(false);
    navigate("/login");
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {!chat.open && (
        <div className="flex items-end gap-3">
          {showLoginPrompt && (
            <div className="w-[min(280px,calc(100vw-104px))] rounded-2xl border border-emerald-100 bg-white p-4 text-left shadow-[0_18px_50px_rgba(15,23,42,0.18)]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-extrabold text-on-surface">Bạn chưa đăng nhập</p>
                  <p className="mt-1 text-xs font-medium leading-5 text-on-surface-variant">
                    Đăng nhập để mở trò chuyện và gửi tin nhắn.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowLoginPrompt(false)}
                  className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-low"
                  aria-label="Đóng thông báo đăng nhập"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>
              <button
                type="button"
                onClick={handleLoginNow}
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2.5 text-sm font-bold text-white hover:bg-primary/90"
              >
                <span className="material-symbols-outlined text-[18px]">login</span>
                Đăng nhập ngay
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={handleOpenChat}
            className="relative inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-[0_14px_34px_rgba(0,128,43,0.28)] ring-4 ring-white transition-all hover:-translate-y-0.5 hover:bg-primary/90"
            aria-label="Mở trò chuyện"
          >
            <span className="material-symbols-outlined text-[28px]">chat_bubble</span>
            {chat.totalUnread > 0 && (
              <span className="absolute -right-2 -top-2 inline-flex min-w-6 items-center justify-center rounded-full border-2 border-white bg-red-500 px-1.5 py-0.5 text-xs font-extrabold leading-4 text-white shadow-[0_8px_18px_rgba(239,68,68,0.35)]">
                {chat.totalUnread > 99 ? "99+" : chat.totalUnread}
              </span>
            )}
          </button>
        </div>
      )}

      {chat.open && (
        <section className="flex h-[min(580px,calc(100vh-82px))] w-[min(350px,calc(100vw-24px))] flex-col overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-[0_22px_60px_rgba(15,23,42,0.18)]">
          <div className="flex h-[58px] shrink-0 items-center justify-between border-b border-slate-100 bg-white px-3">
            <div className="flex min-w-0 items-center gap-2">
              {chat.selectedBox && (
                <button
                  type="button"
                  onClick={() => chat.setSelectedBoxId(null)}
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-on-surface-variant transition hover:bg-slate-100 hover:text-on-surface"
                  aria-label="Quay lại danh sách"
                >
                  <span className="material-symbols-outlined text-[21px]">arrow_back</span>
                </button>
              )}
              <div className="min-w-0">
                <h2 className="truncate text-base font-extrabold leading-5 text-on-surface">
                  {chat.selectedBox ? chat.selectedBox.displayName : "Trò chuyện"}
                </h2>
                {chat.selectedBox && (
                  <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs font-semibold text-on-surface-variant">
                    <span
                      className={`h-2 w-2 shrink-0 rounded-full ${
                        chat.peerTyping ? "bg-amber-400" : chat.selectedPeerOnline ? "bg-emerald-500" : "bg-slate-300"
                      }`}
                    />
                    {chat.peerTyping ? "Đang nhập..." : chat.selectedPeerOnline ? "Đang online" : "Đang offline"}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!chat.selectedBox && (
                <button
                  type="button"
                  onClick={() => chat.setShowCreate((current) => !current)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full text-primary transition hover:bg-emerald-50"
                  aria-label="Tạo hội thoại"
                  title="Tạo hội thoại"
                >
                  <span className="material-symbols-outlined text-[23px]">add</span>
                </button>
              )}
              <button
                type="button"
                onClick={chat.handleClose}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-primary transition hover:bg-emerald-50"
                aria-label="Đóng trò chuyện"
                title="Đóng"
              >
                <span className="material-symbols-outlined text-[23px]">close</span>
              </button>
            </div>
          </div>

          {chat.socketError && (
            <div className="mx-5 mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
              {chat.socketError}
            </div>
          )}

          {!chat.selectedBox ? (
            <div className="min-h-0 flex-1 overflow-y-auto bg-[#fbfdfc] p-3">
              {chat.showCreate && (
                <CreateChatForm
                  filteredRecipientUsers={chat.filteredRecipientUsers}
                  firstMessage={chat.firstMessage}
                  loadingRecipients={chat.loadingRecipients}
                  onFirstMessageChange={chat.handleFirstMessageChange}
                  onReceiverChange={chat.setReceiverId}
                  onRecipientSearchChange={chat.handleRecipientSearchChange}
                  onSubmit={chat.handleCreateBox}
                  receiverId={chat.receiverId}
                  recipientSearch={chat.recipientSearch}
                  selectedRecipient={chat.selectedRecipient}
                />
              )}

              <ChatBoxList
                boxes={chat.boxes}
                boxNext={chat.boxNext}
                loadingBoxes={chat.loadingBoxes}
                onLoadMore={chat.handleLoadMoreBoxes}
                onSelectBox={chat.setSelectedBoxId}
                onlineUserIds={chat.onlineUserIds}
                viewerId={chat.viewerId}
              />
            </div>
          ) : (
            <>
              <MessageList
                loadingMessages={chat.loadingMessages}
                messageNext={chat.messageNext}
                messages={chat.messages}
                messagesEndRef={chat.messagesEndRef}
                messagesScrollRef={chat.messagesScrollRef}
                onLoadOlder={chat.handleLoadOlderMessages}
                onRecallMessage={chat.handleRecallMessage}
                peerTyping={chat.peerTyping}
                viewerId={chat.viewerId}
              />

              <MessageInput
                composeValue={chat.composeValue}
                onChange={chat.handleComposeChange}
                onStopTyping={chat.stopTyping}
                onSubmit={chat.handleSendMessage}
              />
            </>
          )}
        </section>
      )}
    </div>
  );
}
