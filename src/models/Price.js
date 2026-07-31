import mongoose from "mongoose";

const priceSchema = new mongoose.Schema(
  {
    cropId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Crop",
      required: false
    },
    crop: {
      type: String,
      trim: true,
      default: ""
    },
    marketId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Market",
      required: false
    },
    market: {
      type: String,
      trim: true,
      default: ""
    },
    city: {
      type: String,
      trim: true,
      default: ""
    },
    unit: {
      type: String,
      trim: true,
      default: ""
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    dateRecorded: {
      type: Date,
      required: true,
      default: Date.now
    },
    date: {
      type: Date
    },
    trend: {
      type: String,
      enum: ["up", "down", "stable"],
      default: "stable"
    },
    changePercent: {
      type: Number,
      default: 0
    },
    source: {
      type: String,
      enum: ["manual", "sms", "ussd", "api"],
      default: "manual"
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    recordedByName: {
      type: String,
      trim: true,
      default: ""
    },
    isVerified: {
      type: Boolean,
      default: true
    },
    isStale: {
      type: Boolean,
      default: false
    },
    notes: {
      type: String,
      trim: true,
      default: ""
    }
  },
  { timestamps: true }
);

priceSchema.index({ cropId: 1, marketId: 1, dateRecorded: -1 });

export default mongoose.model("Price", priceSchema);

