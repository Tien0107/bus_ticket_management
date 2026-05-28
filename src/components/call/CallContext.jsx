/**
 * CallContext.jsx
 * Context + Provider toàn cục cho tính năng gọi thoại/video
 * - Quản lý 1 instance useWebRTCCall duy nhất
 * - Render IncomingCallModal + Voice/Video screens ở cấp cao nhất
 * - Cung cấp API startCall() cho bất kỳ đâu trong app (Chat, danh sách, v.v.)
 */

import React, { createContext, useContext, useCallback, useMemo } from "react";
import useWebRTCCall from "./useWebRTCCall";
import { CALL_TYPE, CALL_STATUS } from "./callTypes";
import IncomingCallModal from "./IncomingCallModal";
import VoiceCallScreen from "./VoiceCallScreen";
import VideoCallScreen from "./VideoCallScreen";

const CallContext = createContext(null);

export function CallProvider({ children, externalSocket = null }) {
  // externalSocket = socket chính của chat (từ useChatController)
  // => Khuyến nghị truyền vào để tránh tạo nhiều connection WebSocket
  const call = useWebRTCCall({ externalSocket });

  // API đơn giản để bắt đầu cuộc gọi từ bất kỳ đâu
  const startCall = useCallback((conversationId, callType = CALL_TYPE.VOICE, remoteUser = null, targetUserId = null) => {
    if (!conversationId) {
      console.warn("startCall cần conversationId");
      return false;
    }
    return call.initiateCall(conversationId, callType, remoteUser, targetUserId);
  }, [call]);

  const value = useMemo(
    () => ({
      // State
      status: call.status,
      callType: call.callType,
      callId: call.callId,
      conversationId: call.conversationId,
      remoteUser: call.remoteUser,
      isCaller: call.isCaller,
      error: call.error,
      duration: call.duration,
      isMuted: call.isMuted,
      isVideoOff: call.isVideoOff,
      localStream: call.localStream,
      remoteStream: call.remoteStream,
      isInCall: call.isInCall,
      isRequestingMedia: call.isRequestingMedia,
      isWebRTCSupported: call.isWebRTCSupported,

      // Actions
      startCall,
      acceptCall: call.acceptCall,
      rejectCall: call.rejectCall,
      endCall: call.endCall,
      toggleMute: call.toggleMute,
      toggleVideo: call.toggleVideo,
      switchCamera: call.switchCamera,
      resetCallState: call.resetCallState,
    }),
    [call, startCall]
  );

  const showIncoming = call.status === CALL_STATUS.INCOMING;
  const showVoice = call.isInCall && call.callType === CALL_TYPE.VOICE;
  const showVideo = call.isInCall && call.callType === CALL_TYPE.VIDEO;

  return (
    <CallContext.Provider value={value}>
      {children}

      {/* Global Call UIs - luôn ở trên cùng */}
      <IncomingCallModal
        visible={showIncoming}
        caller={call.remoteUser}
        callType={call.callType}
        onAccept={call.acceptCall}
        onReject={() => call.rejectCall()}
      />

      <VoiceCallScreen
        visible={showVoice}
        remoteUser={call.remoteUser}
        status={call.status}
        duration={call.duration}
        isMuted={call.isMuted}
        isRequestingMedia={call.isRequestingMedia}
        remoteStream={call.remoteStream}
        onToggleMute={call.toggleMute}
        onEndCall={() => call.endCall()}
      />

      <VideoCallScreen
        visible={showVideo}
        remoteUser={call.remoteUser}
        status={call.status}
        duration={call.duration}
        localStream={call.localStream}
        remoteStream={call.remoteStream}
        isMuted={call.isMuted}
        isVideoOff={call.isVideoOff}
        isRequestingMedia={call.isRequestingMedia}
        onToggleMute={call.toggleMute}
        onToggleVideo={call.toggleVideo}
        onSwitchCamera={call.switchCamera}
        onEndCall={() => call.endCall()}
      />
    </CallContext.Provider>
  );
}

export function useCall() {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error("useCall phải được dùng bên trong CallProvider");
  }
  return context;
}

// Export cả types để tiện import
export { CALL_TYPE, CALL_STATUS } from "./callTypes";
