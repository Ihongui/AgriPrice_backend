import mongoose from "mongoose";
import { cropCategoryEnum, normalizeCropCategory } from "../utils/cropCategories.js";

const cropSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    category: {
      type: String,
      required: true,
      trim: true,
      enum: cropCategoryEnum,
      set: normalizeCropCategory
    },
    localName: {
      type: String,
      trim: true,
      default: ""
    },
    emoji: {
      type: String,
      trim: true,
      default: "🌾"
    },
    imageUrl: {
      type: String,
      default: ""
    },
    imagePublicId: {
      type: String,
      default: ""
    },
    unit: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    season: {
      type: String,
      trim: true,
      default: ""
    },
    isActive: {
      type: Boolean,
      default: true
    },
    active: {
      type: Boolean
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },
  { timestamps: true }
);

cropSchema.pre("validate", function normalizeLegacyFields(next) {
  this.category = normalizeCropCategory(this.category);
  if (this.active !== undefined && this.isActive === undefined) {
    this.isActive = this.active;
  }
  next();
});

export default mongoose.model("Crop", cropSchema);
