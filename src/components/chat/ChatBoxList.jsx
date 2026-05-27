import { getBoxPreview, getInitials, getUnreadForViewer } from "./chatUtils";

export default function ChatBoxList({
  boxes,
  boxNext,
  loadingBoxes,
  onLoadMore,
  onSelectBox,
  onlineUserIds,
  viewerId,
}) {
  if (loadingBoxes) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-on-surface-variant">
        Đang tải hội thoại...
      </div>
    );
  }

  if (!boxes.length) {
    return (
      <div className="flex h-full items-center justify-center text-center">
        <div>
          <span className="material-symbols-outlined text-5xl text-outline">forum</span>
          <p className="mt-3 font-bold text-on-surface">Chưa có hội thoại</p>
          <p className="mt-1 text-sm text-on-surface-variant">Bấm dấu cộng để tạo hội thoại.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {boxes.map((box) => {
        const unread = getUnreadForViewer(box, viewerId);
        const boxPeerId = Number(box.senderId) === Number(viewerId) ? box.receiverId : box.senderId;
        const online = boxPeerId && onlineUserIds.has(Number(boxPeerId));

        return (
          <button
            key={box.id}
            type="button"
            onClick={() => onSelectBox(box.id)}
            className="w-full rounded-xl bg-white p-2.5 text-left shadow-sm ring-1 ring-slate-100 transition hover:bg-emerald-50/40 hover:shadow-md"
          >
            <div className="flex items-center gap-2.5">
              <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-base font-extrabold text-white">
                {getInitials(box.displayName)}
                {online && (
                  <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-400" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-extrabold text-on-surface">{box.displayName}</p>
                  {unread > 0 && (
                    <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-white">
                      {unread}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 truncate text-xs font-semibold text-slate-500">
                  {getBoxPreview(box, viewerId)}
                </p>
              </div>
            </div>
          </button>
        );
      })}
      {boxNext && (
        <button
          type="button"
          onClick={onLoadMore}
          className="w-full rounded-xl border border-emerald-100 bg-white px-4 py-2.5 text-sm font-bold text-on-surface hover:bg-emerald-50"
        >
          Tải thêm
        </button>
      )}
    </div>
  );
}
