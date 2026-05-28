/**
 * VideoCallScreen.jsx
 * Màn hình cuộc gọi video cao cấp
 * - Remote video full screen
 * - Local video picture-in-picture (có thể kéo)
 * - Controls overlay đẹp
 */

import React, { useRef, useEffect, useState } from "react";
import { CALL_STATUS } from "./callTypes";
import useRemoteMediaPlayback from "./useRemoteMediaPlayback";

export default function VideoCallScreen({
  visible,
  remoteUser,
  status,
  duration,
  localStream,
  remoteStream,
  isMuted,
  isVideoOff,
  isRequestingMedia = false,
  onToggleMute,
  onToggleVideo,
  onSwitchCamera,
  onEndCall,
}) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const [isLocalPiPMinimized, setIsLocalPiPMinimized] = useState(false);
  const { isPlaybackBlocked, playRemoteMedia } = useRemoteMediaPlayback({
    mediaRef: remoteAudioRef,
    remoteStream,
    enabled: visible,
    label: "Remote video audio",
  });

  // Gắn stream vào video elements
  useEffect(() => {
    const video = localVideoRef.current;
    if (!video) return;

    video.muted = true;
    video.volume = 0;
    video.srcObject = localStream || null;

    if (localStream) {
      video.play?.().catch(() => {});
    }
  }, [localStream]);

  useEffect(() => {
    const video = remoteVideoRef.current;
    if (!video) return;

    video.muted = true;
    video.volume = 0;
    video.srcObject = remoteStream || null;

    if (remoteStream) {
      video.play?.().catch(() => {});
    }
  }, [remoteStream]);

  if (!visible) return null;

  const displayName = remoteUser?.name || "Người dùng";
  const formatDuration = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const getStatusLabel = () => {
    if (isRequestingMedia) return "Đang yêu cầu quyền camera & microphone...";
    if (status === CALL_STATUS.CONNECTING) return "Đang kết nối video...";
    if (status === CALL_STATUS.CONNECTED) return formatDuration(duration);
    return "Đang gọi video...";
  };

  return (
    <div className="fixed inset-0 z-[9998] flex flex-col overflow-hidden bg-black text-white">
      {/* Remote Video (full background) */}
      <div className="absolute inset-0 bg-black">
        {remoteStream ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full bg-black object-contain"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-950 via-black to-emerald-950">
            <div className="text-center">
              <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-white/5 flex items-center justify-center">
                <span className="material-symbols-outlined text-5xl text-white/40">person</span>
              </div>
              <p className="text-lg font-medium text-white/60">{displayName}</p>
              <p className="text-sm text-white/40 mt-1">{getStatusLabel()}</p>
            </div>
          </div>
        )}
      </div>

      <audio ref={remoteAudioRef} autoPlay playsInline />

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-5 py-4 bg-gradient-to-b from-black/70 to-transparent">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full bg-black/40 px-3 py-1 text-sm backdrop-blur">
            <span className="material-symbols-outlined text-primary text-base">videocam</span>
            <span className="font-semibold">{getStatusLabel()}</span>
          </div>
          <div className="rounded-full bg-black/40 px-3 py-1 text-xs text-white/60 backdrop-blur">
            Mã hóa đầu cuối
          </div>
        </div>

        <button
          onClick={onEndCall}
          className="rounded-full bg-black/40 p-2 text-white/70 backdrop-blur transition hover:bg-red-600 hover:text-white"
          aria-label="Kết thúc"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      {/* Local PiP Video */}
      <div
        className={`absolute right-4 z-20 overflow-hidden rounded-2xl border border-white/20 bg-black shadow-2xl transition-all ${
          isLocalPiPMinimized ? "bottom-24 h-20 w-14" : "bottom-28 h-44 w-32 sm:h-48 sm:w-36"
        }`}
      >
        {localStream && !isVideoOff ? (
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-slate-900 text-xs text-white/50">
            Camera tắt
          </div>
        )}

        <button
          onClick={() => setIsLocalPiPMinimized(!isLocalPiPMinimized)}
          className="absolute right-1 top-1 rounded bg-black/60 p-0.5 text-white/70"
          aria-label="Thu nhỏ/mở rộng khung hình"
        >
          <span className="material-symbols-outlined text-sm">
            {isLocalPiPMinimized ? "open_in_full" : "close_fullscreen"}
          </span>
        </button>
      </div>

      {/* Bottom controls */}
      <div className="relative z-10 mt-auto bg-gradient-to-t from-black/90 via-black/80 to-transparent px-6 pb-10 pt-8">
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

        <div className="flex items-center justify-center gap-5">
          {/* Mute */}
          <button
            onClick={onToggleMute}
            className={`flex h-14 w-14 flex-col items-center justify-center rounded-full transition-all active:scale-95 ${
              isMuted ? "bg-red-600" : "bg-white/10 hover:bg-white/15"
            }`}
          >
            <span className="material-symbols-outlined text-2xl">
              {isMuted ? "mic_off" : "mic"}
            </span>
          </button>

          {/* Toggle Video */}
          <button
            onClick={onToggleVideo}
            className={`flex h-14 w-14 flex-col items-center justify-center rounded-full transition-all active:scale-95 ${
              isVideoOff ? "bg-red-600" : "bg-white/10 hover:bg-white/15"
            }`}
          >
            <span className="material-symbols-outlined text-2xl">
              {isVideoOff ? "videocam_off" : "videocam"}
            </span>
          </button>

          {/* Speaker */}
          <button
            type="button"
            onClick={playRemoteMedia}
            className={`flex h-14 w-14 flex-col items-center justify-center rounded-full transition-all active:scale-95 ${
              isPlaybackBlocked ? "bg-primary hover:brightness-105" : "bg-white/10 hover:bg-white/15"
            }`}
            aria-label="Bật âm thanh"
          >
            <span className="material-symbols-outlined text-2xl">volume_up</span>
          </button>

          {/* Switch Camera (chỉ video) */}
          <button
            onClick={onSwitchCamera}
            className="flex h-14 w-14 flex-col items-center justify-center rounded-full bg-white/10 transition-all active:scale-95 hover:bg-white/15"
            title="Đổi camera"
          >
            <span className="material-symbols-outlined text-2xl">flip_camera_ios</span>
          </button>

          {/* End Call */}
          <button
            onClick={onEndCall}
            className="ml-2 flex h-16 w-16 items-center justify-center rounded-full bg-red-600 shadow-xl active:scale-95 hover:bg-red-700"
          >
            <span className="material-symbols-outlined text-3xl">call_end</span>
          </button>
        </div>

        <p className="mt-4 text-center text-xs text-white/50">
          Nhấn vào khung hình nhỏ để thu nhỏ/mở rộng
        </p>
      </div>
    </div>
  );
}
