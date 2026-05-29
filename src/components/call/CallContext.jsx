







import React, { createContext, useContext, useCallback, useEffect, useMemo } from "react";
import useWebRTCCall from "./useWebRTCCall";
import { CALL_TYPE, CALL_STATUS } from "./callTypes";
import IncomingCallModal from "./IncomingCallModal";
import VoiceCallScreen from "./VoiceCallScreen";

const CallContext = createContext(null);

export function CallProvider({ children, externalSocket = null }) {


  const call = useWebRTCCall({ externalSocket });
  const { callType, rejectCall, status } = call;


  const startCall = useCallback((conversationId, callType = CALL_TYPE.VOICE, remoteUser = null, targetUserId = null) => {
    if (callType === CALL_TYPE.VIDEO) {
      console.warn("Video call đã được tắt");
      return false;
    }
    if (!conversationId) {
      console.warn("startCall cần conversationId");
      return false;
    }
    return call.initiateCall(conversationId, callType, remoteUser, targetUserId);
  }, [call]);

  useEffect(() => {
    if (status === CALL_STATUS.INCOMING && callType === CALL_TYPE.VIDEO) {
      rejectCall();
    }
  }, [callType, rejectCall, status]);

  const value = useMemo(
    () => ({

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


      startCall,
      acceptCall: call.acceptCall,
      rejectCall: call.rejectCall,
      endCall: call.endCall,
      toggleMute: call.toggleMute,
      toggleVideo: call.toggleVideo,
      switchCamera: call.switchCamera,
      resetCallState: call.resetCallState
    }),
    [call, startCall]
  );

  const showIncoming = call.status === CALL_STATUS.INCOMING && call.callType !== CALL_TYPE.VIDEO;
  const showVoice = call.isInCall && call.callType === CALL_TYPE.VOICE;

  return (
    <CallContext.Provider value={value}>
      {children}

      {}
      <IncomingCallModal
        visible={showIncoming}
        caller={call.remoteUser}
        callType={call.callType}
        onAccept={call.acceptCall}
        onReject={() => call.rejectCall()} />
      

      <VoiceCallScreen
        visible={showVoice}
        remoteUser={call.remoteUser}
        status={call.status}
        duration={call.duration}
        isMuted={call.isMuted}
        isRequestingMedia={call.isRequestingMedia}
        remoteStream={call.remoteStream}
        onToggleMute={call.toggleMute}
        onEndCall={() => call.endCall()} />
      

    </CallContext.Provider>);

}

export function useCall() {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error("useCall phải được dùng bên trong CallProvider");
  }
  return context;
}


export { CALL_TYPE, CALL_STATUS } from "./callTypes";