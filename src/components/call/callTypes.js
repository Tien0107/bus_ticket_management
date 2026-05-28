/**
 * callTypes.js
 * Định nghĩa types và constants cho tính năng gọi thoại/video (1:1)
 * Sử dụng qua Socket.IO signaling (không cần REST API riêng)
 */

export const CALL_TYPE = {
  VOICE: "voice",
  VIDEO: "video",
};

export const CALL_STATUS = {
  IDLE: "idle",
  INITIATING: "initiating",      // Đang gọi đi (caller)
  INCOMING: "incoming",          // Có cuộc gọi đến (callee)
  RINGING: "ringing",            // Đang đổ chuông
  CONNECTING: "connecting",      // Đã accept, đang setup WebRTC
  CONNECTED: "connected",        // Đã kết nối thành công (có remote stream)
  ENDED: "ended",
  ERROR: "error",
};

export const CALL_REASON = {
  USER_ENDED: "user-ended",
  PEER_DISCONNECTED: "peer-disconnected",
  BUSY: "busy",
  DECLINED: "declined",
  NO_ANSWER: "no-answer",
  ERROR: "error",
  TIMEOUT: "timeout",
};

export const CALL_ERROR_CODE = {
  PERMISSION_DENIED: "permission_denied",
  MEDIA_FAILED: "media_failed",
  PEER_UNAVAILABLE: "peer_unavailable",
  CONNECTION_FAILED: "connection_failed",
  ALREADY_IN_CALL: "already_in_call",
  INVALID_STATE: "invalid_state",
  UNKNOWN: "unknown",
};

// Các event Socket.IO cho signaling (Client → Server) - NEW protocol
export const CALL_CLIENT_EVENTS = {
  INITIATE: "call:initiate",
  ACCEPT: "call:accept",
  REJECT: "call:reject",
  OFFER: "call:offer",
  ANSWER: "call:answer",
  ICE_CANDIDATE: "call:ice-candidate",
  END: "call:end",
};

// Các event Socket.IO cho signaling (Server → Client) - NEW protocol
export const CALL_SERVER_EVENTS = {
  INCOMING: "call:incoming",
  ACCEPTED: "call:accepted",
  REJECTED: "call:rejected",
  OFFER: "call:offer",
  ANSWER: "call:answer",
  ICE_CANDIDATE: "call:ice-candidate",
  ENDED: "call:ended",
  ERROR: "call:error",
};

// Legacy events (old backend protocol - chat:call:*)
export const LEGACY_CALL_EVENTS = {
  // Client -> Server
  START: "chat:call:start",
  OFFER: "chat:call:offer",
  ANSWER: "chat:call:answer",
  ICE_CANDIDATE: "chat:call:ice-candidate",
  REJECT: "chat:call:reject",
  END: "chat:call:end",

  // Server -> Client
  STARTED: "chat:call:start",
  ACTIVE: "chat:call:active",
  REJECTED: "chat:call:reject",
  ENDED: "chat:call:end",
};

/**
 * Tạo callId duy nhất cho mỗi phiên gọi (client-side)
 * Sử dụng crypto.randomUUID nếu có, fallback an toàn
 */
export function generateCallId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // Fallback cho môi trường cũ
  return `call_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Kiểm tra môi trường có hỗ trợ WebRTC không
 */
export function isWebRTCSupported() {
  return !!(
    typeof window !== "undefined" &&
    window.RTCPeerConnection &&
    navigator?.mediaDevices?.getUserMedia
  );
}

/**
 * Cấu hình STUN servers mặc định (public)
 * Backend có thể cấu hình TURN server riêng nếu cần production
 */
export const DEFAULT_ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
];

/**
 * Thời gian tối đa đổ chuông (ms) trước khi tự động reject "no-answer"
 */
export const RING_TIMEOUT_MS = 45000;

/**
 * Thời gian chờ accept từ phía bên kia (ms)
 */
export const INITIATE_TIMEOUT_MS = 45000;
