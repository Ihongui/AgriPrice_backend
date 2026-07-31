import { Readable } from "stream";
import cloudinary, { isCloudinaryConfigured } from "../config/cloudinary.js";
import Crop from "../models/Crop.js";

const getCrops = async (_req, res) => {
  const crops = await Crop.find().sort({ name: 1 });
  res.json({ success: true, data: crops });
};

const createCrop = async (req, res) => {
  const crop = await Crop.create({ ...req.body, createdBy: req.user?._id });
  res.status(201).json({ success: true, data: crop });
};

const updateCrop = async (req, res) => {
  const crop = await Crop.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  if (!crop) {
    return res.status(404).json({ success: false, message: "Crop not found" });
  }

  return res.json({ success: true, data: crop });
};

const deleteCrop = async (req, res) => {
  const crop = await Crop.findByIdAndDelete(req.params.id);

  if (!crop) {
    return res.status(404).json({ success: false, message: "Crop not found" });
  }

  return res.json({ success: true, message: "Crop deleted" });
};

const uploadCropImage = async (req, res) => {
  try {
    const crop = await Crop.findById(req.params.id);

    if (!crop) {
      return res.status(404).json({ success: false, message: "Crop not found" });
    }

    const file = req.imageFile;
    if (!file || !file.buffer) {
      return res.status(400).json({
        success: false,
        message: "No image file was uploaded. Use any field name (e.g. image, file, photo)."
      });
    }

    if (!isCloudinaryConfigured) {
      return res.status(503).json({
        success: false,
        message: "Cloudinary is not configured. Set CLOUDINARY_URL or CLOUDINARY_* in .env (free tier available)."
      });
    }

    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "agriprice-gh/crops",
          resource_type: "image"
        },
        (error, response) => {
          if (error) reject(error);
          else resolve(response);
        }
      );

      Readable.from([file.buffer]).pipe(uploadStream);
    });

    if (crop.imagePublicId) {
      try {
        await cloudinary.uploader.destroy(crop.imagePublicId);
      } catch {
        /* ignore replace cleanup errors */
      }
    }

    crop.imageUrl = result.secure_url;
    crop.imagePublicId = result.public_id;
    await crop.save();

    return res.json({ success: true, data: crop });
  } catch (error) {
    console.error("uploadCropImage", error);
    return res.status(500).json({
      success: false,
      message: error?.message || "Image upload failed"
    });
  }
};

const deleteCropImage = async (req, res) => {
  try {
    const crop = await Crop.findById(req.params.id);

    if (!crop) {
      return res.status(404).json({ success: false, message: "Crop not found" });
    }

    if (isCloudinaryConfigured && crop.imagePublicId) {
      try {
        await cloudinary.uploader.destroy(crop.imagePublicId);
      } catch {
        /* continue clearing DB */
      }
    }

    crop.imageUrl = "";
    crop.imagePublicId = "";
    await crop.save();

    return res.json({ success: true, data: crop });
  } catch (error) {
    console.error("deleteCropImage", error);
    return res.status(500).json({
      success: false,
      message: error?.message || "Could not remove image"
    });
  }
};

export { createCrop, deleteCrop, deleteCropImage, getCrops, updateCrop, uploadCropImage };
