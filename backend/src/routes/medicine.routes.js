import { Router } from "express";
import medicineController from "../controllers/medicine.controller.js";
import { verifyAccessTokenMiddleware } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/role.middleware.js";

const router = Router();

router.get(
  "/",
  verifyAccessTokenMiddleware,
  authorize("Doctor", "Admin"),
  medicineController.getMedicines,
);

router.get(
  "/:id",
  verifyAccessTokenMiddleware,
  authorize("Admin"),
  medicineController.getById,
);

router.post(
  "/",
  verifyAccessTokenMiddleware,
  authorize("Admin"),
  medicineController.create,
);

router.put(
  "/:id",
  verifyAccessTokenMiddleware,
  authorize("Admin"),
  medicineController.update,
);

router.delete(
  "/:id",
  verifyAccessTokenMiddleware,
  authorize("Admin"),
  medicineController.delete,
);

export default router;
