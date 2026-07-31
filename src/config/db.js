import mongoose from "mongoose";

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  const dbName = process.env.MONGODB_DB_NAME || "agriprice";

  if (!mongoUri) {
    throw new Error("MONGODB_URI (or MONGO_URI) is not configured");
  }

  await mongoose.connect(mongoUri, { dbName });
  console.log(`MongoDB connected: ${dbName}`);
};

export default connectDB;
