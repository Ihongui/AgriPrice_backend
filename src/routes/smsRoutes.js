import { Router } from "express";
import { getSmsLogs, incomingSms } from "../controllers/smsController.js";
import protect from "../middleware/authMiddleware.js";
import asyncHandler from "../utils/asyncHandler.js";

const router = Router();

router.get("/logs", protect, asyncHandler(getSmsLogs));
router.post("/incoming", asyncHandler(incomingSms));

export default router;
