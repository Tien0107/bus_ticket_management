





import React from "react";
import { CALL_TYPE } from "./callTypes";

export default function IncomingCallModal({
  visible,
  caller,
  callType,
  onAccept,
  onReject
}) {
  if (!visible || !caller) return null;

  const isVideo = callType === CALL_TYPE.VIDEO;
  const displayName = caller.name || "Người dùng";
  const avatar = caller.avatar;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-[360px] overflow-hidden rounded-3xl border border-white/10 bg-[#0f1110] shadow-2xl">
        {}
        <div className="flex flex-col items-center px-8 pb-6 pt-10 text-center">
          {}
          <div className="relative mb-6">
            {}
            <div className="absolute inset-[-18px] animate-[ping_1.8s_cubic-bezier(0,0,0.2,1)_infinite] rounded-full border-4 border-primary/40" />
            <div className="absolute inset-[-36px] animate-[ping_2.4s_cubic-bezier(0,0,0.2,1)_infinite] rounded-full border-2 border-primary/20" />

            <div className="relative h-28 w-28 overflow-hidden rounded-full border-4 border-primary/80 bg-slate-800 ring-8 ring-primary/10">
              {avatar ?
              <img
                src={avatar}
                alt={displayName}
                className="h-full w-full object-cover"
                onError={(e) => {e.target.style.display = "none";}} /> :


              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-800 to-slate-900 text-4xl font-bold text-white">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              }
            </div>

            {}
            <div className="absolute -bottom-1 -right-1 flex h-10 w-10 items-center justify-center rounded-full bg-[#0f1110] ring-4 ring-[#0f1110]">
              <span className="material-symbols-outlined text-3xl text-primary">
                {isVideo ? "videocam" : "call"}
              </span>
            </div>
          </div>

          <p className="text-xs font-semibold uppercase tracking-[2px] text-primary/70">
            {isVideo ? "CUỘC GỌI VIDEO ĐẾN" : "CUỘC GỌI THOẠI ĐẾN"}
          </p>

          <h2 className="mt-2 text-3xl font-extrabold text-white">{displayName}</h2>

          <p className="mt-1 text-sm text-white/60">
            Đang chờ bạn trả lời...
          </p>
        </div>

        {}
        <div className="flex items-center justify-center gap-10 bg-black/40 px-6 py-8">
          {}
          <button
            onClick={onReject}
            className="group flex h-16 w-16 flex-col items-center justify-center rounded-full bg-red-600 transition-all active:scale-95 hover:bg-red-700"
            aria-label="Từ chối cuộc gọi">
            
            <span className="material-symbols-outlined text-3xl text-white transition group-active:rotate-12">
              call_end
            </span>
            <span className="mt-1 text-[10px] font-bold text-white/90">Từ chối</span>
          </button>

          {}
          <button
            onClick={onAccept}
            className="group flex h-16 w-16 flex-col items-center justify-center rounded-full bg-primary transition-all active:scale-95 hover:bg-primary/90"
            aria-label="Chấp nhận cuộc gọi">
            
            <span className="material-symbols-outlined text-3xl text-white transition group-active:-rotate-12">
              {isVideo ? "videocam" : "call"}
            </span>
            <span className="mt-1 text-[10px] font-bold text-white/95">Trả lời</span>
          </button>
        </div>

        <div className="pb-5 text-center text-[11px] text-white/40">
          Cuộc gọi được bảo mật đầu cuối
        </div>
      </div>
    </div>);

}