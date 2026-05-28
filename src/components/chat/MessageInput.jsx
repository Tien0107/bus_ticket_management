export default function MessageInput({
  composeValue,
  onChange,
  onImageSelect,
  onSubmit,
  onStopTyping,
  uploadingImage,
}) {
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
          placeholder={uploadingImage ? "Đang tải ảnh..." : "Nhập tin nhắn..."}
          rows={1}
        />
        <label
          className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-primary transition ${
            uploadingImage
              ? "cursor-not-allowed bg-emerald-50 text-primary/45"
              : "cursor-pointer hover:bg-emerald-50"
          }`}
          title="Gửi ảnh"
          aria-disabled={uploadingImage}
        >
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            disabled={uploadingImage}
            onChange={onImageSelect}
          />
          {uploadingImage ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary/25 border-t-primary" />
          ) : (
            <span className="material-symbols-outlined text-[20px]">image</span>
          )}
        </label>
        <button
          type="submit"
          disabled={!composeValue.trim() || uploadingImage}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-[0_8px_20px_rgba(0,128,43,0.22)] transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-emerald-200 disabled:shadow-none"
          aria-label="Gửi tin nhắn"
        >
          <span className="material-symbols-outlined text-[20px]">send</span>
        </button>
      </div>
    </form>
  );
}
