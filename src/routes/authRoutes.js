import { Router } from "express";
import { loginAdmin } from "../controllers/authController.js";
import asyncHandler from "../utils/asyncHandler.js";

const router = Router();

router.post("/login", asyncHandler(loginAdmin));

export default router;
