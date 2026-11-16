import healthRecordService from "../services/health-record.service.js";
import {
  allergySchema,
  allergyUpdateSchema,
  conditionSchema,
  conditionUpdateSchema,
  historySchema,
  historyUpdateSchema,
  timelineQuerySchema,
  vitalSchema,
  vitalUpdateSchema,
} from "../validators/health-record.validator.js";

const schemas = {
  history: [historySchema, historyUpdateSchema],
  allergies: [allergySchema, allergyUpdateSchema],
  conditions: [conditionSchema, conditionUpdateSchema],
  vitals: [vitalSchema, vitalUpdateSchema],
};

class HealthRecordController {
  async invoke(res, next, operation) {
    try {
      const data = await operation();
      return res.status(200).json({ success: true, data });
    } catch (error) {
      return next(error);
    }
  }

  summary = (req, res, next) => this.invoke(res, next, () => healthRecordService.summary(req.params.patientId, req.user));
  timeline = (req, res, next) => this.invoke(res, next, () => healthRecordService.timeline(req.params.patientId, req.user, timelineQuerySchema.parse(req.query)));
  medications = (req, res, next) => this.invoke(res, next, () => healthRecordService.medications(req.params.patientId, req.user));
  tests = (req, res, next) => this.invoke(res, next, () => healthRecordService.tests(req.params.patientId, req.user));

  list = (kind) => (req, res, next) => this.invoke(res, next, () => healthRecordService.listStored({
    history: "patient_medical_history",
    allergies: "patient_allergies",
    conditions: "patient_conditions",
    vitals: "patient_vitals",
  }[kind], req.params.patientId, req.user, { orderBy: kind === "vitals" ? { measured_at: "desc" } : undefined }));

  create = (kind) => async (req, res, next) => {
    try {
      const data = schemas[kind][0].parse(req.body);
      const result = await healthRecordService.createEntry(kind, req.params.patientId, req.user, data);
      return res.status(201).json({ success: true, data: result });
    } catch (error) { return next(error); }
  };

  update = (kind) => async (req, res, next) => {
    try {
      const data = schemas[kind][1].parse(req.body);
      const result = await healthRecordService.updateEntry(kind, req.params.patientId, req.params.entryId, req.user, data);
      return res.status(200).json({ success: true, data: result });
    } catch (error) { return next(error); }
  };

  remove = (kind) => (req, res, next) => this.invoke(res, next, async () => {
    await healthRecordService.deleteEntry(kind, req.params.patientId, req.params.entryId, req.user);
    return { deleted: true };
  });
}

export default new HealthRecordController();
