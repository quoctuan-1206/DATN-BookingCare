import { Router } from "express";
import articleController from "../controllers/article.controller.js";
import {
  verifyAccessTokenMiddleware,
  optionalAuth,
} from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/role.middleware.js";

const router = Router();

// Public (Admin token → xem cả nháp / tất cả)
router.get("/", optionalAuth, articleController.getAllArticles);
router.get("/:id", optionalAuth, articleController.getArticleById);

// Chỉ Admin: tạo / cập nhật / xóa bài viết
router.post(
  "/",
  verifyAccessTokenMiddleware,
  authorize("Admin"),
  articleController.createArticle,
);

router.put(
  "/:id",
  verifyAccessTokenMiddleware,
  authorize("Admin"),
  articleController.updateArticle,
);

router.delete(
  "/:id",
  verifyAccessTokenMiddleware,
  authorize("Admin"),
  articleController.deleteArticle,
);

export default router;
