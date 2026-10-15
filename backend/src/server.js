import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "node:http";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env trước khi import app (tránh JWT secret undefined)
dotenv.config({
  path: path.resolve(__dirname, "../.env"),
});

const { default: app } = await import("./app.js");
const { startPaymentExpirationJob } = await import("./jobs/payment-expiration.job.js");
const { startAppointmentReminderJob } = await import("./jobs/appointment-reminder.job.js");
const { startNotificationHeartbeat } = await import("./realtime/notification-stream.js");
const { attachConsultationSocket } = await import("./realtime/consultation-socket.js");

const PORT = process.env.PORT || 3000;

const httpServer = createServer(app);
attachConsultationSocket(httpServer);
httpServer.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
  startPaymentExpirationJob();
  startAppointmentReminderJob();
  startNotificationHeartbeat();
});
