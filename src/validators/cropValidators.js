import { body } from "express-validator";
import {
  cropCategoryEnum,
  normalizeCropCategory,
} from "../utils/cropCategories.js";

const cropValidation = [
  body("name").trim().notEmpty().withMessage("Crop name is required"),
  body("localName").optional({ values: "falsy" }).trim(),
  body("category")
    .customSanitizer(normalizeCropCategory)
    .isIn(cropCategoryEnum)
    .withMessage("Select a valid crop category"),
  body("unit").trim().notEmpty().withMessage("Unit is required"),
  body("season").optional({ values: "falsy" }).trim(),
  body("description").trim().notEmpty().withMessage("Description is required"),
  body("imageUrl")
    .optional({ values: "falsy" })
    .isURL()
    .withMessage("Image URL must be valid"),
  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be true or false"),
];

export default cropValidation;
