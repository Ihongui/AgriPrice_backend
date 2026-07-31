import { body } from "express-validator";

const loginValidation = [
  body("username").trim().notEmpty().withMessage("Username is required"),
  body("password").notEmpty().withMessage("Password is required")
];

const userValidation = [
  body("username").trim().notEmpty().withMessage("Username is required"),
  body("password")
    .optional({ values: "falsy" })
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),
  body("role")
    .optional()
    .isIn(["admin", "superadmin", "reporter"])
    .withMessage("Invalid user role"),
  body("phoneNumber").optional({ values: "falsy" }).trim(),
  body("verified").optional().isBoolean().withMessage("verified must be true or false")
];

const reporterSmsValidation = [
  body("text").trim().notEmpty().withMessage("SMS text is required")
];

export { loginValidation, reporterSmsValidation, userValidation };
