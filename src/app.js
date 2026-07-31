import cors from "cors";
import express from "express";
import morgan from "morgan";
import adminRoutes from "./routes/adminRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import chatbotRoutes from "./routes/chatbotRoutes.js";
import cropRoutes from "./routes/cropRoutes.js";
import marketRoutes from "./routes/marketRoutes.js";
import priceRoutes from "./routes/priceRoutes.js";
import smsRoutes from "./routes/smsRoutes.js";
import ussdRoutes from "./routes/ussdRoutes.js";
import { errorHandler, notFound } from "./middleware/errorMiddleware.js";

const app = express();

const allowedOrigins = (
  process.env.FRONTEND_URL ||
  "http://localhost:5173,https://transcendent-liger-f7f44d.netlify.app"
)
  .split(",")
  .map((origin) => origin.trim());

const allowAllOrigins = allowedOrigins.includes("*");

const corsConfig = {
  origin(origin, callback) {
    if (allowAllOrigins || !origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    const corsError = new Error("CORS blocked for this origin");
    corsError.statusCode = 403;
    return callback(corsError);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsConfig));
app.options("*", cors(corsConfig));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

app.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "AgriPrice GH API is operational",
  });
});

app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "AgriPrice GH backend is healthy",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/chatbot", chatbotRoutes);
app.use("/api/crops", cropRoutes);
app.use("/api/markets", marketRoutes);
app.use("/api/prices", priceRoutes);
app.use("/api/sms", smsRoutes);
app.use("/api/ussd", ussdRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
