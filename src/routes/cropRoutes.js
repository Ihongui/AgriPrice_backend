import { Router } from "express";
import {
  createCrop,
  deleteCrop,
  deleteCropImage,
  getCrops,
  updateCrop,
  uploadCropImage
} from "../controllers/cropController.js";
import protect from "../middleware/authMiddleware.js";
import { captureAnyImage } from "../middleware/upload.js";
import validateRequest from "../middleware/validationMiddleware.js";
import asyncHandler from "../utils/asyncHandler.js";
import cropValidation from "../validators/cropValidators.js";

const router = Router();

router.get("/", asyncHandler(getCrops));
router.post("/", protect, cropValidation, validateRequest, asyncHandler(createCrop));
router.put("/:id", protect, cropValidation, validateRequest, asyncHandler(updateCrop));
router.put("/:id/image", protect, captureAnyImage, asyncHandler(uploadCropImage));
router.delete("/:id/image", protect, asyncHandler(deleteCropImage));
router.delete("/:id", protect, asyncHandler(deleteCrop));

export default router;
