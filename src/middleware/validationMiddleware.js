import { validationResult } from "express-validator";

const validateRequest = (req, res, next) => {
  const result = validationResult(req);

  if (result.isEmpty()) {
    return next();
  }

  return res.status(422).json({
    success: false,
    error: {
      message: "Validation failed",
      code: "VALIDATION_ERROR",
      fields: result.array().map((issue) => ({
        field: issue.path,
        message: issue.msg
      }))
    }
  });
};

export default validateRequest;
