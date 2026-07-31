import { Router } from "express";
import { ussdSession } from "../controllers/ussdController.js";
import asyncHandler from "../utils/asyncHandler.js";

const router = Router();

router.post("/session", asyncHandler(ussdSession));

export default router;
