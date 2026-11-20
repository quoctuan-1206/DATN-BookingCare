import nodemailer from "nodemailer";

let transport = null;
let warned = false;

export function isMailEnabled() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

export function getTransport() {
  if (!isMailEnabled()) {
    if (!warned) {
      console.warn("[mail] SMTP chưa cấu hình — bỏ qua email nhắc lịch");
      warned = true;
    }
    return null;
  }
  if (!transport) {
    transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 465),
      secure: String(process.env.SMTP_SECURE || "true") === "true",
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return transport;
}

export default { isMailEnabled, getTransport };
