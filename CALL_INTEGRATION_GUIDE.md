# Voice & Video Call — Integration Guide

## 1. Backend (Socket Server)

Copy nội dung từ file `SOCKET_CALL_HANDLER_IMPLEMENTATION.js` vào file xử lý socket của bạn.

### Cách mount handler hiện tại của bạn (ví dụ)

```js
// server/src/socket/index.js  (hoặc tương tự)
const { registerSocketHandlers } = require("./handlers");

function createSocketServer(httpServer, app) {
  const io = new Server(httpServer, {
    cors: { origin: process.env.CORS_ORIGIN || "*" },
    transports: ["websocket"],
  });

  // === QUAN TRỌNG: Truyền resolver nếu có ===
  registerSocketHandlers(io, app, {
    /**
     * Hàm này được gọi mỗi khi có call:initiate
     * Trả về userId (number) hoặc mảng userId của người nhận
     */
    async resolveCallRecipients(boxId, callerUserId) {
      // Ví dụ dùng service chat hiện tại của bạn
      const box = await chatService.getBoxById(boxId);
      if (!box) return [];

      const members = await chatService.getBoxMembers(boxId); // [{id, ...}]
      return members
        .map(m => m.id)
        .filter(id => Number(id) !== Number(callerUserId));
    },
  });

  return io;
}
```

Nếu **không truyền** `resolveCallRecipients`, server sẽ dùng 2 fallback:
1. Dùng `targetUserId` mà client gửi kèm (đang được frontend gửi)
2. Quét những socket đang ở trong room `boxId`

→ Với thay đổi ở `ChatWidget.jsx`, cách 1 đã hoạt động rất tốt.

### Lưu ý quan trọng

- User **bắt buộc** phải join room theo `userId` (đã có sẵn: `socket.join(String(userId))`)
- Mọi event call đều dùng `callId` do client tạo (`crypto.randomUUID()`)
- Server chỉ forward signaling, không xử lý WebRTC media.

---

## 2. Frontend (đã hoàn thiện)

Đã cập nhật:
- `useWebRTCCall.js` — chấp nhận `targetUserId` ở `initiateCall`
- `CallContext.jsx` — truyền `targetUserId` qua `startCall(..., targetUserId)`
- `ChatWidget.jsx` — tự động gửi `peerId` khi bấm nút gọi

Bạn **không cần thay đổi gì thêm** ở UI.

---

## 3. Luồng hoạt động đầy đủ

```
Caller                              Server                          Callee
  │                                   │                                │
  │── call:initiate (có targetUserId) ─>│                                │
  │                                   │── call:incoming ────────────────>│  (hiển thị modal + ringtone)
  │                                   │                                  │
  │                                   │<── call:accept ──────────────────│
  │<── call:accepted ──────────────────│                                  │
  │                                   │── call:accepted ────────────────>│
  │                                   │                                  │
  │ (tạo RTCPeerConnection + media)    │                                  │ (tạo PC + media)
  │── call:offer ──────────────────────>│                                  │
  │                                   │── call:offer ───────────────────>│
  │                                   │<── call:answer ──────────────────│
  │<── call:answer ────────────────────│                                  │
  │                                   │                                  │
  │ <──────────── ICE candidates ────────────────>                       │
  │                                   │                                  │
  │ (có remoteStream)                  │                                  │ (có remoteStream)
  │                                   │                                  │
  │── call:end ────────────────────────>│                                  │
  │                                   │── call:ended ───────────────────>│
```

---

## 4. Testing nhanh

1. Mở 2 trình duyệt (2 user khác nhau)
2. Mở chat box giữa 2 user
3. Bấm nút gọi thoại / video từ 1 bên
4. Bên kia phải thấy modal "Cuộc gọi đến"
5. Accept → cả 2 phải vào màn hình call và nghe thấy nhau

Nếu dùng STUN public (đã có trong `callTypes.js`) thì local network thường hoạt động ngay.

Production nên thêm TURN server (Coturn, Twilio, Metered.ca...).

---

## 5. Các file liên quan

| File | Vai trò |
|------|---------|
| `SOCKET_CALL_HANDLER_IMPLEMENTATION.js` | Code server hoàn chỉnh (copy vào backend) |
| `src/components/call/useWebRTCCall.js` | Hook WebRTC + signaling |
| `src/components/call/CallContext.jsx` | Provider toàn cục |
| `src/components/call/callTypes.js` | Constants + event names |
| `src/components/chat/ChatWidget.jsx` | Nút gọi từ trong chat |

---

## 6. Mở rộng sau này

- Hỗ trợ group call (nhiều người): cần thay đổi UI + SFU (mediasoup, livekit...)
- Ghi âm cuộc gọi
- Call từ trang profile / danh sách tài xế / công ty (đã hỗ trợ qua `startCall(boxId, type, user, targetUserId)`)

---

**Hoàn tất.** Tính năng voice + video call 1:1 đã sẵn sàng production sau khi bạn paste code server vào backend.
