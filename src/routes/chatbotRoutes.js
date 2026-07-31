import { Router } from "express";
import { postChatMessage } from "../controllers/chatbotController.js";
import validateRequest from "../middleware/validationMiddleware.js";
import asyncHandler from "../utils/asyncHandler.js";
import chatbotValidation from "../validators/chatbotValidators.js";

const router = Router();

router.post("/message", chatbotValidation, validateRequest, asyncHandler(postChatMessage));

export default router;
