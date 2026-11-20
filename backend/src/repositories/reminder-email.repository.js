import prisma from "../config/prisma.js";

const key = (appointmentId, reminderKey) => ({
  appointment_id_reminder_key: {
    appointment_id: Number(appointmentId),
    reminder_key: reminderKey,
  },
});

export default {
  findByKey(appointmentId, reminderKey) {
    return prisma.appointment_reminder_emails.findUnique({ where: key(appointmentId, reminderKey) });
  },

  markSent({ appointmentId, reminderKey, now = new Date() }) {
    return prisma.appointment_reminder_emails.upsert({
      where: key(appointmentId, reminderKey),
      create: {
        appointment_id: Number(appointmentId),
        reminder_key: reminderKey,
        status: "SENT",
        attempts: 1,
        sent_at: now,
        last_error: null,
      },
      update: { status: "SENT", sent_at: now, last_error: null, attempts: { increment: 1 } },
    });
  },

  recordFailure({ appointmentId, reminderKey, error, now = new Date() }) {
    return prisma.appointment_reminder_emails.upsert({
      where: key(appointmentId, reminderKey),
      create: {
        appointment_id: Number(appointmentId),
        reminder_key: reminderKey,
        status: "FAILED",
        attempts: 1,
        last_error: String(error || "").slice(0, 1000),
        updated_at: now,
      },
      update: {
        status: "FAILED",
        attempts: { increment: 1 },
        last_error: String(error || "").slice(0, 1000),
        updated_at: now,
      },
    });
  },
};
