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
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
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
              <span className="absolute -right-1 -top-1 rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
                {chat.totalUnread}
              </span>
            )}
          </button>
        </div>
      )}

      {chat.open && (
        <section className="flex h-[min(620px,calc(100vh-96px))] w-[min(380px,calc(100vw-28px))] flex-col overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.20)]">
          <div className="flex h-[74px] shrink-0 items-center justify-between border-b border-emerald-100 bg-white px-4">
            <div className="flex min-w-0 items-center gap-2">
              {chat.selectedBox && (
                <button
                  type="button"
                  onClick={() => chat.setSelectedBoxId(null)}
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
                  aria-label="Quay lại danh sách"
                >
                  <span className="material-symbols-outlined text-[23px]">arrow_back</span>
                </button>
              )}
              <div className="min-w-0">
                <h2 className="truncate text-xl font-bold text-on-surface">
                  {chat.selectedBox ? chat.selectedBox.displayName : "Trò chuyện"}
                </h2>
                {chat.selectedBox && (
                  <p className="truncate text-sm font-medium text-on-surface-variant">
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
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-primary hover:bg-emerald-50"
                  aria-label="Tạo hội thoại"
                  title="Tạo hội thoại"
                >
                  <span className="material-symbols-outlined text-[26px]">add</span>
                </button>
              )}
              <button
                type="button"
                onClick={chat.handleClose}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-primary hover:bg-emerald-50"
                aria-label="Đóng trò chuyện"
                title="Đóng"
              >
                <span className="material-symbols-outlined text-[26px]">close</span>
              </button>
            </div>
          </div>

          {chat.socketError && (
            <div className="mx-5 mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
              {chat.socketError}
            </div>
          )}

          {!chat.selectedBox ? (
            <div className="min-h-0 flex-1 overflow-y-auto bg-[#fbfdfc] p-4">
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
