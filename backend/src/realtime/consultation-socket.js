import { Server } from "socket.io";
import prisma from "../config/prisma.js";
import { verifyAccessToken } from "../utils/jwt.js";
import consultationService from "../services/consultation.service.js";

const signalingEvents = ["webrtc:offer", "webrtc:answer", "webrtc:ice-candidate"];
let socketServer;

export function emitConsultationStatus(io, roomId, status, details = {}) {
  io?.to(roomId).emit("consultation:status", { status, ...details });
}

export function publishConsultationStatus(roomId, status, details = {}) {
  emitConsultationStatus(socketServer, roomId, status, details);
}

export function attachConsultationSocket(httpServer) {
  const origins = (process.env.FRONTEND_URL || "http://localhost:5173")
    .split(",").map((origin) => origin.trim()).filter(Boolean);
  const io = new Server(httpServer, {
    cors: { origin: origins, credentials: true },
    maxHttpBufferSize: 64 * 1024,
    allowRequest: (req, done) => {
      const origin = req.headers.origin;
      done(null, !origin || origins.includes(origin));
    },
  });
  socketServer = io;

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (typeof token !== "string" || !token) return next(new Error("unauthorized"));
      const decoded = verifyAccessToken(token);
      const user = await prisma.users.findUnique({ where: { id: decoded.id }, include: { role: true } });
      if (!user?.is_active || !["Patient", "Doctor"].includes(user.role?.name)) return next(new Error("unauthorized"));
      const { password, ...safeUser } = user;
      socket.data.user = safeUser;
      socket.data.tokenExpiry = decoded.exp ? decoded.exp * 1000 : null;
      next();
    } catch { next(new Error("unauthorized")); }
  });

  io.on("connection", (socket) => {
    const joined = new Map();
    let eventWindowStartedAt = Date.now();
    let eventCount = 0;
    const enforceRateLimit = () => {
      const now = Date.now();
      if (now - eventWindowStartedAt > 10_000) { eventWindowStartedAt = now; eventCount = 0; }
      eventCount += 1;
      return eventCount <= 120;
    };
    const authWatch = setInterval(async () => {
      if (socket.data.tokenExpiry && Date.now() >= socket.data.tokenExpiry) {
        socket.disconnect(true);
        return;
      }
      const user = await prisma.users.findUnique({ where: { id: socket.data.user.id }, include: { role: true } }).catch(() => null);
      if (!user?.is_active || !["Patient", "Doctor"].includes(user.role?.name) || user.role.name !== socket.data.user.role.name) socket.disconnect(true);
    }, 60_000);
    authWatch.unref?.();
    socket.on("consultation:join", async (payload = {}, ack = () => {}) => {
      try {
        if (!enforceRateLimit()) throw new Error("Bạn thao tác quá nhanh, hãy thử lại sau");
        const appointmentId = Number(payload.appointmentId);
        const session = await consultationService.getOrCreate(socket.data.user, appointmentId);
        if (["COMPLETED", "CANCELLED", "FAILED"].includes(session.status)) {
          throw new Error("Phiên tư vấn đã kết thúc và không thể tham gia lại");
        }
        const peers = await io.in(session.room_id).fetchSockets();
        const role = socket.data.user.role.name;
        if (peers.some((peer) => peer.data.user.role.name === role)) throw new Error("Bên tham gia này đã có kết nối trong phòng");
        await socket.join(session.room_id);
        joined.set(session.room_id, appointmentId);
        if (peers.length === 1) {
          await consultationService.markInProgress(session.id);
          io.to(session.room_id).emit("consultation:status", { status: "IN_PROGRESS" });
        }
        socket.to(session.room_id).emit("consultation:peer-joined");
        ack({ ok: true, peerPresent: peers.length > 0, session: { status: session.status, started_at: session.started_at, ended_at: session.ended_at } });
      } catch (error) {
        ack({ ok: false, message: error.message || "Không thể tham gia phòng tư vấn" });
      }
    });
    socket.on("consultation:leave", () => {
      for (const room of joined.keys()) {
        socket.to(room).emit("consultation:peer-left");
        socket.to(room).emit("consultation:status", { status: "RECONNECTING" });
        socket.leave(room);
      }
      joined.clear();
    });
    for (const event of signalingEvents) {
      socket.on(event, (payload = {}) => {
        if (!enforceRateLimit()) { socket.emit("consultation:error", { message: "Bạn thao tác quá nhanh" }); return; }
        const appointmentId = Number(payload.appointmentId);
        const room = [...joined.entries()].find(([, id]) => id === appointmentId)?.[0];
        if (!room || !payload.data || JSON.stringify(payload.data).length > 48_000) return;
        socket.to(room).emit(event, { data: payload.data });
      });
    }
    socket.on("disconnect", () => {
      clearInterval(authWatch);
      for (const room of joined.keys()) {
        socket.to(room).emit("consultation:peer-left");
        socket.to(room).emit("consultation:status", { status: "RECONNECTING" });
      }
    });
  });
  return io;
}
