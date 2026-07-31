const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  res.status(404);
  next(error);
};

const errorHandler = (error, _req, res, _next) => {
  let statusCode =
    error.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);

  let message = error.message || "Server error";

  if (error.name === "MulterError") {
    statusCode = 400;
    if (error.code === "LIMIT_FILE_SIZE") {
      message = "Image too large (max 12 MB). Any filename is allowed.";
    } else {
      message = `Upload error: ${error.message}`;
    }
  }

  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === "production" ? undefined : error.stack,
  });
};

export { errorHandler, notFound };
