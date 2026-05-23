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
  return (
    <form onSubmit={onSubmit} className="mb-4 space-y-3 rounded-xl border border-emerald-100 bg-white p-3">
      <input
        type="text"
        value={recipientSearch}
        onChange={onRecipientSearchChange}
        className="w-full rounded-lg border border-outline-variant/40 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
        placeholder="Tìm người nhận theo tên, email hoặc số điện thoại"
      />
      <div className="rounded-lg border border-outline-variant/40 bg-white">
        <div className="border-b border-outline-variant/20 px-3 py-2 text-xs font-bold text-on-surface-variant">
          {loadingRecipients
            ? "Đang tải người nhận..."
            : selectedRecipient
            ? `Đã chọn: ${selectedRecipient.fullName}`
            : "Chọn người nhận"}
        </div>

        <div className="max-h-44 overflow-y-auto p-2">
          {loadingRecipients ? (
            <div className="flex items-center justify-center py-6 text-sm font-medium text-on-surface-variant">
              Đang tải...
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
          ) : (
            <div className="rounded-lg border border-dashed border-outline-variant/50 px-3 py-6 text-center text-sm font-medium text-on-surface-variant">
              Không có người nhận phù hợp
            </div>
          )}
        </div>
      </div>
      <textarea
        value={firstMessage}
        onChange={onFirstMessageChange}
        className="min-h-20 w-full resize-none rounded-lg border border-outline-variant/40 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
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
