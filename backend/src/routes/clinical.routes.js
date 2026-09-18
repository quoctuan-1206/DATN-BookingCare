import { Router } from "express";
import labController from "../controllers/lab.controller.js";
import { verifyAccessTokenMiddleware } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/role.middleware.js";
import { uploadClinicalResultMiddleware } from "../middlewares/upload.middleware.js";
import {
  limitClinicalUploads,
  preventSensitiveCaching,
} from "../middlewares/security.middleware.js";

const router = Router();

// Danh mục công khai chỉ trả về dịch vụ đang hoạt động.
router.get("/catalog", labController.getPublicServices);
router.get("/catalog/:id", labController.getPublicServiceById);
router.get("/schedules/available", labController.getAvailableClinicalSchedules);

router.use(verifyAccessTokenMiddleware, preventSensitiveCaching);

router.get(
  "/stats",
  authorize("Admin"),
  labController.getClinicalStatistics,
);

router.get(
  "/services",
  authorize("Admin", "Doctor", "STAFF"),
  labController.getServices,
);
router.get(
  "/services/:id",
  authorize("Admin", "Doctor", "STAFF"),
  labController.getServiceById,
);
router.post(
  "/services",
  authorize("Admin"),
  labController.createService,
);
router.put(
  "/services/:id",
  authorize("Admin"),
  labController.updateService,
);
router.patch(
  "/services/:id",
  authorize("Admin"),
  labController.updateService,
);
router.delete(
  "/services/:id",
  authorize("Admin"),
  labController.deleteService,
);

router.get(
  "/schedules",
  authorize("Admin", "STAFF"),
  labController.getClinicalSchedules,
);
router.post(
  "/schedules",
  authorize("Admin", "STAFF"),
  labController.createClinicalSchedule,
);
router.put(
  "/schedules/:id",
  authorize("Admin", "STAFF"),
  labController.updateClinicalSchedule,
);
router.patch(
  "/schedules/:id",
  authorize("Admin", "STAFF"),
  labController.updateClinicalSchedule,
);
router.delete(
  "/schedules/:id",
  authorize("Admin", "STAFF"),
  labController.deleteClinicalSchedule,
);

router.get(
  "/history/patient/:patientId",
  authorize("Admin", "Doctor", "Patient", "STAFF"),
  labController.getPatientHistory,
);
router.get(
  "/history/appointment/:appointmentId",
  authorize("Admin", "Doctor", "Patient", "STAFF"),
  labController.getAppointmentHistory,
);
router.get(
  "/history/doctor/:doctorId",
  authorize("Admin", "Doctor", "STAFF"),
  labController.getDoctorHistory,
);
router.get(
  "/history/status/:status",
  authorize("Admin", "Doctor", "Patient", "STAFF"),
  labController.getStatusHistory,
);

router.get(
  "/orders",
  authorize("Admin", "Doctor", "Patient", "STAFF"),
  labController.getClinicalOrders,
);
router.post(
  "/orders/self",
  authorize("Patient"),
  labController.createPatientClinicalOrder,
);
router.post(
  "/orders",
  authorize("Admin", "Doctor"),
  labController.createClinicalOrder,
);
router.get(
  "/orders/:id",
  authorize("Admin", "Doctor", "Patient", "STAFF"),
  labController.getClinicalOrderById,
);
router.patch(
  "/orders/:id/status",
  authorize("Admin", "STAFF"),
  labController.updateClinicalOrderStatus,
);
router.get(
  "/orders/:id/events",
  authorize("Admin", "Doctor", "STAFF"),
  labController.getOrderEvents,
);

router.post(
  "/orders/:orderId/results",
  authorize("Admin", "STAFF"),
  labController.createClinicalResult,
);
router.get(
  "/results/:id",
  authorize("Admin", "Doctor", "Patient", "STAFF"),
  labController.getClinicalResult,
);
router.put(
  "/orders/:orderId/results/:resultId",
  authorize("Admin", "STAFF"),
  labController.updateClinicalResult,
);
router.patch(
  "/orders/:orderId/results/:resultId",
  authorize("Admin", "STAFF"),
  labController.updateClinicalResult,
);

router.get(
  "/orders/:id/attachments",
  authorize("Admin", "Doctor", "Patient", "STAFF"),
  labController.getAttachments,
);
router.post(
  "/orders/:id/attachments",
  authorize("Admin", "STAFF"),
  limitClinicalUploads,
  uploadClinicalResultMiddleware,
  labController.uploadAttachment,
);
router.get(
  "/attachments/:id/file",
  authorize("Admin", "Doctor", "Patient", "STAFF"),
  labController.downloadAttachment,
);
router.delete(
  "/attachments/:id",
  authorize("Admin", "STAFF"),
  labController.deleteAttachment,
);

export default router;
