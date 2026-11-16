import { Router } from "express";
import healthRecordController from "../controllers/health-record.controller.js";
import { verifyAccessTokenMiddleware } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/role.middleware.js";
import { preventSensitiveCaching } from "../middlewares/security.middleware.js";

const router = Router();
router.use(verifyAccessTokenMiddleware, preventSensitiveCaching);

router.get("/:patientId/summary", authorize("Patient", "Doctor", "STAFF", "Admin"), healthRecordController.summary);
router.get("/:patientId/timeline", authorize("Patient", "Doctor", "STAFF", "Admin"), healthRecordController.timeline);
router.get("/:patientId/medications", authorize("Patient", "Doctor", "STAFF", "Admin"), healthRecordController.medications);
router.get("/:patientId/tests", authorize("Patient", "Doctor", "STAFF", "Admin"), healthRecordController.tests);

for (const kind of ["history", "allergies", "conditions", "vitals"]) {
  router.get(`/:patientId/${kind}`, authorize("Patient", "Doctor", "STAFF", "Admin"), healthRecordController.list(kind));
  router.post(`/:patientId/${kind}`, authorize("Patient", "Doctor"), healthRecordController.create(kind));
  router.put(`/:patientId/${kind}/:entryId`, authorize("Patient", "Doctor", "Admin"), healthRecordController.update(kind));
  router.delete(`/:patientId/${kind}/:entryId`, authorize("Patient", "Admin"), healthRecordController.remove(kind));
}

export default router;
