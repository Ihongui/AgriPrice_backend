import { Router } from "express";
import { getAdminStats } from "../controllers/adminController.js";
import protect from "../middleware/authMiddleware.js";
import asyncHandler from "../utils/asyncHandler.js";

const router = Router();

router.get("/stats", protect, asyncHandler(getAdminStats));

export default router;
