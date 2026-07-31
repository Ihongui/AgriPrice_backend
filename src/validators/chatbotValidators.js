import { body } from "express-validator";

const chatbotValidation = [
  body("message").trim().notEmpty().withMessage("Message is required"),
  body("history").optional().isArray().withMessage("History must be an array"),
  body("history.*.role").optional().isIn(["user", "assistant", "system"]).withMessage("Invalid chat role"),
  body("history.*.content").optional().isString().withMessage("Chat content must be text")
];

export default chatbotValidation;
