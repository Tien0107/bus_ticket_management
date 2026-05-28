import { useCallback, useEffect, useState } from "react";

export default function useRemoteMediaPlayback({
  mediaRef,
  remoteStream,
  enabled = true,
  muted = false,
  volume = 1,
  label = "Remote media",
}) {
  const [isPlaybackBlocked, setIsPlaybackBlocked] = useState(false);

  const playRemoteMedia = useCallback(async () => {
    const media = mediaRef.current;

    if (!media || !enabled || !remoteStream) {
      setIsPlaybackBlocked(false);
      return true;
    }

    media.autoplay = true;
    media.playsInline = true;
    media.muted = muted;
    media.volume = muted ? 0 : volume;

    if (media.srcObject !== remoteStream) {
      media.srcObject = remoteStream;
    }

    try {
      await media.play();
      setIsPlaybackBlocked(false);
      return true;
    } catch (error) {
      const hasLiveAudio = remoteStream
        .getAudioTracks()
        .some((track) => track.readyState === "live" && track.enabled);

      setIsPlaybackBlocked(hasLiveAudio && !muted);
      console.warn(`[CALL] ${label} playback blocked:`, error);
      return false;
    }
  }, [enabled, label, mediaRef, muted, remoteStream, volume]);

  useEffect(() => {
    const media = mediaRef.current;
    if (!media) return undefined;

    media.srcObject = enabled ? remoteStream || null : null;

    if (!enabled || !remoteStream) {
      setIsPlaybackBlocked(false);
      return undefined;
    }

    void playRemoteMedia();

    return () => {
      if (media.srcObject === remoteStream) {
        media.srcObject = null;
      }
    };
  }, [enabled, mediaRef, playRemoteMedia, remoteStream]);

  return {
    isPlaybackBlocked,
    playRemoteMedia,
  };
}
