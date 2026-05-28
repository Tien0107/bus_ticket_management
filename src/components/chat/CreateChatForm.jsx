export default function CreateChatForm({
  filteredRecipientUsers,
  firstMessage,
  loadingRecipients,
  onFirstMessageChange,
  onReceiverChange,
  onRecipientSearchChange,
  onSubmit,
  receiverId,
  recipientSearch,
  selectedRecipient,
}) {
  const hasSearchKeyword = recipientSearch.trim().length > 0;
  const resultTitle = loadingRecipients
    ? "Đang tải người nhận..."
    : selectedRecipient
    ? `Đã chọn: ${selectedRecipient.fullName}`
    : hasSearchKeyword
    ? "Kết quả tìm kiếm"
    : "Tìm người nhận";

  return (
    <form onSubmit={onSubmit} className="mb-3 space-y-2 rounded-xl border border-emerald-100 bg-white p-2.5">
      <input
        type="text"
        value={recipientSearch}
        onChange={onRecipientSearchChange}
        className="w-full rounded-lg border border-outline-variant/40 bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
        placeholder="Email, số điện thoại"
      />
      <div className="rounded-lg border border-outline-variant/40 bg-white">
        <div className="flex items-center gap-2 border-b border-outline-variant/20 px-3 py-2 text-xs font-bold text-on-surface-variant">
          <span className="material-symbols-outlined text-[17px] text-primary">
            {selectedRecipient ? "check_circle" : hasSearchKeyword ? "manage_search" : "person_search"}
          </span>
          <span>{resultTitle}</span>
        </div>

        <div className="max-h-36 overflow-y-auto p-2">
          {loadingRecipients ? (
            <div className="flex items-center justify-center gap-2 py-6 text-sm font-medium text-on-surface-variant">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary/25 border-t-primary" />
              <span>Đang tải...</span>
            </div>
          ) : filteredRecipientUsers.length ? (
            <div className="space-y-2">
              {filteredRecipientUsers.map((user) => {
                const active = String(receiverId) === String(user.id);

                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => onReceiverChange(String(user.id))}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                      active
                        ? "bg-primary text-white"
                        : "bg-surface-container-low/50 text-on-surface hover:bg-emerald-50"
                    }`}
                  >
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-extrabold ${
                        active ? "bg-white/15 text-white" : "bg-primary/10 text-primary"
                      }`}
                    >
                      {(user.fullName || "U").trim().charAt(0).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold">{user.fullName}</span>
                      <span className={`block truncate text-xs ${active ? "text-white/75" : "text-on-surface-variant"}`}>
                        {user.phone || user.email || user.role || `ID ${user.id}`}
                      </span>
                    </span>
                    {active && <span className="material-symbols-outlined text-[20px]">check_circle</span>}
                  </button>
                );
              })}
            </div>
          ) : !hasSearchKeyword ? (
            <div className="flex items-center gap-3 rounded-lg bg-emerald-50/70 px-3 py-4 text-left">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-primary shadow-sm">
                <span className="material-symbols-outlined text-[22px]">search</span>
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-bold text-on-surface">Bắt đầu tìm kiếm</span>
                <span className="mt-0.5 block text-xs font-medium text-on-surface-variant">
                  Nhập email, số điện thoại
                </span>
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-lg border border-dashed border-outline-variant/50 px-3 py-4 text-left">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-container-low text-on-surface-variant">
                <span className="material-symbols-outlined text-[22px]">person_off</span>
              </span>
              <span className="min-w-0 text-sm font-medium text-on-surface-variant">
                Không tìm thấy người nhận phù hợp
              </span>
            </div>
          )}
        </div>
      </div>
      <textarea
        value={firstMessage}
        onChange={onFirstMessageChange}
        className="min-h-16 w-full resize-none rounded-lg border border-outline-variant/40 bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
        placeholder="Tin nhắn đầu tiên"
      />
      <button
        type="submit"
        className="inline-flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-primary/90"
      >
        Tạo hội thoại
      </button>
    </form>
  );
}
