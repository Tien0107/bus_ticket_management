export default function MessageInput({ composeValue, onChange, onSubmit, onStopTyping }) {
  const handleKeyDown = (event) => {
    if (event.key !== "Enter" || event.shiftKey || event.isComposing) return;

    event.preventDefault();
    if (composeValue.trim()) {
      event.currentTarget.form?.requestSubmit();
    }
  };

  return (
    <form onSubmit={onSubmit} className="shrink-0 border-t border-slate-100 bg-white px-2.5 py-2.5">
      <div className="flex items-end gap-2 rounded-2xl bg-[#f8faf9] p-1 ring-1 ring-slate-200 focus-within:ring-2 focus-within:ring-primary/25">
        <textarea
          value={composeValue}
          onChange={onChange}
          onBlur={onStopTyping}
          onKeyDown={handleKeyDown}
          className="max-h-24 min-h-9 flex-1 resize-none border-0 bg-transparent px-2.5 py-2 text-sm leading-5 outline-none placeholder:text-slate-400"
          placeholder="Nhập tin nhắn..."
          rows={1}
        />
        <button
          type="submit"
          disabled={!composeValue.trim()}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-[0_8px_20px_rgba(0,128,43,0.22)] transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-emerald-200 disabled:shadow-none"
          aria-label="Gửi tin nhắn"
        >
          <span className="material-symbols-outlined text-[20px]">send</span>
        </button>
      </div>
    </form>
  );
}
