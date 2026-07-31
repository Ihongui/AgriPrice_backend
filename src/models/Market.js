import mongoose from "mongoose";

const marketSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    region: {
      type: String,
      required: true,
      trim: true
    },
    city: {
      type: String,
      trim: true,
      default: ""
    },
    location: {
      type: String,
      trim: true,
      default: ""
    },
    type: {
      type: String,
      enum: ["Urban", "Wholesale", "Regional Hub", "Rural"],
      default: "Urban"
    },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number }
    },
    contactPhone: {
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
    }
  },
  { timestamps: true }
);

marketSchema.pre("validate", function normalizeLegacyFields(next) {
  if (this.active !== undefined && this.isActive === undefined) {
    this.isActive = this.active;
  }
  if (!this.city && this.location) {
    this.city = this.location;
  }
  if (!this.location && this.city) {
    this.location = this.city;
  }
  next();
});

export default mongoose.model("Market", marketSchema);

