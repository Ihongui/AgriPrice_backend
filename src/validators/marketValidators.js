import { body } from "express-validator";

const marketValidation = [
  body("name").trim().notEmpty().withMessage("Market name is required"),
  body("city").optional({ values: "falsy" }).trim(),
  body("location").optional({ values: "falsy" }).trim(),
  body("region").trim().notEmpty().withMessage("Region is required"),
  body("type")
    .optional({ values: "falsy" })
    .isIn(["Urban", "Wholesale", "Regional Hub", "Rural"])
    .withMessage("Select a valid market type"),
  body("coordinates.lat").optional({ values: "falsy" }).isFloat().withMessage("Latitude must be numeric"),
  body("coordinates.lng").optional({ values: "falsy" }).isFloat().withMessage("Longitude must be numeric"),
  body("contactPhone").optional({ values: "falsy" }).trim(),
  body("isActive").optional().isBoolean().withMessage("isActive must be true or false")
];

export default marketValidation;
