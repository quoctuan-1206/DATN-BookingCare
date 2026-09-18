import { Router } from "express";
import labController from "../controllers/lab.controller.js";
import { verifyAccessTokenMiddleware } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/role.middleware.js";
import { uploadLabResultMiddleware } from "../middlewares/upload.middleware.js";
import {
  limitClinicalUploads,
  preventSensitiveCaching,
} from "../middlewares/security.middleware.js";

const router = Router();

// Danh mục công khai chỉ hiển thị xét nghiệm đang hoạt động
router.get("/catalog", labController.getPublicTests);
router.get("/catalog/:id", labController.getPublicTestById);
router.get("/schedules/available", labController.getAvailableSchedules);

router.use(verifyAccessTokenMiddleware, preventSensitiveCaching);

router.get("/tests", authorize("Admin", "Doctor", "STAFF"), labController.getTests);
router.post("/tests", authorize("Admin"), labController.createTest);
router.put("/tests/:id", authorize("Admin"), labController.updateTest);
router.patch("/tests/:id", authorize("Admin"), labController.updateTest);
router.delete("/tests/:id", authorize("Admin"), labController.deleteTest);

router.get("/schedules", authorize("Admin", "STAFF"), labController.getSchedules);
router.post("/schedules", authorize("Admin", "STAFF"), labController.createSchedule);
router.put("/schedules/:id", authorize("Admin", "STAFF"), labController.updateSchedule);
router.delete("/schedules/:id", authorize("Admin", "STAFF"), labController.deleteSchedule);

router.get("/orders", authorize("Admin", "Doctor", "Patient", "STAFF"), labController.getOrders);
router.post("/orders/self", authorize("Patient"), labController.createPatientOrder);
router.post("/orders", authorize("Doctor"), labController.createOrder);
router.get("/orders/:id", authorize("Admin", "Doctor", "Patient", "STAFF"), labController.getOrderById);
router.patch("/orders/:id/status", authorize("Admin", "STAFF"), labController.updateOrderStatus);
router.post(
  "/orders/:id/result-file",
  authorize("Admin", "STAFF"),
  limitClinicalUploads,
  uploadLabResultMiddleware,
  labController.uploadResultFile,
);
router.get(
  "/orders/:id/result-file",
  authorize("Admin", "Doctor", "Patient", "STAFF"),
  labController.downloadResultFile,
);
router.put(
  "/orders/:orderId/results/:resultId",
  authorize("Admin", "STAFF"),
  labController.updateResult,
);

export default router;
