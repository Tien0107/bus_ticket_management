





export const CALL_TYPE = {
  VOICE: "voice",
  VIDEO: "video"
};

export const CALL_STATUS = {
  IDLE: "idle",
  INITIATING: "initiating",
  INCOMING: "incoming",
  RINGING: "ringing",
  CONNECTING: "connecting",
  CONNECTED: "connected",
  ENDED: "ended",
  ERROR: "error"
};

export const CALL_REASON = {
  USER_ENDED: "user-ended",
  PEER_DISCONNECTED: "peer-disconnected",
  BUSY: "busy",
  DECLINED: "declined",
  NO_ANSWER: "no-answer",
  ERROR: "error",
  TIMEOUT: "timeout"
};

export const CALL_ERROR_CODE = {
  PERMISSION_DENIED: "permission_denied",
  MEDIA_FAILED: "media_failed",
  PEER_UNAVAILABLE: "peer_unavailable",
  CONNECTION_FAILED: "connection_failed",
  ALREADY_IN_CALL: "already_in_call",
  INVALID_STATE: "invalid_state",
  UNKNOWN: "unknown"
};


export const CALL_CLIENT_EVENTS = {
  INITIATE: "call:initiate",
  ACCEPT: "call:accept",
  REJECT: "call:reject",
  OFFER: "call:offer",
  ANSWER: "call:answer",
  ICE_CANDIDATE: "call:ice-candidate",
  END: "call:end"
};


export const CALL_SERVER_EVENTS = {
  INCOMING: "call:incoming",
  ACCEPTED: "call:accepted",
  REJECTED: "call:rejected",
  OFFER: "call:offer",
  ANSWER: "call:answer",
  ICE_CANDIDATE: "call:ice-candidate",
  ENDED: "call:ended",
  ERROR: "call:error"
};


export const LEGACY_CALL_EVENTS = {

  START: "chat:call:start",
  OFFER: "chat:call:offer",
  ANSWER: "chat:call:answer",
  ICE_CANDIDATE: "chat:call:ice-candidate",
  REJECT: "chat:call:reject",
  END: "chat:call:end",


  STARTED: "chat:call:start",
  ACTIVE: "chat:call:active",
  REJECTED: "chat:call:reject",
  ENDED: "chat:call:end"
};





export function generateCallId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `call_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 11)}`;
}




export function isWebRTCSupported() {
  return !!(
  typeof window !== "undefined" &&
  window.RTCPeerConnection &&
  navigator?.mediaDevices?.getUserMedia);

}





export const DEFAULT_ICE_SERVERS = [
{ urls: "stun:stun.l.google.com:19302" },
{ urls: "stun:stun1.l.google.com:19302" },
{ urls: "stun:stun2.l.google.com:19302" }];





export const RING_TIMEOUT_MS = 45000;




export const INITIATE_TIMEOUT_MS = 45000;