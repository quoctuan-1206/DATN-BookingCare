import { Router } from "express";
import prescriptionController from "../controllers/prescription.controller.js";
import { verifyAccessTokenMiddleware } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/role.middleware.js";

const router = Router();

router.use(
  verifyAccessTokenMiddleware,
  authorize("Patient", "Doctor", "Admin"),
);

router.get(
  "/by-medical-record/:medicalRecordId",
  prescriptionController.getByMedicalRecordId,
);

router.get("/:id", prescriptionController.getById);

router.post(
  "/",
  authorize("Doctor", "Admin"),
  prescriptionController.create,
);

router.put(
  "/:id",
  authorize("Doctor", "Admin"),
  prescriptionController.update,
);

export default router;
