import { Router } from "express";
import {
  createMarket,
  deleteMarket,
  getMarkets,
  updateMarket
} from "../controllers/marketController.js";
import protect from "../middleware/authMiddleware.js";
import validateRequest from "../middleware/validationMiddleware.js";
import asyncHandler from "../utils/asyncHandler.js";
import marketValidation from "../validators/marketValidators.js";

const router = Router();

router.get("/", asyncHandler(getMarkets));
router.post("/", protect, marketValidation, validateRequest, asyncHandler(createMarket));
router.put("/:id", protect, marketValidation, validateRequest, asyncHandler(updateMarket));
router.delete("/:id", protect, asyncHandler(deleteMarket));

export default router;
