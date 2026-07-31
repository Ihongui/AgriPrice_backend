import multer from "multer";

/**
 * Memory storage: original filename is ignored for disk paths (Unicode, spaces, etc. all OK).
 * Use captureAnyImage to accept ANY form field name for the file (image, file, photo, etc.).
 */
const storage = multer.memoryStorage();

const imageFilter = (_req, file, callback) => {
  if (!file.mimetype || !file.mimetype.startsWith("image/")) {
    return callback(new Error("Only image files are allowed (JPEG, PNG, WebP, GIF, etc.)."));
  }
  return callback(null, true);
};

const upload = multer({
  storage,
  limits: { fileSize: 12 * 1024 * 1024 },
  fileFilter: imageFilter
});

/**
 * Accepts multipart upload with any field name; sets req.imageFile to the first image.
 */
const captureAnyImage = (req, res, next) => {
  upload.any()(req, res, (err) => {
    if (err) {
      return next(err);
    }

    const files = Array.isArray(req.files) ? req.files : [];
    const imageFile = files.find((f) => f.mimetype && f.mimetype.startsWith("image/"));
    req.imageFile = imageFile || null;
    return next();
  });
};

export { captureAnyImage };
export default upload;
