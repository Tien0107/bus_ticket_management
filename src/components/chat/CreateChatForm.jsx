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
      <select
        value={receiverId}
        onChange={onReceiverChange}
        disabled={loadingRecipients || filteredRecipientUsers.length === 0}
        className="w-full rounded-lg border border-outline-variant/40 bg-white px-3 py-2.5 text-sm font-medium text-on-surface outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:bg-surface-container-low disabled:text-on-surface-variant"
      >
        <option value="">
          {loadingRecipients
            ? "Đang tải người nhận..."
            : filteredRecipientUsers.length
            ? "Chọn người nhận"
            : "Không có người nhận phù hợp"}
        </option>
        {filteredRecipientUsers.map((user) => (
          <option key={user.id} value={user.id}>
            {user.fullName} - {user.phone || user.email || user.role || `ID ${user.id}`}
          </option>
        ))}
      </select>
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
