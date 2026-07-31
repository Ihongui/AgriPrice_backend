import { Router } from "express";
import {
  bulkCreateOrUpdatePrices,
  createOrUpdatePrice,
  deletePrice,
  getComparePrices,
  getCurrentPrices,
  getLatestPrices,
  getPriceHistory,
  getPriceTrends,
  updatePrice
} from "../controllers/priceController.js";
import protect from "../middleware/authMiddleware.js";
import validateRequest from "../middleware/validationMiddleware.js";
import asyncHandler from "../utils/asyncHandler.js";
import { bulkPriceValidation, singlePriceValidation, updatePriceValidation } from "../validators/priceValidators.js";

const router = Router();

router.get("/", asyncHandler(getCurrentPrices));
router.get("/history", protect, asyncHandler(getPriceHistory));
router.get("/compare", asyncHandler(getComparePrices));
router.get("/latest", asyncHandler(getLatestPrices));
router.get("/trends/:cropId", asyncHandler(getPriceTrends));
router.post("/", protect, singlePriceValidation, validateRequest, asyncHandler(createOrUpdatePrice));
router.post("/bulk", protect, bulkPriceValidation, validateRequest, asyncHandler(bulkCreateOrUpdatePrices));
router.put("/:id", protect, updatePriceValidation, validateRequest, asyncHandler(updatePrice));
router.delete("/:id", protect, asyncHandler(deletePrice));

export default router;
