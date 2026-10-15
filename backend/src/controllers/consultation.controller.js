import consultationService from "../services/consultation.service.js";
import { publishConsultationStatus } from "../realtime/consultation-socket.js";

class ConsultationController {
  async get(req, res, next) {
    try {
      const session = await consultationService.get(req.user, req.params.appointmentId);
      res.json({ success: true, data: session });
    } catch (error) { next(error); }
  }
  async start(req, res, next) {
    try {
      const session = await consultationService.start(req.user, req.params.appointmentId);
      res.json({ success: true, data: session });
    } catch (error) { next(error); }
  }
  async finish(req, res, next) {
    try {
      const { session, completedNow } = await consultationService.finish(req.user, req.params.appointmentId);
      if (completedNow) {
        publishConsultationStatus(session.room_id, session.status, {
          appointment_id: session.appointment_id,
          started_at: session.started_at,
          ended_at: session.ended_at,
          duration_seconds: session.duration_seconds,
        });
      }
      res.json({ success: true, data: session });
    } catch (error) { next(error); }
  }
  async history(req, res, next) {
    try { res.json({ success: true, data: await consultationService.history(req.user) }); }
    catch (error) { next(error); }
  }
}

export default new ConsultationController();
