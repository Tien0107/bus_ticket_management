/**
 * SOCKET_CALL_HANDLER_IMPLEMENTATION.js
 * 
 * Voice & Video Call - Socket.IO Signaling Server Implementation
 * Hỗ trợ đầy đủ luồng gọi thoại + video 1:1 theo contract trong BACKEND_SIGNALING.md
 * 
 * Hướng dẫn sử dụng:
 * 1. Copy toàn bộ logic call handlers vào file handler socket server hiện tại của bạn
 * 2. Truyền vào `options.resolveCallRecipients` nếu có service lấy thành viên box
 * 3. Đảm bảo user đã join room theo userId (đã có sẵn trong code cũ)
 */

const { extractUserId } = require("./auth");
const { readUnreadCount } = require("../service/index.js");
const {
  toValidUserId,
  addOnlineSocket,
  removeOnlineSocket,
  getOnlineUserIds,
} = require("./online-store");

// ==================== CONSTANTS ====================
const GET_ONLINE_USERS_EVENT = "users:online:get";
const ONLINE_USERS_EVENT = "users:online";

const ALLOWED_CALL_TYPES = new Set(["voice", "video"]);

// Client → Server events (theo contract mới)
const CALL_CLIENT = {
  INITIATE: "call:initiate",
  ACCEPT: "call:accept",
  REJECT: "call:reject",
  OFFER: "call:offer",
  ANSWER: "call:answer",
  ICE_CANDIDATE: "call:ice-candidate",
  END: "call:end",
};

// Server → Client events
const CALL_SERVER = {
  INCOMING: "call:incoming",
  ACCEPTED: "call:accepted",
  REJECTED: "call:rejected",
  OFFER: "call:offer",
  ANSWER: "call:answer",
  ICE_CANDIDATE: "call:ice-candidate",
  ENDED: "call:ended",
  ERROR: "call:error",
};

// Call reasons (phải khớp với frontend callTypes.js)
const CALL_REASON = {
  USER_ENDED: "user-ended",
  PEER_DISCONNECTED: "peer-disconnected",
  BUSY: "busy",
  DECLINED: "declined",
  NO_ANSWER: "no-answer",
  ERROR: "error",
  TIMEOUT: "timeout",
};

const CALL_ERROR = {
  PERMISSION_DENIED: "permission_denied",
  MEDIA_FAILED: "media_failed",
  PEER_UNAVAILABLE: "peer_unavailable",
  CONNECTION_FAILED: "connection_failed",
  ALREADY_IN_CALL: "already_in_call",
  INVALID_STATE: "invalid_state",
  UNKNOWN: "unknown",
};

// Timeout (ms) - server cũng nên enforce
const RING_TIMEOUT_MS = 45000;
const INITIATE_TIMEOUT_MS = 45000;

// ==================== STATE ====================
/**
 * activeCalls: Map<callId, CallSession>
 * 
 * CallSession = {
 *   callId: string,
 *   boxId: string,
 *   callType: 'voice'|'video',
 *   callerId: number,
 *   participants: number[],      // tất cả userId tham gia (thường 2)
 *   status: 'initiating'|'ringing'|'connecting'|'connected'|'ended',
 *   startedAt: number,
 *   acceptedBy?: number,
 *   ringTimeout?: NodeJS.Timeout,
 *   initiateTimeout?: NodeJS.Timeout,
 * }
 */
const activeCalls = new Map();           // callId → session
const userToCallId = new Map();          // userId → callId (để check busy nhanh)

// Legacy support (giữ nguyên để không phá code cũ nếu còn chỗ khác dùng)
const activeCallsByBoxId = new Map();

// ==================== HELPERS ====================

function normalizeBoxId(payload) {
  return String(payload?.conversationId || payload?.boxId || "");
}

function toNumberUserId(id) {
  const n = Number(id);
  return Number.isFinite(n) ? n : null;
}

function isUserInCall(userId) {
  return userToCallId.has(userId);
}

function getCallByUserId(userId) {
  const callId = userToCallId.get(userId);
  return callId ? activeCalls.get(callId) : null;
}

function addUserToCall(userId, callId) {
  userToCallId.set(userId, callId);
}

function removeUserFromCall(userId) {
  userToCallId.delete(userId);
}

function cleanupCall(callId, reason = null) {
  const session = activeCalls.get(callId);
  if (!session) return null;

  // Clear timers
  if (session.ringTimeout) clearTimeout(session.ringTimeout);
  if (session.initiateTimeout) clearTimeout(session.initiateTimeout);

  // Remove all participants khỏi userToCallId
  (session.participants || []).forEach((uid) => {
    if (userToCallId.get(uid) === callId) {
      userToCallId.delete(uid);
    }
  });

  activeCalls.delete(callId);
  activeCallsByBoxId.delete(String(session.boxId)); // legacy

  return session;
}

function getOtherParticipants(session, excludeUserId) {
  return (session.participants || []).filter((id) => id !== excludeUserId);
}

// ==================== CORE: RESOLVE RECIPIENTS ====================

/**
 * Resolve người tham gia cuộc gọi (để check busy + lưu session).
 * Lưu ý: Việc gửi "call:incoming" hiện chỉ qua box room (io.to(boxId)),
 * nghĩa là chỉ user đã bấm vào hộp thoại đó (đã chat:join) mới nhận được.
 * Hàm này vẫn cần để:
 *   - Kiểm tra người trong box có đang bận gọi không
 *   - Lưu danh sách participants của cuộc gọi
 */
async function resolveRecipients(io, socket, payload, options = {}) {
  const boxId = normalizeBoxId(payload);
  const callerId = socket.data.userId;
  if (!boxId || !callerId) return [];

  // 1. Client chủ động chỉ định (khuyến khích dùng cách này từ UI)
  const directTargets = payload.targetUserId
    ? [payload.targetUserId]
    : (payload.targetUserIds || []);

  if (directTargets.length > 0) {
    return directTargets
      .map(toNumberUserId)
      .filter((id) => id && id !== callerId);
  }

  // 2. Sử dụng resolver từ options (tốt nhất cho production)
  if (typeof options.resolveCallRecipients === "function") {
    try {
      const result = await options.resolveCallRecipients(boxId, callerId);
      if (Array.isArray(result)) {
        return result.map(toNumberUserId).filter((id) => id && id !== callerId);
      }
      if (result) {
        const single = toNumberUserId(result);
        return single && single !== callerId ? [single] : [];
      }
    } catch (e) {
      console.error("[CALL] resolveCallRecipients error:", e);
    }
  }

  // 3. Fallback: quét socket room của box (chỉ những người đang mở chat box đó)
  const room = io.sockets.adapter.rooms.get(String(boxId));
  const recipients = [];
  if (room) {
    for (const sockId of room) {
      const s = io.sockets.sockets.get(sockId);
      const uid = s?.data?.userId;
      if (uid && uid !== callerId && !recipients.includes(uid)) {
        recipients.push(uid);
      }
    }
  }

  return recipients;
}

// ==================== EMIT HELPERS ====================

function emitToUser(io, userId, event, payload) {
  io.to(String(userId)).emit(event, payload);
}

function emitCallError(socket, code, message, extra = {}) {
  socket.emit(CALL_SERVER.ERROR, {
    code,
    message,
    ...extra,
  });
}

function normalizeLegacyTargetIds(payload = {}) {
  const rawTargets = payload.targetUserIds || (payload.targetUserId ? [payload.targetUserId] : []);
  return rawTargets
    .map(toNumberUserId)
    .filter(Boolean);
}

function getLegacyPeerIds(session, payload = {}, senderId) {
  const ids = new Set([
    ...(session?.participants || []),
    ...normalizeLegacyTargetIds(payload),
  ]);

  ids.delete(senderId);
  return Array.from(ids);
}

function emitLegacyToPeers(io, socket, boxId, event, payload, session = null, sourcePayload = {}) {
  socket.to(String(boxId)).emit(event, payload);
  getLegacyPeerIds(session, sourcePayload, socket.data.userId).forEach((peerId) => {
    emitToUser(io, peerId, event, payload);
  });
}

// ==================== MAIN HANDLERS ====================

function registerCallHandlers(io, socket, app, options = {}) {
  const userId = socket.data.userId;

  // ========== CALL: INITIATE (Bắt đầu cuộc gọi) ==========
  socket.on(CALL_CLIENT.INITIATE, async (payload = {}) => {
    const boxId = normalizeBoxId(payload);
    const callType = ALLOWED_CALL_TYPES.has(payload.callType) ? payload.callType : "voice";
    const clientCallId = payload.callId;

    if (!boxId || !clientCallId) {
      return emitCallError(socket, CALL_ERROR.INVALID_STATE, "Thiếu boxId hoặc callId");
    }

    // Kiểm tra đang có cuộc gọi khác
    if (isUserInCall(userId)) {
      return emitCallError(socket, CALL_ERROR.ALREADY_IN_CALL, "Bạn đang trong cuộc gọi khác");
    }

    // Kiểm tra callId đã tồn tại (trùng)
    if (activeCalls.has(clientCallId)) {
      return emitCallError(socket, CALL_ERROR.INVALID_STATE, "CallId đã tồn tại");
    }

    // Resolve người nhận
    const recipients = await resolveRecipients(io, socket, payload, options);

    app.log?.info?.({
      event: "call:initiate",
      callId: clientCallId,
      boxId,
      callerId: userId,
      targetUserId: payload.targetUserId,
      resolvedRecipients: recipients,
      note: "call:incoming sẽ chỉ được broadcast vào box room (chỉ ai đang mở hộp thoại mới nhận)",
    }, "Received call:initiate - delivery is box-room only");

    if (recipients.length === 0) {
      app.log?.warn?.({ callId: clientCallId, boxId, callerId: userId }, "No recipients found for call");
      return emitCallError(
        socket,
        CALL_ERROR.PEER_UNAVAILABLE,
        "Không tìm thấy người nhận trong cuộc trò chuyện này"
      );
    }

    // Kiểm tra người nhận có đang bận không (1:1 case)
    const busyRecipient = recipients.find((rid) => isUserInCall(rid));
    if (busyRecipient) {
      return emitCallError(
        socket,
        CALL_ERROR.PEER_UNAVAILABLE,
        "Người nhận đang bận",
        { reason: CALL_REASON.BUSY }
      );
    }

    // Tạo session
    const session = {
      callId: clientCallId,
      boxId: String(boxId),
      callType,
      callerId: userId,
      participants: [userId, ...recipients],
      status: "initiating",
      startedAt: Date.now(),
    };

    activeCalls.set(clientCallId, session);
    activeCallsByBoxId.set(String(boxId), session); // legacy compat
    addUserToCall(userId, clientCallId);
    recipients.forEach((rid) => addUserToCall(rid, clientCallId));

    const fromUser = {
      id: userId,
      name: socket.data.userName || undefined,
      avatar: socket.data.userAvatar || undefined,
    };

    const incomingPayload = {
      callId: clientCallId,
      conversationId: Number(boxId),
      boxId: Number(boxId),
      callType,
      from: fromUser,
      timestamp: new Date().toISOString(),
    };

    // Gửi theo personal user room để người nhận online vẫn thấy cuộc gọi
    // dù họ chưa mở đúng chat box. `chat:join` vẫn dùng để đồng bộ active call khi mở lại box.
    recipients.forEach((rid) => {
      emitToUser(io, rid, CALL_SERVER.INCOMING, incomingPayload);
    });

    app.log?.info?.({
      event: "call:incoming:sent",
      callId: clientCallId,
      boxId,
      via: "user-room",
    }, "Sent call:incoming to recipient user rooms");

    // Server-side ring timeout (nếu callee không trả lời)
    session.ringTimeout = setTimeout(() => {
      const stillActive = activeCalls.get(clientCallId);
      if (stillActive && stillActive.status !== "connected") {
        // Thông báo rejected cho caller
        emitToUser(io, userId, CALL_SERVER.REJECTED, {
          callId: clientCallId,
          conversationId: Number(boxId),
          reason: CALL_REASON.NO_ANSWER,
        });

        // Dọn dẹp
        cleanupCall(clientCallId);
      }
    }, RING_TIMEOUT_MS);

    // Server-side initiate timeout (phòng caller treo máy)
    session.initiateTimeout = setTimeout(() => {
      const stillActive = activeCalls.get(clientCallId);
      if (stillActive && stillActive.status !== "connected") {
        cleanupCall(clientCallId);
      }
    }, INITIATE_TIMEOUT_MS + 5000);

    app.log?.info?.({ callId: clientCallId, boxId, callerId: userId, recipients }, "Call initiated");
  });

  // ========== CALL: ACCEPT ==========
  socket.on(CALL_CLIENT.ACCEPT, (payload = {}) => {
    const callId = payload.callId;
    const boxId = normalizeBoxId(payload);

    const session = activeCalls.get(callId);
    if (!session) {
      return emitCallError(socket, CALL_ERROR.INVALID_STATE, "Cuộc gọi không tồn tại hoặc đã kết thúc");
    }

    if (!session.participants.includes(userId)) {
      return emitCallError(socket, CALL_ERROR.INVALID_STATE, "Bạn không thuộc cuộc gọi này");
    }

    if (session.callerId === userId) {
      return emitCallError(socket, CALL_ERROR.INVALID_STATE, "Người gọi không thể accept");
    }

    // Clear ring timeout
    if (session.ringTimeout) {
      clearTimeout(session.ringTimeout);
      session.ringTimeout = null;
    }

    session.status = "connecting";
    session.acceptedBy = userId;

    const byUser = {
      id: userId,
      name: socket.data.userName,
      avatar: socket.data.userAvatar,
    };

    // Phát accepted cho TẤT CẢ participants (bao gồm cả caller)
    session.participants.forEach((pid) => {
      emitToUser(io, pid, CALL_SERVER.ACCEPTED, {
        callId,
        conversationId: Number(session.boxId),
        boxId: Number(session.boxId),
        by: byUser,
      });
    });

    app.log?.info?.({ callId, acceptedBy: userId }, "Call accepted");
  });

  // ========== CALL: REJECT ==========
  socket.on(CALL_CLIENT.REJECT, (payload = {}) => {
    const callId = payload.callId;
    const boxId = normalizeBoxId(payload);
    const reason = payload.reason || CALL_REASON.DECLINED;

    const session = activeCalls.get(callId);
    if (!session) return; // im lặng nếu đã hết

    if (!session.participants.includes(userId)) return;

    // Clear timers
    if (session.ringTimeout) clearTimeout(session.ringTimeout);
    if (session.initiateTimeout) clearTimeout(session.initiateTimeout);

    const rejectedBy = {
      id: userId,
      name: socket.data.userName,
      avatar: socket.data.userAvatar,
    };

    // Gửi rejected cho tất cả (trừ người reject)
    getOtherParticipants(session, userId).forEach((pid) => {
      emitToUser(io, pid, CALL_SERVER.REJECTED, {
        callId,
        conversationId: Number(session.boxId),
        boxId: Number(session.boxId),
        by: rejectedBy,
        reason,
      });
    });

    cleanupCall(callId);

    app.log?.info?.({ callId, rejectedBy: userId, reason }, "Call rejected");
  });

  // ========== CALL: OFFER (WebRTC) ==========
  socket.on(CALL_CLIENT.OFFER, (payload = {}) => {
    const callId = payload.callId;
    const offer = payload.offer;
    const boxId = normalizeBoxId(payload);

    if (!callId || !offer) return;

    const session = activeCalls.get(callId);
    if (!session) return;

    if (!session.participants.includes(userId)) return;

    // Forward offer cho những người khác trong cuộc gọi
    getOtherParticipants(session, userId).forEach((pid) => {
      emitToUser(io, pid, CALL_SERVER.OFFER, {
        callId,
        conversationId: Number(session.boxId),
        boxId: Number(session.boxId),
        offer,
        from: { id: userId },
      });
    });
  });

  // ========== CALL: ANSWER (WebRTC) ==========
  socket.on(CALL_CLIENT.ANSWER, (payload = {}) => {
    const callId = payload.callId;
    const answer = payload.answer;

    if (!callId || !answer) return;

    const session = activeCalls.get(callId);
    if (!session) return;

    if (!session.participants.includes(userId)) return;

    // Chuyển sang trạng thái connected khi nhận answer đầu tiên
    if (session.status === "connecting") {
      session.status = "connected";
    }

    getOtherParticipants(session, userId).forEach((pid) => {
      emitToUser(io, pid, CALL_SERVER.ANSWER, {
        callId,
        conversationId: Number(session.boxId),
        boxId: Number(session.boxId),
        answer,
        from: { id: userId },
      });
    });
  });

  // ========== CALL: ICE CANDIDATE ==========
  socket.on(CALL_CLIENT.ICE_CANDIDATE, (payload = {}) => {
    const callId = payload.callId;
    const candidate = payload.candidate;

    if (!callId) return;

    const session = activeCalls.get(callId);
    if (!session) return;

    if (!session.participants.includes(userId)) return;

    getOtherParticipants(session, userId).forEach((pid) => {
      emitToUser(io, pid, CALL_SERVER.ICE_CANDIDATE, {
        callId,
        conversationId: Number(session.boxId),
        boxId: Number(session.boxId),
        candidate,
        from: { id: userId },
      });
    });
  });

  // ========== CALL: END ==========
  socket.on(CALL_CLIENT.END, (payload = {}) => {
    const callId = payload.callId;
    const reason = payload.reason || CALL_REASON.USER_ENDED;

    const session = activeCalls.get(callId);
    if (!session) return;

    if (!session.participants.includes(userId)) return;

    const endedBy = {
      id: userId,
      name: socket.data.userName,
      avatar: socket.data.userAvatar,
    };

    // Thông báo cho những người còn lại
    getOtherParticipants(session, userId).forEach((pid) => {
      emitToUser(io, pid, CALL_SERVER.ENDED, {
        callId,
        conversationId: Number(session.boxId),
        boxId: Number(session.boxId),
        endedBy,
        reason,
      });
    });

    cleanupCall(callId);

    app.log?.info?.({ callId, endedBy: userId, reason }, "Call ended by user");
  });
}

// ==================== DISCONNECT CLEANUP ====================

function handleCallCleanupOnDisconnect(io, socket, userId, app) {
  const callId = userToCallId.get(userId);
  if (!callId) return;

  const session = activeCalls.get(callId);
  if (!session) {
    removeUserFromCall(userId);
    return;
  }

  // Thông báo cho những người còn lại
  getOtherParticipants(session, userId).forEach((pid) => {
    emitToUser(io, pid, CALL_SERVER.ENDED, {
      callId,
      conversationId: Number(session.boxId),
      boxId: Number(session.boxId),
      endedBy: "system",
      reason: CALL_REASON.PEER_DISCONNECTED,
    });
  });

  cleanupCall(callId);

  app.log?.info?.({ userId, callId }, "Call cleaned up due to disconnect");
}

function handleLegacyCallCleanupOnDisconnect(io, socket, userId, app) {
  for (const [boxId, session] of activeCallsByBoxId.entries()) {
    if (session.callId) continue;

    const participants = session.participants || [session.userId].filter(Boolean);
    if (!participants.includes(userId)) continue;

    activeCallsByBoxId.delete(boxId);
    const payload = {
      userId,
      boxId: String(boxId),
      reason: CALL_REASON.PEER_DISCONNECTED,
    };
    emitLegacyToPeers(io, socket, boxId, "chat:call:end", payload, session);

    app.log?.info?.({ userId, boxId }, "Legacy call cleaned up due to disconnect");
  }
}

// ==================== REGISTER ALL SOCKET HANDLERS ====================

function registerSocketHandlers(io, app, options = {}) {
  io.on("connection", (socket) => {
    const isInternal = socket.handshake.auth?.type === "internal";

    if (isInternal) {
      app.log.info({ socketId: socket.id }, "Internal API connected");
      socket.onAny((event, payload) => {
        socket.to(String(payload.targetId)).emit(event, payload.data ?? {});
      });
      return;
    }

    const userId = toValidUserId(extractUserId(socket));
    if (!userId) {
      app.log.warn({ socketId: socket.id }, "Connection without valid userId");
      socket.disconnect(true);
      return;
    }

    socket.data.userId = userId;

    // Join personal room (rất quan trọng cho call:incoming)
    socket.join(String(userId));

    const onlineSocketsCount = addOnlineSocket(userId, socket.id);
    if (onlineSocketsCount === 1) {
      socket.broadcast.emit("user:online", { userId });
    }

    socket.emit(ONLINE_USERS_EVENT, { userIds: getOnlineUserIds() });
    app.log.info({ socketId: socket.id, userId }, "Connected");

    // ==================== ONLINE USERS ====================
    socket.on(GET_ONLINE_USERS_EVENT, (payload = {}, callback) => {
      const response = { userIds: getOnlineUserIds() };
      if (typeof callback === "function") {
        callback(response);
      } else {
        socket.emit(ONLINE_USERS_EVENT, response);
      }
    });

    // ==================== CHAT (giữ nguyên) ====================
    socket.on("chat:join", (payload = {}) => {
      const boxId = payload.boxId || payload.conversationId;
      if (!boxId) return;

      if (!socket.rooms.has(String(boxId))) {
        socket.join(String(boxId));
      }
      socket.emit("chat:joined", { boxId });

      // Đồng bộ active call khi user mở lại box.
      const activeCall = activeCallsByBoxId.get(String(boxId));
      if (activeCall?.callId) {
        if (
          activeCall.participants?.includes(userId) &&
          activeCall.callerId !== userId &&
          activeCall.status !== "ended"
        ) {
          socket.emit(CALL_SERVER.INCOMING, {
            callId: activeCall.callId,
            conversationId: Number(activeCall.boxId),
            boxId: Number(activeCall.boxId),
            callType: activeCall.callType,
            from: { id: activeCall.callerId },
            timestamp: new Date(activeCall.startedAt).toISOString(),
          });
        }
      } else if (activeCall) {
        socket.emit("chat:call:active", activeCall);
      }
    });

    socket.on("chat:read", async (payload = {}) => {
      try {
        const result = await readUnreadCount({
          baseUrl: app.config?.API_URL,
          boxId: payload.boxId,
          token: socket.data.bearerToken,
        });
        socket.emit("chat:unread:count", {
          unreadReceiverCount: result.unreadReceiverCount,
          unreadSenderCount: result.unreadSenderCount,
          boxId: result.boxId,
        });
      } catch (e) {
        app.log?.error?.(e, "chat:read error");
      }
    });

    socket.on("chat:typing:start", (payload = {}) => {
      const boxId = payload.boxId || payload.conversationId;
      if (!boxId) return;
      socket.to(String(boxId)).emit("chat:typing:start", {
        userId: socket.data.userId,
        boxId,
      });
    });

    socket.on("chat:typing:stop", (payload = {}) => {
      const boxId = payload.boxId || payload.conversationId;
      if (!boxId) return;
      socket.to(String(boxId)).emit("chat:typing:stop", {
        userId: socket.data.userId,
        boxId,
      });
    });

    // ==================== VOICE / VIDEO CALL (NEW PROTOCOL) ====================
    registerCallHandlers(io, socket, app, options);

    // ==================== LEGACY CHAT CALL (giữ tạm để không crash nếu UI cũ còn gọi) ====================
    // Có thể xoá sau khi frontend chỉ dùng call:* events
    socket.on("chat:call:start", (payload = {}) => {
      const boxId = normalizeBoxId(payload);
      if (!boxId) return;

      const existing = activeCallsByBoxId.get(String(boxId));
      if (existing) {
        socket.emit("chat:call:active", existing);
        return;
      }

      const callType = ALLOWED_CALL_TYPES.has(payload.callType) ? payload.callType : "voice";
      const targetUserIds = normalizeLegacyTargetIds(payload)
        .filter((targetId) => targetId !== socket.data.userId);
      const legacySession = {
        userId: socket.data.userId,
        boxId: String(boxId),
        callType,
        startedAt: Date.now(),
        participants: [socket.data.userId, ...targetUserIds],
        offer: null,
        candidates: [],
        // Lưu ý: legacy flow không có callId → không tương thích với useWebRTCCall mới
      };
      activeCallsByBoxId.set(String(boxId), legacySession);
      emitLegacyToPeers(io, socket, boxId, "chat:call:start", legacySession, legacySession, payload);
    });

    socket.on("chat:call:offer", (payload = {}) => {
      const boxId = normalizeBoxId(payload);
      if (!boxId || !payload.offer) return;
      const legacySession = activeCallsByBoxId.get(String(boxId));
      if (legacySession && !legacySession.callId) {
        legacySession.offer = payload.offer;
      }
      const eventPayload = {
        userId: socket.data.userId,
        boxId,
        offer: payload.offer,
      };
      emitLegacyToPeers(io, socket, boxId, "chat:call:offer", eventPayload, legacySession, payload);
    });

    socket.on("chat:call:answer", (payload = {}) => {
      const boxId = normalizeBoxId(payload);
      if (!boxId || !payload.answer) return;
      const legacySession = activeCallsByBoxId.get(String(boxId));
      const eventPayload = {
        userId: socket.data.userId,
        boxId,
        answer: payload.answer,
      };
      emitLegacyToPeers(io, socket, boxId, "chat:call:answer", eventPayload, legacySession, payload);
    });

    socket.on("chat:call:ice-candidate", (payload = {}) => {
      const boxId = normalizeBoxId(payload);
      if (!boxId || !payload.candidate) return;
      const legacySession = activeCallsByBoxId.get(String(boxId));
      if (legacySession && !legacySession.callId) {
        legacySession.candidates = legacySession.candidates || [];
        legacySession.candidates.push(payload.candidate);
        if (legacySession.candidates.length > 50) {
          legacySession.candidates.shift();
        }
      }
      const eventPayload = {
        userId: socket.data.userId,
        boxId,
        candidate: payload.candidate,
      };
      emitLegacyToPeers(io, socket, boxId, "chat:call:ice-candidate", eventPayload, legacySession, payload);
    });

    socket.on("chat:call:reject", (payload = {}) => {
      const boxId = normalizeBoxId(payload);
      if (!boxId) return;
      const legacySession = activeCallsByBoxId.get(String(boxId));
      activeCallsByBoxId.delete(String(boxId));
      const eventPayload = {
        userId: socket.data.userId,
        boxId: String(boxId),
      };
      emitLegacyToPeers(io, socket, boxId, "chat:call:reject", eventPayload, legacySession, payload);
    });

    socket.on("chat:call:end", (payload = {}) => {
      const boxId = normalizeBoxId(payload);
      if (!boxId) return;
      const legacySession = activeCallsByBoxId.get(String(boxId));
      activeCallsByBoxId.delete(String(boxId));
      const eventPayload = {
        userId: socket.data.userId,
        boxId: String(boxId),
      };
      emitLegacyToPeers(io, socket, boxId, "chat:call:end", eventPayload, legacySession, payload);
    });

    // ==================== LEAVE & DISCONNECT ====================
    socket.on("chat:leave", (payload = {}) => {
      const boxId = payload.boxId || payload.conversationId;
      if (boxId) {
        socket.leave(String(boxId));
        socket.to(String(boxId)).emit("user:left", { userId: socket.data.userId });
      }
    });

    socket.on("disconnect", (reason) => {
      app.log.info({ socketId: socket.id, userId, reason }, "Disconnected");

      // Dọn dẹp cuộc gọi đang active (nếu có)
      handleCallCleanupOnDisconnect(io, socket, userId, app);
      handleLegacyCallCleanupOnDisconnect(io, socket, userId, app);

      const onlineSocketsCount = removeOnlineSocket(userId, socket.id);
      if (onlineSocketsCount === 0) {
        socket.broadcast.emit("user:offline", { userId });
      }
    });
  });
}

// ==================== UTILITY EXPORTS (cho admin / debug) ====================

function getActiveCallsSnapshot() {
  return Array.from(activeCalls.values()).map((s) => ({
    callId: s.callId,
    boxId: s.boxId,
    callType: s.callType,
    callerId: s.callerId,
    participants: s.participants,
    status: s.status,
    durationMs: Date.now() - s.startedAt,
  }));
}

module.exports = {
  registerSocketHandlers,
  // Dùng cho testing / monitoring
  _internal: {
    activeCalls,
    userToCallId,
    getActiveCallsSnapshot,
    cleanupCall,
  },
};
