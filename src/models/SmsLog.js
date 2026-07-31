import mongoose from "mongoose";

const smsLogSchema = new mongoose.Schema(
  {
    phoneNumber: {
      type: String,
      required: true,
      trim: true
    },
    command: {
      type: String,
      required: true,
      trim: true
    },
    response: {
      type: String,
      required: true,
      trim: true
    },
    channel: {
      type: String,
      enum: ["sms", "ussd"],
      required: true
    },
    sessionId: {
      type: String,
      trim: true,
      default: ""
    }
  },
  { timestamps: true }
);

smsLogSchema.index({ channel: 1, createdAt: -1 });
smsLogSchema.index({ phoneNumber: 1, createdAt: -1 });

export default mongoose.model("SmsLog", smsLogSchema);
