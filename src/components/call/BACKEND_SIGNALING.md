# Voice & Video Calling — Socket.IO Signaling (Backend Contract)

Tài liệu này mô tả **đầy đủ** các event Socket.IO mà backend phải xử lý để hỗ trợ gọi thoại + video 1:1.

Tất cả signaling đi qua Socket.IO (không REST). Mỗi cuộc gọi có `callId` duy nhất do **client tạo** (uuid).

---

## Shared Types (gửi/nhận nguyên vẹn)

```ts
export type CallType = 'voice' | 'video';

export interface CallUser {
  id: number;
  name: string;
  avatar?: string | null;
}

export interface CallPayloadBase {
  callId: string;
  conversationId: number;
}
```

> **Quan trọng**: Mọi event **bắt buộc** phải chứa cả `callId` + `conversationId`.

---

## Client → Server Events

| Event                | Payload                                                                 | Mô tả                                                                 |
|----------------------|-------------------------------------------------------------------------|-----------------------------------------------------------------------|
| `call:initiate`      | `{ callId, conversationId, callType: 'voice'\|'video' }`                | Người dùng bắt đầu cuộc gọi. Backend phải tìm người nhận trong `conversationId` và phát `call:incoming` cho họ. |
| `call:accept`        | `{ callId, conversationId }`                                            | Callee chấp nhận. Backend phát `call:accepted` cho cả 2 bên.          |
| `call:reject`        | `{ callId, conversationId, reason?: 'busy'\|'declined'\|'no-answer' }`  | Callee từ chối. Backend phát `call:rejected`.                         |
| `call:offer`         | `{ callId, conversationId, offer: RTCSessionDescriptionInit }`          | Caller gửi WebRTC offer (CHỈ sau khi nhận `call:accepted`).           |
| `call:answer`        | `{ callId, conversationId, answer: RTCSessionDescriptionInit }`         | Callee gửi WebRTC answer.                                             |
| `call:ice-candidate` | `{ callId, conversationId, candidate: RTCIceCandidateInit \| null }`    | Trao đổi ICE candidate.                                               |
| `call:end`           | `{ callId, conversationId, reason?: string }`                           | Một bên kết thúc cuộc gọi. Backend phát `call:ended` cho bên còn lại. |

---

## Server → Client Events

| Event               | Payload                                                                 | Mô tả                                                                 |
|---------------------|-------------------------------------------------------------------------|-----------------------------------------------------------------------|
| `call:incoming`     | `{ callId, conversationId, callType, from: CallUser, timestamp }`       | Thông báo cuộc gọi đến (hiển thị IncomingCallModal).                  |
| `call:accepted`     | `{ callId, conversationId, by: CallUser }`                              | Bên kia đã chấp nhận → cả 2 bên bắt đầu chuẩn bị WebRTC.              |
| `call:rejected`     | `{ callId, conversationId, by: CallUser, reason? }`                     | Cuộc gọi bị từ chối.                                                  |
| `call:offer`        | `{ callId, conversationId, offer, from: CallUser }`                     | Nhận WebRTC offer (thường là callee nhận).                            |
| `call:answer`       | `{ callId, conversationId, answer, from: CallUser }`                    | Nhận WebRTC answer.                                                   |
| `call:ice-candidate`| `{ callId, conversationId, candidate, from: CallUser }`                 | Nhận ICE candidate.                                                   |
| `call:ended`        | `{ callId, conversationId, endedBy: CallUser \| 'system', reason? }`    | Cuộc gọi kết thúc (bên kia hoặc system).                              |
| `call:error`        | `{ callId?, conversationId?, code: string, message: string }`           | Lỗi (busy, permission, connection failed, already_in_call...).        |

---

## Luồng chuẩn (WebRTC Flow)

```
Caller                                      Backend                              Callee
  │                                            │                                    │
  │── call:initiate ──────────────────────────>│                                    │
  │                                            │── call:incoming ──────────────────>│
  │                                            │                                    │ (hiển thị modal + đổ chuông)
  │                                            │<── call:accept ────────────────────│ (nếu accept)
  │<── call:accepted ──────────────────────────│                                    │
  │                                            │── call:accepted ──────────────────>│
  │                                            │                                    │
  │ (tạo RTCPeerConnection + local media)      │                                    │ (cũng tạo PC + local media)
  │── call:offer ─────────────────────────────>│                                    │
  │                                            │── call:offer ─────────────────────>│
  │                                            │<── call:answer ────────────────────│
  │<── call:answer ────────────────────────────│                                    │
  │                                            │                                    │
  │ <──────────── ICE candidates (2 chiều) ────────────────>                        │
  │                                            │                                    │
  │ (có remoteStream)                          │                                    │ (có remoteStream)
  │                                            │                                    │
  │── call:end ───────────────────────────────>│                                    │
  │                                            │── call:ended ─────────────────────>│
```

**Quy tắc bắt buộc**:
- **Chỉ gửi offer sau khi nhận `call:accepted`**
- `callId` do client tạo bằng `crypto.randomUUID()` (hoặc tương đương)
- Backend **không tạo** `callId`
- Backend cần **room theo conversationId** hoặc gửi trực tiếp đến userId của đối phương

---

## Xử lý đặc biệt Backend nên làm

1. **Busy detection**: Nếu user đang trong cuộc gọi khác → trả `call:error` hoặc tự động reject với reason `busy`
2. **Timeout**: Nếu callee không trả lời sau ~45s → tự động phát `call:rejected` với reason `no-answer`
3. **User offline**: Nếu người nhận offline → ngay lập tức `call:rejected` hoặc `call:error`
4. **Xác thực**: Mọi event phải kiểm tra user có thuộc `conversationId` không (tránh spam)
5. **TURN server** (khuyến nghị production): Cung cấp TURN credentials qua 1 endpoint REST trước khi client khởi tạo `RTCPeerConnection`

---

## Danh sách mã lỗi khuyến nghị (code trong call:error)

- `permission_denied`
- `media_failed`
- `peer_unavailable`
- `connection_failed`
- `already_in_call`
- `invalid_state`
- `timeout`
- `unknown`

---

## Gợi ý triển khai Backend (Node + Socket.IO)

```js
// Ví dụ tối giản
socket.on("call:initiate", ({ callId, conversationId, callType }) => {
  const peer = findPeerInConversation(conversationId, socket.userId);
  if (!peer) return;

  // Kiểm tra peer có đang bận không
  if (isUserInActiveCall(peer.id)) {
    return socket.emit("call:error", { code: "peer_unavailable", message: "Người dùng đang bận" });
  }

  io.to(peer.socketId).emit("call:incoming", {
    callId,
    conversationId,
    callType,
    from: { id: socket.userId, name: socket.user.name, avatar: socket.user.avatar },
    timestamp: new Date().toISOString(),
  });
});
```

---

**Liên hệ team frontend** nếu cần điều chỉnh payload hoặc thêm event mới.
