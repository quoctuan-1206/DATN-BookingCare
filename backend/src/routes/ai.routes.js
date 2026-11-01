import { Router } from "express";
import aiController from "../controllers/ai.controller.js";
import { optionalAuth } from "../middlewares/auth.middleware.js";
import { aiRateLimit } from "../middlewares/ai-rate-limit.middleware.js";
import { validateBody } from "../middlewares/validator.middleware.js";
import { analyzeMessageSchema } from "../validators/ai.validator.js";
import { knowledgeSearchSchema } from "../validators/knowledge.validator.js";

const router = Router();

router.post("/analyze", optionalAuth, aiRateLimit, validateBody(analyzeMessageSchema), aiController.analyze);
router.post("/retrieve", optionalAuth, aiRateLimit, validateBody(analyzeMessageSchema), aiController.retrieve);
router.post("/knowledge/search", optionalAuth, aiRateLimit, validateBody(knowledgeSearchSchema), aiController.searchKnowledge);
router.post("/chat", optionalAuth, aiRateLimit, validateBody(analyzeMessageSchema), aiController.chat);

export default router;
