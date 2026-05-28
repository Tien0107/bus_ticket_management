/**
 * useWebRTCCall.js
 * Hook mạnh mẽ xử lý toàn bộ vòng đời cuộc gọi Voice/Video 1:1
 * - Signaling qua Socket.IO (đúng spec đã định nghĩa)
 * - WebRTC RTCPeerConnection + ICE + media streams
 * - Cleanup xuất sắc (tracks, pc, socket, timers, ringtone)
 * - Tất cả text tiếng Việt
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import {
    CALL_CLIENT_EVENTS,
    CALL_SERVER_EVENTS,
    LEGACY_CALL_EVENTS,
    CALL_STATUS,
    CALL_TYPE,
    CALL_REASON,
    CALL_ERROR_CODE,
    DEFAULT_ICE_SERVERS,
    generateCallId,
    INITIATE_TIMEOUT_MS,
    isWebRTCSupported,
    RING_TIMEOUT_MS,
} from "./callTypes";
import { getStoredUser } from "../chat/chatUtils";
import { SOCKET_URL } from "../chat/chatUtils";

const getToken = () =>
    localStorage.getItem("token")?.replace(/^Bearer\s+/i, "") || null;

const getCurrentUser = () => {
    const user = getStoredUser();
    if (!user?.id) return null;
    return {
        id: Number(user.id),
        name: user.fullName || user.username || "Người dùng",
        avatar: user.avatar || user.avatarUrl || null,
    };
};

const AUDIO_CONSTRAINTS = {
    echoCancellation: { ideal: true },
    noiseSuppression: { ideal: true },
    autoGainControl: { ideal: true },
    channelCount: { ideal: 1 },
    sampleRate: { ideal: 48000 },
    sampleSize: { ideal: 16 },
};

const VIDEO_CONSTRAINTS = {
    width: { min: 640, ideal: 1280, max: 1920 },
    height: { min: 360, ideal: 720, max: 1080 },
    frameRate: { ideal: 30, max: 30 },
    facingMode: "user",
    resizeMode: "crop-and-scale",
};

const SWITCH_CAMERA_VIDEO_CONSTRAINTS = (facingMode) => ({
    width: { min: 640, ideal: 1280, max: 1920 },
    height: { min: 360, ideal: 720, max: 1080 },
    frameRate: { ideal: 30, max: 30 },
    facingMode,
    resizeMode: "crop-and-scale",
});

function applyTrackQualityHints(stream) {
    if (!stream) return;

    stream.getAudioTracks().forEach((track) => {
        try { track.contentHint = "speech"; } catch {}
    });

    stream.getVideoTracks().forEach((track) => {
        try { track.contentHint = "motion"; } catch {}
    });
}

async function applyVideoQualityConstraints(stream) {
    const videoTrack = stream?.getVideoTracks?.()[0];
    if (!videoTrack?.applyConstraints) return;

    try {
        await videoTrack.applyConstraints(VIDEO_CONSTRAINTS);
    } catch (error) {
        console.warn("[CALL] Không ép được chất lượng camera, dùng cấu hình mặc định:", error);
    }
}

function tuneSenderParameters(sender) {
    if (!sender?.track || typeof sender.getParameters !== "function" || typeof sender.setParameters !== "function") {
        return;
    }

    try {
        const parameters = sender.getParameters();

        if (sender.track.kind === "video") {
            parameters.degradationPreference = "maintain-resolution";
            parameters.encodings = parameters.encodings?.length ? parameters.encodings : [{}];
            parameters.encodings[0] = {
                ...parameters.encodings[0],
                maxBitrate: 2500000,
                maxFramerate: 30,
            };
        }

        if (sender.track.kind === "audio") {
            parameters.encodings = parameters.encodings?.length ? parameters.encodings : [{}];
            parameters.encodings[0] = {
                ...parameters.encodings[0],
                maxBitrate: 64000,
            };
        }

        sender.setParameters(parameters).catch((error) => {
            console.warn("[CALL] Không set được RTP parameters:", error);
        });
    } catch (error) {
        console.warn("[CALL] Không đọc được RTP parameters:", error);
    }
}

/**
 * Tạo ringtone đơn giản bằng AudioContext (không cần file)
 */
function createRingtone() {
    let audioContext = null;
    let oscillator = null;
    let interval = null;
    let isPlaying = false;

    const start = () => {
        if (isPlaying) return;
        try {
            audioContext = new(window.AudioContext || window.webkitAudioContext)();
            isPlaying = true;

            const playTone = () => {
                if (!audioContext || !isPlaying) return;

                // Âm thanh chuông 2 tần số (như điện thoại)
                const o1 = audioContext.createOscillator();
                const o2 = audioContext.createOscillator();
                const g = audioContext.createGain();
                const filter = audioContext.createBiquadFilter();

                o1.type = "sine";
                o1.frequency.value = 440;
                o2.type = "sine";
                o2.frequency.value = 480;

                filter.type = "bandpass";
                filter.frequency.value = 800;
                filter.Q.value = 1.5;

                g.gain.value = 0.08;

                const duration = 0.9;

                const t = audioContext.currentTime;
                g.gain.setValueAtTime(0.08, t);
                g.gain.linearRampToValueAtTime(0.001, t + duration);

                o1.connect(filter);
                o2.connect(filter);
                filter.connect(g);
                g.connect(audioContext.destination);

                o1.start(t);
                o2.start(t);
                o1.stop(t + duration);
                o2.stop(t + duration);

                // Tiếng "brrr" thứ 2 sau 1.1s
                setTimeout(() => {
                    if (!isPlaying || !audioContext) return;
                    try {
                        const o3 = audioContext.createOscillator();
                        const o4 = audioContext.createOscillator();
                        const g2 = audioContext.createGain();
                        o3.type = "sine";
                        o3.frequency.value = 440;
                        o4.type = "sine";
                        o4.frequency.value = 480;
                        g2.gain.value = 0.06;
                        const t2 = audioContext.currentTime;
                        g2.gain.setValueAtTime(0.06, t2);
                        g2.gain.linearRampToValueAtTime(0.0001, t2 + 0.85);
                        o3.connect(g2);
                        o4.connect(g2);
                        g2.connect(audioContext.destination);
                        o3.start(t2);
                        o4.start(t2);
                        o3.stop(t2 + 0.85);
                        o4.stop(t2 + 0.85);
                    } catch {}
                }, 1100);
            };

            playTone();
            interval = setInterval(playTone, 2100);
        } catch (e) {
            console.warn("Không tạo được ringtone:", e);
        }
    };

    const stop = () => {
        isPlaying = false;
        if (interval) {
            clearInterval(interval);
            interval = null;
        }
        if (oscillator) {
            try { oscillator.stop(); } catch {}
            oscillator = null;
        }
        if (audioContext) {
            try { audioContext.close(); } catch {}
            audioContext = null;
        }
    };

    return { start, stop };
}

export default function useWebRTCCall(options = {}) {
    const {
        iceServers = DEFAULT_ICE_SERVERS,
            externalSocket = null, // Cho phép truyền socket từ bên ngoài nếu muốn tái sử dụng
    } = options;

    const [status, setStatus] = useState(CALL_STATUS.IDLE);
    const [callType, setCallType] = useState(null);
    const [callId, setCallId] = useState(null);
    const [conversationId, setConversationId] = useState(null);
    const [remoteUser, setRemoteUser] = useState(null); // {id, name, avatar}
    const [isCaller, setIsCaller] = useState(false);
    const [error, setError] = useState(null);
    const [duration, setDuration] = useState(0); // giây
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [isRequestingMedia, setIsRequestingMedia] = useState(false);

    // Refs
    const socketRef = useRef(null);
    const pcRef = useRef(null);
    const localStreamRef = useRef(null);
    const remoteStreamRef = useRef(null);
    const ringtoneRef = useRef(null);
    const durationTimerRef = useRef(null);
    const initiateTimeoutRef = useRef(null);
    const ringTimeoutRef = useRef(null);
    const pendingCandidatesRef = useRef([]); // ICE candidates đến trước khi remoteDesc
    const pendingLegacyOfferRef = useRef(null); // Buffer offer cho legacy khi nhận trước khi Accept
    const currentUserRef = useRef(getCurrentUser());
    const handledEventsRef = useRef(new Set());
    const attachedCallSocketsRef = useRef(new WeakSet()); // attach listeners once per socket instance
    const statusRef = useRef(CALL_STATUS.IDLE);
    const isInCallRef = useRef(false);
    const callIdRef = useRef(null);
    const conversationIdRef = useRef(null);
    const callTypeRef = useRef(null);
    const remoteUserRef = useRef(null);
    const isCallerRef = useRef(false);
    const signalingModeRef = useRef(null); // "legacy" | "standard"
    const handleErrorRef = useRef(null);
    const rejectCallRef = useRef(null);

    const isInCall = status !== CALL_STATUS.IDLE && status !== CALL_STATUS.ENDED;

    // ==================== CLEANUP ====================
    const cleanupMedia = useCallback(() => {
        // Dừng local tracks
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((track) => {
                try { track.stop(); } catch {}
            });
            localStreamRef.current = null;
        }
        setLocalStream(null);

        // Remote stream (không stop tracks của remote)
        if (remoteStreamRef.current) {
            remoteStreamRef.current = null;
        }
        setRemoteStream(null);
    }, []);

    const cleanupPeerConnection = useCallback(() => {
        if (pcRef.current) {
            try {
                pcRef.current.ontrack = null;
                pcRef.current.onicecandidate = null;
                pcRef.current.onconnectionstatechange = null;
                pcRef.current.oniceconnectionstatechange = null;
                pcRef.current.close();
            } catch {}
            pcRef.current = null;
        }
        pendingCandidatesRef.current = [];
    }, []);

    const stopRingtone = useCallback(() => {
        if (ringtoneRef.current) {
            try { ringtoneRef.current.stop(); } catch {}
            ringtoneRef.current = null;
        }
    }, []);

    const clearTimers = useCallback(() => {
        if (durationTimerRef.current) {
            clearInterval(durationTimerRef.current);
            durationTimerRef.current = null;
        }
        if (initiateTimeoutRef.current) {
            clearTimeout(initiateTimeoutRef.current);
            initiateTimeoutRef.current = null;
        }
        if (ringTimeoutRef.current) {
            clearTimeout(ringTimeoutRef.current);
            ringTimeoutRef.current = null;
        }
    }, []);

    const resetState = useCallback((toIdle = true) => {
        const nextStatus = toIdle ? CALL_STATUS.IDLE : CALL_STATUS.ENDED;
        statusRef.current = nextStatus;
        isInCallRef.current = nextStatus !== CALL_STATUS.IDLE && nextStatus !== CALL_STATUS.ENDED;
        setStatus(nextStatus);
        setCallType(null);
        setCallId(null);
        setConversationId(null);
        setRemoteUser(null);
        setIsCaller(false);
        setError(null);
        setDuration(0);
        setIsMuted(false);
        setIsVideoOff(false);
        setLocalStream(null);
        setRemoteStream(null);
        cleanupMedia();
        cleanupPeerConnection();
        stopRingtone();
        clearTimers();
        callIdRef.current = null;
        conversationIdRef.current = null;
        callTypeRef.current = null;
        remoteUserRef.current = null;
        isCallerRef.current = false;
        signalingModeRef.current = null;
        pendingCandidatesRef.current = [];
        pendingLegacyOfferRef.current = null;
    }, [cleanupMedia, cleanupPeerConnection, stopRingtone, clearTimers]);

    const getCurrentCallMode = useCallback(() => {
        if (signalingModeRef.current) return signalingModeRef.current;
        return String(callIdRef.current || "").startsWith("legacy-") ? "legacy" : "standard";
    }, []);

    const setCallSession = useCallback(({
        nextCallId,
        nextConversationId,
        nextCallType,
        nextRemoteUser = null,
        nextIsCaller = false,
        nextStatus = CALL_STATUS.INCOMING,
        signalingMode = null,
    }) => {
        const normalizedConversationId = nextConversationId ? String(nextConversationId) : nextConversationId;

        callIdRef.current = nextCallId;
        conversationIdRef.current = normalizedConversationId;
        callTypeRef.current = nextCallType;
        remoteUserRef.current = nextRemoteUser;
        isCallerRef.current = nextIsCaller;
        statusRef.current = nextStatus;
        isInCallRef.current = nextStatus !== CALL_STATUS.IDLE && nextStatus !== CALL_STATUS.ENDED;
        signalingModeRef.current = signalingMode || (
            String(nextCallId || "").startsWith("legacy-") ? "legacy" : "standard"
        );

        setCallId(nextCallId);
        setConversationId(normalizedConversationId);
        setCallType(nextCallType);
        setRemoteUser(nextRemoteUser);
        setIsCaller(nextIsCaller);
        setStatus(nextStatus);
        setError(null);
        setDuration(0);
    }, []);

    const rememberHandledEvent = useCallback((kind, payload = {}) => {
        const key = [
            kind,
            payload.callId,
            payload.boxId,
            payload.conversationId,
            payload.userId,
            payload.startedAt,
            payload.timestamp,
            payload.offer?.sdp?.slice?.(0, 80),
            payload.answer?.sdp?.slice?.(0, 80),
            payload.candidate?.candidate,
            payload.candidate?.sdpMid,
            payload.candidate?.sdpMLineIndex,
        ].map((value) => String(value ?? "")).join("|");

        if (handledEventsRef.current.has(key)) return false;
        handledEventsRef.current.add(key);

        if (handledEventsRef.current.size > 300) {
            const [oldestKey] = handledEventsRef.current;
            handledEventsRef.current.delete(oldestKey);
        }

        return true;
    }, []);

    // ==================== SOCKET ====================
    const getOrCreateSocket = useCallback(() => {
        // Ưu tiên cao nhất: externalSocket (chat socket chính)
        if (externalSocket) {
            return externalSocket;
        }

        // Fallback: socket chat chính được expose từ useChatSocket
        if (window.__chatSocket?.connected) {
            return window.__chatSocket;
        }

        if (socketRef.current?.connected) return socketRef.current;

        const token = getToken();
        if (!token) {
            setError({ code: CALL_ERROR_CODE.UNKNOWN, message: "Thiếu token xác thực" });
            return null;
        }

        const socket = io(SOCKET_URL, {
            transports: ["websocket", "polling"],
            auth: (cb) => cb({ token }),
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            timeout: 20000,
        });

        socketRef.current = socket;

        socket.on("connect", () => {
            console.log("[CALL] Private signaling socket connected", socket.id);
        });
        socket.on("connect_error", (err) => {
            console.error("[CALL] Private signaling socket connect_error", err?.message || err);
        });

        return socket;
    }, [externalSocket]);

    const disconnectSignalingSocket = useCallback(() => {
        if (socketRef.current && !externalSocket) {
            try { socketRef.current.disconnect(); } catch {}
            socketRef.current = null;
        }
    }, [externalSocket]);

    const joinCallRoom = useCallback((boxId, socket = null) => {
        const targetSocket = socket || getOrCreateSocket();
        if (!targetSocket || !boxId) return;

        targetSocket.emit("chat:join", { boxId });
    }, [getOrCreateSocket]);

    // ==================== WEBRTC CORE ====================
    const createPeerConnection = useCallback((onRemoteStream) => {
        cleanupPeerConnection();

        const pc = new RTCPeerConnection({ iceServers });

        pc.onicecandidate = (event) => {
            const socket = getOrCreateSocket();
            if (!socket || !conversationIdRef.current) return;

            const isLegacy = getCurrentCallMode() === "legacy";

            if (isLegacy) {
                // Legacy payload shape expected by backend
                socket.emit(LEGACY_CALL_EVENTS.ICE_CANDIDATE, {
                    boxId: conversationIdRef.current,
                    candidate: event.candidate || null,
                    targetUserId: remoteUserRef.current?.id ? Number(remoteUserRef.current.id) : undefined,
                });
            } else {
                socket.emit(CALL_CLIENT_EVENTS.ICE_CANDIDATE, {
                    callId: callIdRef.current,
                    conversationId: conversationIdRef.current,
                    candidate: event.candidate || null,
                });
            }
        };

        pc.ontrack = (event) => {
            console.log("[CALL] ontrack fired - remote tracks received", event.streams?.[0]?.getTracks?.());
            if (event.streams && event.streams[0]) {
                const stream = event.streams[0];
                remoteStreamRef.current = stream;
                setRemoteStream(stream);
                if (onRemoteStream) onRemoteStream(stream);
            }
        };

        pc.onconnectionstatechange = () => {
            if (!pc) return;
            const state = pc.connectionState;
            console.log("[CALL] connectionState changed to:", state);

            if (state === "failed" || state === "disconnected") {
                handleErrorRef.current?.(CALL_ERROR_CODE.CONNECTION_FAILED, "Kết nối bị gián đoạn");
            }
            if (state === "connected") {
                statusRef.current = CALL_STATUS.CONNECTED;
                isInCallRef.current = true;
                setStatus(CALL_STATUS.CONNECTED);
                console.log("[CALL] WebRTC connection fully established!");

                // Fallback: if ontrack hasn't fired yet, try to get remote stream from receivers
                setTimeout(() => {
                    if (!remoteStreamRef.current && pc) {
                        const receivers = pc.getReceivers();
                        const videoReceiver = receivers.find(r => r.track?.kind === 'video');
                        const audioReceiver = receivers.find(r => r.track?.kind === 'audio');

                        if (videoReceiver || audioReceiver) {
                            // Create a stream from the receiver tracks
                            const fallbackStream = new MediaStream();
                            receivers.forEach(r => {
                                if (r.track) fallbackStream.addTrack(r.track);
                            });
                            if (fallbackStream.getTracks().length > 0) {
                                console.log("[CALL] Using fallback remote stream from receivers");
                                remoteStreamRef.current = fallbackStream;
                                setRemoteStream(fallbackStream);
                            }
                        }
                    }
                }, 1500);
            }
        };

        pc.oniceconnectionstatechange = () => {
            if (pc?.iceConnectionState === "failed") {
                handleErrorRef.current?.(CALL_ERROR_CODE.CONNECTION_FAILED, "Không thể kết nối ICE");
            }
        };

        pcRef.current = pc;
        return pc;
    }, [cleanupPeerConnection, getCurrentCallMode, getOrCreateSocket, iceServers]);

    useEffect(() => { callIdRef.current = callId; }, [callId]);
    useEffect(() => { conversationIdRef.current = conversationId; }, [conversationId]);
    useEffect(() => { callTypeRef.current = callType; }, [callType]);
    useEffect(() => { remoteUserRef.current = remoteUser; }, [remoteUser]);
    useEffect(() => { isCallerRef.current = isCaller; }, [isCaller]);

    // ==================== MEDIA ====================
    const acquireLocalMedia = useCallback(async(type) => {
        // Nếu đã có stream rồi thì tái sử dụng
        if (localStreamRef.current) {
            const hasVideo = localStreamRef.current.getVideoTracks().length > 0;
            if (type === CALL_TYPE.VIDEO && hasVideo) return localStreamRef.current;
            if (type === CALL_TYPE.VOICE && !hasVideo) return localStreamRef.current;
        }

        const constraints = {
            audio: AUDIO_CONSTRAINTS,
            video: type === CALL_TYPE.VIDEO ? VIDEO_CONSTRAINTS : false,
        };

        setIsRequestingMedia(true);

        try {
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            applyTrackQualityHints(stream);
            if (type === CALL_TYPE.VIDEO) {
                await applyVideoQualityConstraints(stream);
            }
            localStreamRef.current = stream;
            setLocalStream(stream);
            return stream;
        } catch (err) {
            const code = err.name === "NotAllowedError" || err.name === "PermissionDeniedError" ?
                CALL_ERROR_CODE.PERMISSION_DENIED :
                CALL_ERROR_CODE.MEDIA_FAILED;

            const message = type === CALL_TYPE.VIDEO ?
                "Vui lòng cấp quyền truy cập microphone và camera để thực hiện cuộc gọi video" :
                "Vui lòng cấp quyền truy cập microphone để thực hiện cuộc gọi thoại";

            // eslint-disable-next-line no-throw-literal
            throw { code, message };
        } finally {
            setIsRequestingMedia(false);
        }
    }, []);

    const addLocalTracksToPC = useCallback((pc, stream) => {
        if (!pc || !stream) return;
        stream.getTracks().forEach((track) => {
            try {
                const sender = pc.addTrack(track, stream);
                tuneSenderParameters(sender);
            } catch (e) {
                console.warn("Không thêm được track:", e);
            }
        });
    }, []);

    const emitCallEnd = useCallback((socket, reason = CALL_REASON.USER_ENDED) => {
        if (!socket || !conversationIdRef.current) return;

        if (getCurrentCallMode() === "legacy") {
            socket.emit(LEGACY_CALL_EVENTS.END, {
                boxId: conversationIdRef.current,
                targetUserId: remoteUserRef.current?.id ? Number(remoteUserRef.current.id) : undefined,
                reason,
            });
            return;
        }

        if (!callIdRef.current) return;
        socket.emit(CALL_CLIENT_EVENTS.END, {
            callId: callIdRef.current,
            conversationId: conversationIdRef.current,
            reason,
        });
    }, [getCurrentCallMode]);

    const emitCallReject = useCallback((socket, reason = CALL_REASON.DECLINED) => {
        if (!socket || !conversationIdRef.current) return;

        if (getCurrentCallMode() === "legacy") {
            socket.emit(LEGACY_CALL_EVENTS.REJECT, {
                boxId: conversationIdRef.current,
                targetUserId: remoteUserRef.current?.id ? Number(remoteUserRef.current.id) : undefined,
                reason,
            });
            return;
        }

        if (!callIdRef.current) return;
        socket.emit(CALL_CLIENT_EVENTS.REJECT, {
            callId: callIdRef.current,
            conversationId: conversationIdRef.current,
            reason,
        });
    }, [getCurrentCallMode]);

    // ==================== ERROR HANDLER ====================
    const handleError = useCallback((code, message, extra = {}) => {
        const err = { code, message, ...extra };
        setError(err);
        statusRef.current = CALL_STATUS.ERROR;
        isInCallRef.current = true;
        setStatus(CALL_STATUS.ERROR);

        const socket = getOrCreateSocket();
        if (socket && callIdRef.current) {
            emitCallEnd(socket, CALL_REASON.ERROR);
        }

        // Tự động reset sau 2.5s
        setTimeout(() => {
            resetState(true);
        }, 2500);
    }, [emitCallEnd, getOrCreateSocket, resetState]);

    useEffect(() => {
        handleErrorRef.current = handleError;
    }, [handleError]);

    // ==================== DURATION ====================
    const startDurationTimer = useCallback(() => {
        if (durationTimerRef.current) return;
        durationTimerRef.current = setInterval(() => {
            setDuration((d) => d + 1);
        }, 1000);
    }, []);

    // ==================== SEND OFFER (CHỈ CALLER SAU KHI ACCEPTED) ====================
    const sendOffer = useCallback(async() => {
        const pc = pcRef.current;
        const socket = getOrCreateSocket();
        if (!pc || !socket || !callIdRef.current || !conversationIdRef.current) return;

        try {
            const type = callTypeRef.current || callType || CALL_TYPE.VOICE;
            const offer = await pc.createOffer({
                offerToReceiveAudio: true,
                offerToReceiveVideo: type === CALL_TYPE.VIDEO,
            });
            await pc.setLocalDescription(offer);

            if (getCurrentCallMode() === "legacy") {
                socket.emit(LEGACY_CALL_EVENTS.OFFER, {
                    boxId: conversationIdRef.current,
                    offer,
                    targetUserId: remoteUserRef.current?.id ? Number(remoteUserRef.current.id) : undefined,
                });
                return;
            }

            socket.emit(CALL_CLIENT_EVENTS.OFFER, {
                callId: callIdRef.current,
                conversationId: conversationIdRef.current,
                offer,
            });
        } catch (e) {
            handleError(CALL_ERROR_CODE.CONNECTION_FAILED, "Không tạo được offer WebRTC");
        }
    }, [callType, getCurrentCallMode, getOrCreateSocket, handleError]);

    // ==================== SEND ANSWER ====================
    const sendAnswer = useCallback(async() => {
        const pc = pcRef.current;
        const socket = getOrCreateSocket();
        if (!pc || !socket || !callIdRef.current || !conversationIdRef.current) return;

        try {
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            if (getCurrentCallMode() === "legacy") {
                socket.emit(LEGACY_CALL_EVENTS.ANSWER, {
                    boxId: conversationIdRef.current,
                    answer,
                    targetUserId: remoteUserRef.current?.id ? Number(remoteUserRef.current.id) : undefined,
                });
                return;
            }

            socket.emit(CALL_CLIENT_EVENTS.ANSWER, {
                callId: callIdRef.current,
                conversationId: conversationIdRef.current,
                answer,
            });
        } catch (e) {
            handleError(CALL_ERROR_CODE.CONNECTION_FAILED, "Không tạo được answer WebRTC");
        }
    }, [getCurrentCallMode, getOrCreateSocket, handleError]);

    // ==================== APPLY REMOTE DESCRIPTION + DRAIN CANDIDATES ====================
    const applyRemoteDescriptionAndDrain = useCallback(async(desc) => {
        const pc = pcRef.current;
        if (!pc) return;

        try {
            await pc.setRemoteDescription(new RTCSessionDescription(desc));

            while (pendingCandidatesRef.current.length > 0) {
                const candidate = pendingCandidatesRef.current.shift();
                try {
                    await pc.addIceCandidate(new RTCIceCandidate(candidate));
                } catch {}
            }
        } catch (e) {
            console.error("Lỗi setRemoteDescription:", e);
        }
    }, []);

    // ==================== SOCKET EVENT HANDLERS ====================
    const setupSocketListeners = useCallback((socket) => {
        if (!socket || attachedCallSocketsRef.current.has(socket)) return;
        attachedCallSocketsRef.current.add(socket);

        // Listeners attached once. socket.io keeps handlers across reconnects.

        // === INCOMING CALL (cho callee) ===
        socket.on(CALL_SERVER_EVENTS.INCOMING, async(payload) => {
            console.log("[CALL] Received call:incoming", payload);

            const { callId: incomingCallId, conversationId: convId, callType: type, from } = payload || {};
            if (!incomingCallId || !convId || !from) {
                console.warn("[CALL] Invalid incoming call payload", payload);
                return;
            }
            if (!rememberHandledEvent("standard-incoming", payload)) return;

            // Nếu đang có cuộc gọi khác → busy
            if (isInCallRef.current) {
                console.log("[CALL] User busy, auto-rejecting incoming call", incomingCallId);
                socket.emit(CALL_CLIENT_EVENTS.REJECT, {
                    callId: incomingCallId,
                    conversationId: convId,
                    reason: CALL_REASON.BUSY,
                });
                return;
            }

            const currentUser = currentUserRef.current;
            if (currentUser && Number(from.id) === Number(currentUser.id)) return;

            console.log("[CALL] Showing incoming call modal for", from);

            setCallSession({
                nextCallId: incomingCallId,
                nextConversationId: convId,
                nextCallType: type || CALL_TYPE.VOICE,
                nextRemoteUser: from,
                nextIsCaller: false,
                nextStatus: CALL_STATUS.INCOMING,
                signalingMode: "standard",
            });
            joinCallRoom(convId, socket);

            if (!ringtoneRef.current) {
                ringtoneRef.current = createRingtone();
            }
            ringtoneRef.current.start();

            if (ringTimeoutRef.current) clearTimeout(ringTimeoutRef.current);
            ringTimeoutRef.current = setTimeout(() => {
                if (callIdRef.current === incomingCallId) {
                    rejectCallRef.current?.(CALL_REASON.NO_ANSWER);
                }
            }, RING_TIMEOUT_MS);
        });

        // Bridge từ chat socket: Khi user click vào hộp thoại (chat:join) → nhận được call:incoming qua box room
        // Chat socket dispatch event này → chúng ta xử lý như incoming thật để hiện modal
        const handleBridgedIncoming = (e) => {
            if (!e.detail) return;
            console.log("[CALL] Bridged incoming call from chat socket (user đã mở hộp thoại)", e.detail);

            // Xử lý giống hệt incoming thật
            const payload = e.detail;
            const { callId: incomingCallId, conversationId: convId, callType: type, from } = payload || {};
            if (!incomingCallId || !convId || !from) return;
            if (!rememberHandledEvent("standard-incoming", payload)) return;

            if (isInCallRef.current) {
                // Gửi reject nếu đang bận (dùng socket chính nếu có)
                const s = getOrCreateSocket();
                if (s) s.emit(CALL_CLIENT_EVENTS.REJECT, { callId: incomingCallId, conversationId: convId, reason: CALL_REASON.BUSY });
                return;
            }

            const currentUser = currentUserRef.current;
            if (currentUser && Number(from.id) === Number(currentUser.id)) return;

            setCallSession({
                nextCallId: incomingCallId,
                nextConversationId: convId,
                nextCallType: type || CALL_TYPE.VOICE,
                nextRemoteUser: from,
                nextIsCaller: false,
                nextStatus: CALL_STATUS.INCOMING,
                signalingMode: "standard",
            });
            joinCallRoom(convId);

            if (!ringtoneRef.current) ringtoneRef.current = createRingtone();
            ringtoneRef.current.start();

            if (ringTimeoutRef.current) clearTimeout(ringTimeoutRef.current);
            ringTimeoutRef.current = setTimeout(() => {
                if (callIdRef.current === incomingCallId) rejectCallRef.current?.(CALL_REASON.NO_ANSWER);
            }, RING_TIMEOUT_MS);
        };

        window.addEventListener("call:incoming:bridge", handleBridgedIncoming);

        // === CALL ACCEPTED (cho cả 2 bên) ===
        socket.on(CALL_SERVER_EVENTS.ACCEPTED, async(payload) => {
            const { callId: acceptedCallId, by } = payload || {};
            if (!acceptedCallId || acceptedCallId !== callIdRef.current) return;

            stopRingtone();
            clearTimers();

            setRemoteUser((prev) => prev || by);
            statusRef.current = CALL_STATUS.CONNECTING;
            isInCallRef.current = true;
            setStatus(CALL_STATUS.CONNECTING);

            const type = callTypeRef.current || callType || CALL_TYPE.VOICE;
            const isMeCaller = isCallerRef.current;

            try {
                const stream = await acquireLocalMedia(type);
                const pc = createPeerConnection();

                addLocalTracksToPC(pc, stream);

                if (isMeCaller) {
                    // CHỈ CALLER mới gửi offer sau khi accepted
                    await sendOffer();
                }
                // Callee sẽ chờ offer rồi mới tạo answer
            } catch (err) {
                handleError(err.code || CALL_ERROR_CODE.MEDIA_FAILED, err.message || "Lỗi media");
            }
        });

        // === CALL REJECTED ===
        socket.on(CALL_SERVER_EVENTS.REJECTED, (payload) => {
            const { callId: rejectedCallId, reason } = payload || {};
            if (rejectedCallId !== callIdRef.current) return;

            stopRingtone();
            clearTimers();

            const reasonText = reason === CALL_REASON.BUSY ? "Người dùng đang bận" :
                reason === CALL_REASON.DECLINED ? "Cuộc gọi bị từ chối" :
                "Không trả lời";

            setError({ code: CALL_ERROR_CODE.PEER_UNAVAILABLE, message: reasonText });
            statusRef.current = CALL_STATUS.ENDED;
            isInCallRef.current = false;
            setStatus(CALL_STATUS.ENDED);

            setTimeout(() => resetState(true), 1800);
        });

        // === OFFER (thường callee nhận) ===
        socket.on(CALL_SERVER_EVENTS.OFFER, async(payload) => {
            const { callId: offerCallId, offer, from } = payload || {};
            if (!offerCallId || offerCallId !== callIdRef.current) return;

            setRemoteUser((prev) => prev || from);

            pcRef.current || createPeerConnection();
            try {
                await applyRemoteDescriptionAndDrain(offer);
                await sendAnswer();
            } catch (e) {
                handleError(CALL_ERROR_CODE.CONNECTION_FAILED, "Không xử lý được offer");
            }
        });

        // === ANSWER (thường caller nhận) ===
        socket.on(CALL_SERVER_EVENTS.ANSWER, async(payload) => {
            const { callId: answerCallId, answer } = payload || {};
            if (!answerCallId || answerCallId !== callIdRef.current) return;

            const pc = pcRef.current;
            if (!pc) return;

            try {
                await applyRemoteDescriptionAndDrain(answer);
            } catch (e) {
                handleError(CALL_ERROR_CODE.CONNECTION_FAILED, "Không xử lý được answer");
            }
        });

        // === ICE CANDIDATE ===
        socket.on(CALL_SERVER_EVENTS.ICE_CANDIDATE, async(payload) => {
            const { callId: iceCallId, candidate } = payload || {};
            if (!iceCallId || iceCallId !== callIdRef.current) return;

            const pc = pcRef.current;
            if (!pc) return;

            try {
                if (candidate && pc.remoteDescription) {
                    await pc.addIceCandidate(new RTCIceCandidate(candidate));
                } else if (candidate) {
                    // Chưa có remoteDesc → lưu lại
                    pendingCandidatesRef.current.push(candidate);
                }
            } catch (e) {
                // Bỏ qua lỗi ICE không nghiêm trọng
            }
        });

        // === ENDED (bên kia kết thúc) ===
        socket.on(CALL_SERVER_EVENTS.ENDED, (payload) => {
            const { callId: endedCallId, reason } = payload || {};
            if (endedCallId !== callIdRef.current) return;

            stopRingtone();
            clearTimers();

            statusRef.current = CALL_STATUS.ENDED;
            isInCallRef.current = false;
            setStatus(CALL_STATUS.ENDED);

            const msg = reason === CALL_REASON.PEER_DISCONNECTED ?
                "Đối phương mất kết nối" :
                "Cuộc gọi đã kết thúc";

            setError({ code: CALL_ERROR_CODE.UNKNOWN, message: msg });

            setTimeout(() => resetState(true), 1400);
        });

        // === ERROR từ server ===
        socket.on(CALL_SERVER_EVENTS.ERROR, (payload) => {
            const { code, message } = payload || {};
            handleError(code || CALL_ERROR_CODE.UNKNOWN, message || "Lỗi từ server");
        });

        // ==================== LEGACY PROTOCOL SUPPORT (chat:call:*) - Đây là flow chính của backend bạn ====================
        // Backend push "chat:call:active" khi bạn join box hoặc khi call bắt đầu
        const handleLegacyCallActiveOrStart = (payload = {}) => {
            console.log("[CALL] Legacy call active/start received", payload);
            const { userId, boxId, callType, offer, candidates = [] } = payload || {};
            if (!boxId) return;
            if (!rememberHandledEvent("legacy-incoming", payload)) return;

            // Bỏ qua nếu chính mình là người gọi
            if (userId && Number(userId) === Number(currentUserRef.current?.id)) return;

            const isSameLegacyCall =
                getCurrentCallMode() === "legacy" &&
                String(boxId) === String(conversationIdRef.current);
            if (isSameLegacyCall) {
                if (offer) pendingLegacyOfferRef.current = { boxId, offer };
                if (Array.isArray(candidates) && candidates.length > 0) {
                    pendingCandidatesRef.current.push(...candidates.filter(Boolean));
                }
                return;
            }

            // Nếu đang trong cuộc gọi khác thì reject
            if (isInCallRef.current) {
                socket.emit(LEGACY_CALL_EVENTS.REJECT, { boxId });
                return;
            }

            if (offer) {
                pendingLegacyOfferRef.current = { boxId, offer };
            }
            if (Array.isArray(candidates) && candidates.length > 0) {
                pendingCandidatesRef.current.push(...candidates.filter(Boolean));
            }

            setCallSession({
                nextCallId: `legacy-${boxId}-${Date.now()}`,
                nextConversationId: boxId,
                nextCallType: callType || CALL_TYPE.VOICE,
                nextRemoteUser: { id: Number(userId), name: "Người dùng" },
                nextIsCaller: false,
                nextStatus: CALL_STATUS.INCOMING,
                signalingMode: "legacy",
            });
            joinCallRoom(boxId);
            joinCallRoom(boxId, socket);

            if (!ringtoneRef.current) {
                ringtoneRef.current = createRingtone();
            }
            ringtoneRef.current.start();
        };

        // Lắng nghe cả "active" (khi join box) và "start" (khi call mới bắt đầu)
        socket.on(LEGACY_CALL_EVENTS.ACTIVE, handleLegacyCallActiveOrStart);
        socket.on(LEGACY_CALL_EVENTS.STARTED, handleLegacyCallActiveOrStart);

        // Note: Global legacy incoming listeners are now set up in a dedicated useEffect above
        // for reliability (even before setupSocketListeners runs).

        socket.on(LEGACY_CALL_EVENTS.OFFER, async(payload = {}) => {
            const { boxId, offer, userId: fromUserId } = payload;
            if (fromUserId && Number(fromUserId) === Number(currentUserRef.current?.id)) return;
            if (!rememberHandledEvent("legacy-offer", payload)) return;

            console.log("[CALL][LEGACY] Received OFFER", payload);

            // Nếu vẫn đang ở INCOMING (chưa Accept) → buffer offer
            if (statusRef.current === CALL_STATUS.INCOMING) {
                console.log("[CALL][LEGACY] Buffering offer until Accept");
                pendingLegacyOfferRef.current = { boxId, offer };
                return;
            }

            let pc = pcRef.current;
            if (!pc && !localStreamRef.current) {
                pendingLegacyOfferRef.current = { boxId, offer };
                return;
            }

            if (!pc && localStreamRef.current) {
                console.log("[CALL][LEGACY] Creating PC on offer receive (callee)");
                pc = createPeerConnection();
                addLocalTracksToPC(pc, localStreamRef.current);
            }

            if (!pc) {
                console.warn("[CALL][LEGACY] No PC when processing offer");
                return;
            }

            try {
                await pc.setRemoteDescription(new RTCSessionDescription(offer));

                // Drain buffered ICE
                while (pendingCandidatesRef.current.length > 0) {
                    const cand = pendingCandidatesRef.current.shift();
                    try { await pc.addIceCandidate(new RTCIceCandidate(cand)); } catch {}
                }

                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);

                console.log("[CALL][LEGACY] Sending ANSWER");
                socket.emit(LEGACY_CALL_EVENTS.ANSWER, {
                    boxId,
                    answer,
                    targetUserId: remoteUserRef.current?.id ? Number(remoteUserRef.current.id) : undefined,
                });

                // On the answerer side (usually callee), once we send the answer we can consider the signaling phase done
                statusRef.current = CALL_STATUS.CONNECTED;
                isInCallRef.current = true;
                setStatus(CALL_STATUS.CONNECTED);
            } catch (e) {
                console.error("[CALL][LEGACY] Error handling offer", e);
            }
        });

        socket.on(LEGACY_CALL_EVENTS.ANSWER, async(payload = {}) => {
            const { answer, userId: fromUserId } = payload;
            const pc = pcRef.current;
            if (!pc || (fromUserId && Number(fromUserId) === Number(currentUserRef.current?.id))) return;
            if (!rememberHandledEvent("legacy-answer", payload)) return;

            console.log("[CALL][LEGACY] Received ANSWER - setting remote description");

            try {
                await pc.setRemoteDescription(new RTCSessionDescription(answer));

                // Aggressively mark as connected once we have the answer (media should start flowing soon)
                statusRef.current = CALL_STATUS.CONNECTED;
                isInCallRef.current = true;
                setStatus(CALL_STATUS.CONNECTED);

                // Drain any remaining candidates now that we have remote desc
                while (pendingCandidatesRef.current.length > 0) {
                    const cand = pendingCandidatesRef.current.shift();
                    try {
                        await pc.addIceCandidate(new RTCIceCandidate(cand));
                    } catch (e) {}
                }

                console.log("[CALL][LEGACY] ANSWER processed successfully. Waiting for ontrack / connectionState");
            } catch (e) {
                console.error("[CALL][LEGACY] Error setting remote answer", e);
            }
        });

        socket.on(LEGACY_CALL_EVENTS.ICE_CANDIDATE, async(payload = {}) => {
            const { candidate, userId: fromUserId, boxId } = payload;
            if (!candidate) return;
            if (fromUserId && Number(fromUserId) === Number(currentUserRef.current?.id)) return;
            if (!rememberHandledEvent("legacy-ice", payload)) return;

            // Only process if for current call
            if (boxId && String(boxId) !== String(conversationIdRef.current)) return;

            const pc = pcRef.current;
            if (!pc || !pc.remoteDescription) {
                pendingCandidatesRef.current.push(candidate);
                return;
            }

            try {
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (e) {}
        });

        socket.on(LEGACY_CALL_EVENTS.REJECTED, (payload = {}) => {
            if (!rememberHandledEvent("legacy-reject", payload)) return;
            stopRingtone();
            clearTimers();
            statusRef.current = CALL_STATUS.ENDED;
            isInCallRef.current = false;
            setStatus(CALL_STATUS.ENDED);
            setError({ code: CALL_ERROR_CODE.PEER_UNAVAILABLE, message: "Cuộc gọi bị từ chối" });
            setTimeout(() => resetState(true), 1500);
        });

        socket.on(LEGACY_CALL_EVENTS.ENDED, (payload = {}) => {
            if (!rememberHandledEvent("legacy-end", payload)) return;
            stopRingtone();
            clearTimers();
            statusRef.current = CALL_STATUS.ENDED;
            isInCallRef.current = false;
            setStatus(CALL_STATUS.ENDED);
            setTimeout(() => resetState(true), 800);
        });
    }, [
        acquireLocalMedia,
        addLocalTracksToPC,
        applyRemoteDescriptionAndDrain,
        callType,
        createPeerConnection,
        getCurrentCallMode,
        getOrCreateSocket,
        handleError,
        joinCallRoom,
        rememberHandledEvent,
        resetState,
        sendAnswer,
        sendOffer,
        setCallSession,
        stopRingtone,
        clearTimers,
    ]);

    // ==================== INITIATE CALL (CALLER) ====================
    const initiateCall = useCallback(async(convId, type = CALL_TYPE.VOICE, remoteUserInfo = null, targetUserId = null) => {
        if (!isWebRTCSupported()) {
            handleError(CALL_ERROR_CODE.UNKNOWN, "Thiết bị không hỗ trợ gọi video/voice");
            return false;
        }
        if (isInCall) {
            handleError(CALL_ERROR_CODE.ALREADY_IN_CALL, "Bạn đang trong cuộc gọi khác");
            return false;
        }

        const socket = getOrCreateSocket();
        if (!socket) {
            handleError(CALL_ERROR_CODE.UNKNOWN, "Không kết nối được signaling server");
            return false;
        }

        // Backend hiện tại của bạn dùng chat:call:* nên giữ legacy làm mặc định.
        const useLegacySignaling = true;
        const newCallId = useLegacySignaling ?
            `legacy-${convId}-${Date.now()}` :
            generateCallId();

        setCallSession({
            nextCallId: newCallId,
            nextConversationId: convId,
            nextCallType: type,
            nextRemoteUser: remoteUserInfo,
            nextIsCaller: true,
            nextStatus: CALL_STATUS.INITIATING,
            signalingMode: useLegacySignaling ? "legacy" : "standard",
        });

        // === QUAN TRỌNG: Xin quyền microphone/camera NGAY khi bấm gọi ===
        try {
            await acquireLocalMedia(type);
        } catch (e) {
            // acquireLocalMedia đã gọi handleError + set error
            return false;
        }

        if (useLegacySignaling) {
            const legacyTargetUserId = targetUserId ? Number(targetUserId) : undefined;
            joinCallRoom(convId, socket);
            socket.emit(LEGACY_CALL_EVENTS.START, {
                boxId: convId,
                callType: type,
                targetUserId: legacyTargetUserId,
            });

            // Với legacy, caller tạo PC + gửi offer ngay sau khi start
            statusRef.current = CALL_STATUS.CONNECTING;
            isInCallRef.current = true;
            setStatus(CALL_STATUS.CONNECTING);
            try {
                const pc = createPeerConnection();
                addLocalTracksToPC(pc, localStreamRef.current);

                const offer = await pc.createOffer({
                    offerToReceiveAudio: true,
                    offerToReceiveVideo: type === CALL_TYPE.VIDEO,
                });
                await pc.setLocalDescription(offer);

                console.log("[CALL][LEGACY] Caller sending OFFER");
                socket.emit(LEGACY_CALL_EVENTS.OFFER, {
                    boxId: convId,
                    offer,
                    targetUserId: legacyTargetUserId,
                });
            } catch (e) {
                console.error("[CALL][LEGACY] Caller offer creation failed", e);
                handleError(CALL_ERROR_CODE.CONNECTION_FAILED, "Không tạo được offer WebRTC");
            }
        } else {
            const initiatePayload = {
                callId: newCallId,
                conversationId: convId,
                callType: type,
            };
            if (targetUserId) {
                initiatePayload.targetUserId = Number(targetUserId);
            }
            socket.emit(CALL_CLIENT_EVENTS.INITIATE, initiatePayload);
        }

        // Timeout nếu không ai trả lời
        if (initiateTimeoutRef.current) clearTimeout(initiateTimeoutRef.current);
        initiateTimeoutRef.current = setTimeout(() => {
            if (callIdRef.current === newCallId && statusRef.current !== CALL_STATUS.CONNECTED) {
                handleError(CALL_ERROR_CODE.PEER_UNAVAILABLE, "Không có phản hồi từ người nhận");
                const s = getOrCreateSocket();
                if (s) {
                    emitCallEnd(s, CALL_REASON.TIMEOUT);
                }
            }
        }, INITIATE_TIMEOUT_MS);

        setupSocketListeners(socket);
        return true;
    }, [
        acquireLocalMedia,
        addLocalTracksToPC,
        createPeerConnection,
        emitCallEnd,
        getOrCreateSocket,
        handleError,
        isInCall,
        joinCallRoom,
        setCallSession,
        setupSocketListeners,
    ]);

    // ==================== ACCEPT CALL (CALLEE) ====================
    const acceptCall = useCallback(async() => {
        if (status !== CALL_STATUS.INCOMING) return false;

        const socket = getOrCreateSocket();
        if (!socket) return false;

        stopRingtone();
        if (ringTimeoutRef.current) {
            clearTimeout(ringTimeoutRef.current);
            ringTimeoutRef.current = null;
        }

        statusRef.current = CALL_STATUS.CONNECTING;
        isInCallRef.current = true;
        setStatus(CALL_STATUS.CONNECTING);
        joinCallRoom(conversationIdRef.current, socket);

        if (getCurrentCallMode() !== "legacy") {
            socket.emit(CALL_CLIENT_EVENTS.ACCEPT, {
                callId: callIdRef.current,
                conversationId: conversationIdRef.current,
            });
            setupSocketListeners(socket);
            return true;
        }

        // Xin quyền media
        try {
            const stream = await acquireLocalMedia(callTypeRef.current || callType || CALL_TYPE.VOICE);
            localStreamRef.current = stream;
            setLocalStream(stream);

            // Tạo PeerConnection cho callee
            const pc = createPeerConnection();
            addLocalTracksToPC(pc, stream);

            // Xử lý offer đã buffer (nếu caller gửi offer trước khi Accept)
            if (pendingLegacyOfferRef.current) {
                const { offer, boxId: offerBoxId } = pendingLegacyOfferRef.current;
                console.log("[CALL][LEGACY] Processing buffered offer after Accept");

                try {
                    await pc.setRemoteDescription(new RTCSessionDescription(offer));

                    // Drain any early ICE candidates
                    while (pendingCandidatesRef.current.length > 0) {
                        const cand = pendingCandidatesRef.current.shift();
                        try { await pc.addIceCandidate(new RTCIceCandidate(cand)); } catch {}
                    }

                    const answer = await pc.createAnswer();
                    await pc.setLocalDescription(answer);

                    socket.emit(LEGACY_CALL_EVENTS.ANSWER, {
                        boxId: offerBoxId,
                        answer,
                        targetUserId: remoteUserRef.current?.id ? Number(remoteUserRef.current.id) : undefined,
                    });

                    // Callee side - we have sent our answer
                    statusRef.current = CALL_STATUS.CONNECTED;
                    isInCallRef.current = true;
                    setStatus(CALL_STATUS.CONNECTED);
                } catch (err) {
                    console.error("[CALL][LEGACY] Buffered offer error", err);
                }

                pendingLegacyOfferRef.current = null;
            }

        } catch (e) {
            statusRef.current = CALL_STATUS.INCOMING;
            isInCallRef.current = true;
            setStatus(CALL_STATUS.INCOMING);
            return false;
        }

        setupSocketListeners(socket);
        return true;
    }, [
        acquireLocalMedia,
        addLocalTracksToPC,
        callType,
        createPeerConnection,
        getCurrentCallMode,
        getOrCreateSocket,
        joinCallRoom,
        setupSocketListeners,
        status,
        stopRingtone,
    ]);

    // ==================== REJECT CALL ====================
    const rejectCall = useCallback((reason = CALL_REASON.DECLINED) => {
        const socket = getOrCreateSocket();
        if (conversationIdRef.current && socket) {
            emitCallReject(socket, reason);
        }

        stopRingtone();
        clearTimers();
        resetState(true);
    }, [clearTimers, emitCallReject, getOrCreateSocket, resetState, stopRingtone]);

    useEffect(() => {
        rejectCallRef.current = rejectCall;
    }, [rejectCall]);

    // ==================== END CALL ====================
    const endCall = useCallback((reason = CALL_REASON.USER_ENDED) => {
        const socket = getOrCreateSocket();
        if (conversationIdRef.current && socket) {
            emitCallEnd(socket, reason);
        }

        stopRingtone();
        clearTimers();

        statusRef.current = CALL_STATUS.ENDED;
        isInCallRef.current = false;
        setStatus(CALL_STATUS.ENDED);
        setTimeout(() => resetState(true), 600);
    }, [clearTimers, emitCallEnd, getOrCreateSocket, resetState, stopRingtone]);

    // ==================== CONTROLS ====================
    const toggleMute = useCallback(() => {
        const stream = localStreamRef.current;
        if (!stream) return;

        const audioTrack = stream.getAudioTracks()[0];
        if (!audioTrack) return;

        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
    }, []);

    const toggleVideo = useCallback(() => {
        const stream = localStreamRef.current;
        if (!stream) return;

        const videoTrack = stream.getVideoTracks()[0];
        if (!videoTrack) return;

        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
    }, []);

    const switchCamera = useCallback(async() => {
        if (callType !== CALL_TYPE.VIDEO) return;

        const currentStream = localStreamRef.current;
        if (!currentStream) return;

        const videoTrack = currentStream.getVideoTracks()[0];
        if (!videoTrack) return;

        const currentSettings = videoTrack.getSettings();
        const newFacingMode = currentSettings.facingMode === "user" ? "environment" : "user";

        try {
            const newStream = await navigator.mediaDevices.getUserMedia({
                audio: false,
                video: SWITCH_CAMERA_VIDEO_CONSTRAINTS(newFacingMode),
            });

            const newVideoTrack = newStream.getVideoTracks()[0];
            try { newVideoTrack.contentHint = "motion"; } catch {}
            if (newVideoTrack?.applyConstraints) {
                try {
                    await newVideoTrack.applyConstraints(SWITCH_CAMERA_VIDEO_CONSTRAINTS(newFacingMode));
                } catch (error) {
                    console.warn("[CALL] Không ép được chất lượng camera mới:", error);
                }
            }

            // Thay track trong PC
            const pc = pcRef.current;
            if (pc) {
                const sender = pc.getSenders().find((s) => s.track?.kind === "video");
                if (sender) {
                    await sender.replaceTrack(newVideoTrack);
                    tuneSenderParameters(sender);
                }
            }

            // Cập nhật local stream
            currentStream.removeTrack(videoTrack);
            videoTrack.stop();
            currentStream.addTrack(newVideoTrack);

            setLocalStream(currentStream);
        } catch (e) {
            console.warn("Không chuyển được camera:", e);
        }
    }, [callType]);

    // ==================== LIFECYCLE ====================
    useEffect(() => {
        // Cập nhật user khi mount
        currentUserRef.current = getCurrentUser();

        return () => {
            // Cleanup triệt để khi unmount hook
            stopRingtone();
            clearTimers();
            cleanupMedia();
            cleanupPeerConnection();
            disconnectSignalingSocket();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Auto start duration timer khi connected
    useEffect(() => {
        if (status === CALL_STATUS.CONNECTED) {
            startDurationTimer();
        }
    }, [status, startDurationTimer]);

    // Giữ statusRef luôn cập nhật (tránh stale trong setTimeout)
    useEffect(() => {
        statusRef.current = status;
    }, [status]);

    // Đồng bộ isInCall vào ref (để handlers socket dùng giá trị mới nhất, tránh stale closure)
    useEffect(() => {
        isInCallRef.current = isInCall;
    }, [isInCall]);

    // ==================== ALWAYS LISTEN FOR INCOMING CALLS (CRITICAL FOR LEGACY) ====================
    // This ensures we receive calls even without clicking "accept" first.
    // Especially important for legacy protocol where server pushes "chat:call:active" / "chat:call:start"
    // to the box room after user did "chat:join".
    useEffect(() => {
        const user = getCurrentUser();
        const token = getToken();
        if (!user?.id || !token) return undefined;

        // Handler for legacy incoming calls (from direct socket or bridged from main chat socket)
        const handleAnyLegacyIncoming = (payload) => {
            console.log("[CALL] handleAnyLegacyIncoming triggered", payload);

            const { userId, boxId, callType, offer, candidates = [] } = payload || {};
            if (!boxId) return;
            if (!rememberHandledEvent("legacy-incoming", payload)) return;

            // Ignore self
            if (userId && Number(userId) === Number(user.id)) return;

            const isSameLegacyCall =
                getCurrentCallMode() === "legacy" &&
                String(boxId) === String(conversationIdRef.current);
            if (isSameLegacyCall) {
                if (offer) pendingLegacyOfferRef.current = { boxId, offer };
                if (Array.isArray(candidates) && candidates.length > 0) {
                    pendingCandidatesRef.current.push(...candidates.filter(Boolean));
                }
                return;
            }

            // If already in a call, auto reject
            if (isInCallRef.current) {
                const s = getOrCreateSocket();
                if (s) s.emit(LEGACY_CALL_EVENTS.REJECT, { boxId });
                return;
            }

            if (offer) {
                pendingLegacyOfferRef.current = { boxId, offer };
            }
            if (Array.isArray(candidates) && candidates.length > 0) {
                pendingCandidatesRef.current.push(...candidates.filter(Boolean));
            }

            const displayName = userId ? `Ai đó đang gọi đến bạn` : "Người gọi";
            setCallSession({
                nextCallId: `legacy-${boxId}-${Date.now()}`,
                nextConversationId: boxId,
                nextCallType: callType || CALL_TYPE.VOICE,
                nextRemoteUser: { id: Number(userId) || 0, name: displayName },
                nextIsCaller: false,
                nextStatus: CALL_STATUS.INCOMING,
                signalingMode: "legacy",
            });

            if (!ringtoneRef.current) {
                ringtoneRef.current = createRingtone();
            }
            ringtoneRef.current.start();
        };

        const handleLegacyOffer = async(payload = {}) => {
            const { boxId, offer, userId: fromUserId } = payload;
            if (!boxId || !offer) return;
            if (fromUserId && Number(fromUserId) === Number(user.id)) return;
            if (!rememberHandledEvent("legacy-offer", payload)) return;

            if (statusRef.current === CALL_STATUS.INCOMING) {
                pendingLegacyOfferRef.current = { boxId, offer };
                return;
            }

            let pc = pcRef.current;
            if (!pc && !localStreamRef.current) {
                pendingLegacyOfferRef.current = { boxId, offer };
                return;
            }

            if (!pc && localStreamRef.current) {
                pc = createPeerConnection();
                addLocalTracksToPC(pc, localStreamRef.current);
            }
            if (!pc) return;

            try {
                await pc.setRemoteDescription(new RTCSessionDescription(offer));
                while (pendingCandidatesRef.current.length > 0) {
                    const candidate = pendingCandidatesRef.current.shift();
                    try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); } catch {}
                }
                await sendAnswer();
                statusRef.current = CALL_STATUS.CONNECTED;
                isInCallRef.current = true;
                setStatus(CALL_STATUS.CONNECTED);
            } catch (e) {
                console.error("[CALL][LEGACY] Error handling bridged offer", e);
            }
        };

        const handleLegacyAnswer = async(payload = {}) => {
            const { answer, userId: fromUserId } = payload;
            const pc = pcRef.current;
            if (!pc || !answer) return;
            if (fromUserId && Number(fromUserId) === Number(user.id)) return;
            if (!rememberHandledEvent("legacy-answer", payload)) return;

            try {
                await pc.setRemoteDescription(new RTCSessionDescription(answer));
                while (pendingCandidatesRef.current.length > 0) {
                    const candidate = pendingCandidatesRef.current.shift();
                    try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); } catch {}
                }
                statusRef.current = CALL_STATUS.CONNECTED;
                isInCallRef.current = true;
                setStatus(CALL_STATUS.CONNECTED);
            } catch (e) {
                console.error("[CALL][LEGACY] Error handling bridged answer", e);
            }
        };

        const handleLegacyIce = async(payload = {}) => {
            const { candidate, userId: fromUserId, boxId } = payload;
            const pc = pcRef.current;
            if (!candidate) return;
            if (fromUserId && Number(fromUserId) === Number(user.id)) return;
            if (boxId && conversationIdRef.current && String(boxId) !== String(conversationIdRef.current)) return;
            if (!rememberHandledEvent("legacy-ice", payload)) return;

            if (!pc || !pc.remoteDescription) {
                pendingCandidatesRef.current.push(candidate);
                return;
            }

            try {
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
            } catch {}
        };

        const handleLegacyReject = (payload = {}) => {
            if (!rememberHandledEvent("legacy-reject", payload)) return;
            stopRingtone();
            clearTimers();
            statusRef.current = CALL_STATUS.ENDED;
            isInCallRef.current = false;
            setStatus(CALL_STATUS.ENDED);
            setError({ code: CALL_ERROR_CODE.PEER_UNAVAILABLE, message: "Cuộc gọi bị từ chối" });
            setTimeout(() => resetState(true), 1500);
        };

        const handleLegacyEnd = (payload = {}) => {
            if (!rememberHandledEvent("legacy-end", payload)) return;
            stopRingtone();
            clearTimers();
            statusRef.current = CALL_STATUS.ENDED;
            isInCallRef.current = false;
            setStatus(CALL_STATUS.ENDED);
            setTimeout(() => resetState(true), 800);
        };

        // Listen to bridged events from main chat socket (useChatSocket forwards these)
        const onLegacyActive = (e) => handleAnyLegacyIncoming(e.detail);
        const onLegacyStart = (e) => handleAnyLegacyIncoming(e.detail);
        const onLegacyOffer = (e) => handleLegacyOffer(e.detail);
        const onLegacyAnswer = (e) => handleLegacyAnswer(e.detail);
        const onLegacyIce = (e) => handleLegacyIce(e.detail);
        const onLegacyReject = (e) => handleLegacyReject(e.detail);
        const onLegacyEnd = (e) => handleLegacyEnd(e.detail);

        window.addEventListener("legacy-call:active", onLegacyActive);
        window.addEventListener("legacy-call:start", onLegacyStart);
        window.addEventListener("legacy-call:offer", onLegacyOffer);
        window.addEventListener("legacy-call:answer", onLegacyAnswer);
        window.addEventListener("legacy-call:ice-candidate", onLegacyIce);
        window.addEventListener("legacy-call:reject", onLegacyReject);
        window.addEventListener("legacy-call:end", onLegacyEnd);

        // Also try to attach directly to main chat socket if available
        const tryAttachToMainChatSocket = () => {
            const mainSocket = window.__chatSocket || externalSocket;
            if (mainSocket) {
                setupSocketListeners(mainSocket);
            }
        };

        // Try immediately and after short delay (chat socket may connect later)
        tryAttachToMainChatSocket();
        const t1 = setTimeout(tryAttachToMainChatSocket, 800);
        const t2 = setTimeout(tryAttachToMainChatSocket, 2500);

        // Also run the normal setup (for WebRTC signaling)
        const t3 = setTimeout(() => {
            const s = getOrCreateSocket();
            if (s) setupSocketListeners(s);
        }, 300);

        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
            clearTimeout(t3);
            window.removeEventListener("legacy-call:active", onLegacyActive);
            window.removeEventListener("legacy-call:start", onLegacyStart);
            window.removeEventListener("legacy-call:offer", onLegacyOffer);
            window.removeEventListener("legacy-call:answer", onLegacyAnswer);
            window.removeEventListener("legacy-call:ice-candidate", onLegacyIce);
            window.removeEventListener("legacy-call:reject", onLegacyReject);
            window.removeEventListener("legacy-call:end", onLegacyEnd);
        };
    }, [
        addLocalTracksToPC,
        clearTimers,
        createPeerConnection,
        externalSocket,
        getCurrentCallMode,
        getOrCreateSocket,
        joinCallRoom,
        rememberHandledEvent,
        resetState,
        sendAnswer,
        setCallSession,
        setupSocketListeners,
        stopRingtone,
    ]);

    // ==================== PUBLIC API ====================
    return {
        // State
        status,
        callType,
        callId,
        conversationId,
        remoteUser,
        isCaller,
        error,
        duration,
        isMuted,
        isVideoOff,
        localStream,
        remoteStream,
        isInCall,
        isRequestingMedia,
        isWebRTCSupported: isWebRTCSupported(),

        // Actions
        initiateCall,
        acceptCall,
        rejectCall,
        endCall,
        toggleMute,
        toggleVideo,
        switchCamera,

        // Helpers
        resetCallState: () => resetState(true),
    };
}