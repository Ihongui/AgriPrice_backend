import "dotenv/config";
import app from "./src/app.js";
import connectDB from "./src/config/db.js";
import { startPriceUpdateJob } from "./src/jobs/priceUpdate.js";

const port = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  startPriceUpdateJob();

  app.listen(port, () => {
    console.log(`AgriPrice GH API running on port ${port}`);
  });
};

startServer().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});

