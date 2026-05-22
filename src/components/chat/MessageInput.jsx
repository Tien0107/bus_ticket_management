export default function MessageInput({ composeValue, onChange, onSubmit, onStopTyping }) {
  const handleKeyDown = (event) => {
    if (event.key !== "Enter" || event.shiftKey || event.isComposing) return;

    event.preventDefault();
    if (composeValue.trim()) {
      event.currentTarget.form?.requestSubmit();
    }
  };

  return (
    <form onSubmit={onSubmit} className="shrink-0 border-t border-outline-variant/20 bg-white p-3">
      <div className="flex items-end gap-2">
        <textarea
          value={composeValue}
          onChange={onChange}
          onBlur={onStopTyping}
          onKeyDown={handleKeyDown}
          className="min-h-10 flex-1 resize-none rounded-lg border border-outline-variant/40 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
          placeholder="Nhập tin nhắn..."
          rows={1}
        />
        <button
          type="submit"
          disabled={!composeValue.trim()}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Gửi tin nhắn"
        >
          <span className="material-symbols-outlined text-[21px]">send</span>
        </button>
      </div>
    </form>
  );
}
