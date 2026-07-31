import { body } from "express-validator";

const singlePriceValidation = [
  body("cropId").isMongoId().withMessage("Valid cropId is required"),
  body("marketId").isMongoId().withMessage("Valid marketId is required"),
  body("price").isFloat({ min: 0 }).withMessage("Price must be a non-negative number"),
  body("dateRecorded").optional({ values: "falsy" }).isISO8601().withMessage("dateRecorded must be valid"),
  body("source").optional().isIn(["manual", "sms", "ussd", "api"]).withMessage("Invalid source"),
  body("notes").optional({ values: "falsy" }).trim()
];

const updatePriceValidation = [
  body("cropId").optional().isMongoId().withMessage("cropId must be valid"),
  body("marketId").optional().isMongoId().withMessage("marketId must be valid"),
  body("price").optional().isFloat({ min: 0 }).withMessage("Price must be a non-negative number"),
  body("dateRecorded").optional({ values: "falsy" }).isISO8601().withMessage("dateRecorded must be valid"),
  body("source").optional().isIn(["manual", "sms", "ussd", "api"]).withMessage("Invalid source"),
  body("notes").optional({ values: "falsy" }).trim()
];

const bulkPriceValidation = [
  body("cropId").isMongoId().withMessage("Valid cropId is required"),
  body("prices").isArray({ min: 1 }).withMessage("Prices must be a non-empty array"),
  body("prices.*.marketId").isMongoId().withMessage("Each marketId must be valid"),
  body("prices.*.price").isFloat({ min: 0 }).withMessage("Each price must be a non-negative number"),
  body("dateRecorded").optional({ values: "falsy" }).isISO8601().withMessage("dateRecorded must be valid"),
  body("source").optional().isIn(["manual", "sms", "ussd", "api"]).withMessage("Invalid source")
];

export { bulkPriceValidation, singlePriceValidation, updatePriceValidation };
