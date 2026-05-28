/**
 * VoiceCallScreen.jsx
 * Màn hình cuộc gọi thoại (Voice) - thiết kế giống WhatsApp Web cao cấp
 * Floating overlay toàn màn hình, tối giản, đẹp mắt
 */

import React, { useRef } from "react";
import { CALL_STATUS } from "./callTypes";
import useRemoteMediaPlayback from "./useRemoteMediaPlayback";

export default function VoiceCallScreen({
  visible,
  remoteUser,
  status,
  duration,
  isMuted,
  isRequestingMedia = false,
  remoteStream,
  onToggleMute,
  onEndCall,
}) {
  const remoteAudioRef = useRef(null);
  const { isPlaybackBlocked, playRemoteMedia } = useRemoteMediaPlayback({
    mediaRef: remoteAudioRef,
    remoteStream,
    enabled: visible,
    label: "Remote voice",
  });

  if (!visible) return null;

  const displayName = remoteUser?.name || "Người dùng";
  const avatar = remoteUser?.avatar;

  const formatDuration = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const getStatusText = () => {
    if (isRequestingMedia) return "Đang yêu cầu quyền truy cập microphone...";
    if (status === CALL_STATUS.CONNECTING) return "Đang kết nối...";
    if (status === CALL_STATUS.CONNECTED) return formatDuration(duration);
    return "Đang gọi...";
  };

  return (
    <div className="fixed inset-0 z-[9998] flex flex-col bg-[#0a0c0b] text-white">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-2 text-sm text-white/60">
          <span className="material-symbols-outlined text-lg">lock</span>
          <span>Cuộc gọi được mã hóa</span>
        </div>
        <button
          onClick={onEndCall}
          className="rounded-full p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
          aria-label="Kết thúc cuộc gọi"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 pb-12">
        {/* Avatar */}
        <div className="relative mb-8">
          <div className="h-40 w-40 overflow-hidden rounded-full border-[6px] border-white/10 bg-slate-800 shadow-2xl">
            {avatar ? (
              <img
                src={avatar}
                alt={displayName}
                className="h-full w-full object-cover"
                onError={(e) => { e.target.style.display = "none"; }}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-900 via-slate-800 to-black text-7xl font-bold text-white/90">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Status dot */}
          {status === CALL_STATUS.CONNECTED && (
            <div className="absolute bottom-3 right-3 h-6 w-6 rounded-full border-4 border-[#0a0c0b] bg-primary" />
          )}
        </div>

        <h1 className="text-4xl font-extrabold tracking-tight">{displayName}</h1>

        <div className="mt-3 flex items-center gap-2 text-lg font-medium text-white/70">
          <span>{getStatusText()}</span>
          {status === CALL_STATUS.CONNECTED && (
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
          )}
        </div>

        <p className="mt-1 text-sm text-white/40">Gọi thoại</p>
      </div>

      {isPlaybackBlocked && (
        <button
          type="button"
          onClick={playRemoteMedia}
          className="mx-auto mb-4 flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-on-primary shadow-lg transition hover:brightness-105"
        >
          <span className="material-symbols-outlined text-lg">volume_up</span>
          <span>Bật âm thanh</span>
        </button>
      )}

      {/* Hidden audio element to play remote voice */}
      <audio ref={remoteAudioRef} autoPlay playsInline />

      {/* Bottom controls */}
      <div className="flex items-center justify-center gap-8 bg-black/30 px-6 pb-10 pt-6">
        {/* Mute */}
        <button
          onClick={onToggleMute}
          className={`flex h-16 w-16 flex-col items-center justify-center rounded-full transition-all active:scale-95 ${
            isMuted
              ? "bg-red-500/90 text-white"
              : "bg-white/10 text-white hover:bg-white/15"
          }`}
          aria-label={isMuted ? "Bật micro" : "Tắt micro"}
        >
          <span className="material-symbols-outlined text-3xl">
            {isMuted ? "mic_off" : "mic"}
          </span>
          <span className="mt-0.5 text-[10px] font-semibold tracking-wider">
            {isMuted ? "ĐÃ TẮT" : "MIC"}
          </span>
        </button>

        {/* End call - lớn và nổi bật */}
        <button
          onClick={onEndCall}
          className="flex h-20 w-20 items-center justify-center rounded-full bg-red-600 shadow-xl transition-all active:scale-95 hover:bg-red-700"
          aria-label="Kết thúc cuộc gọi"
        >
          <span className="material-symbols-outlined text-4xl text-white">call_end</span>
        </button>

        {/* Speaker (placeholder - có thể mở rộng sau) */}
        <button
          className={`flex h-16 w-16 flex-col items-center justify-center rounded-full text-white transition-all active:scale-95 ${
            isPlaybackBlocked ? "bg-primary hover:brightness-105" : "bg-white/10 hover:bg-white/15"
          }`}
          aria-label="Bật âm thanh"
          onClick={playRemoteMedia}
        >
          <span className="material-symbols-outlined text-3xl">volume_up</span>
          <span className="mt-0.5 text-[10px] font-semibold tracking-wider">
            {isPlaybackBlocked ? "BẬT ÂM" : "LOA"}
          </span>
        </button>
      </div>
    </div>
  );
}
