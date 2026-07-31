import cron from "node-cron";
import Crop from "../models/Crop.js";
import Market from "../models/Market.js";
import Price from "../models/Price.js";
import { getLatestPopulatedPrices } from "../utils/priceSnapshot.js";

const markStalePrices = async () => {
  const latestPrices = await getLatestPopulatedPrices();
  const threshold = new Date(Date.now() - 48 * 60 * 60 * 1000);
  const staleEntries = latestPrices.filter((entry) => new Date(entry.dateRecorded) < threshold);

  if (staleEntries.length) {
    await Price.updateMany({ _id: { $in: staleEntries.map((entry) => entry._id) } }, { isStale: true });

    const summary = staleEntries
      .map((entry) => `${entry.cropId?.name} @ ${entry.marketId?.name} last updated ${entry.dateRecorded}`)
      .join("; ");

    console.warn(`Stale prices detected for ${staleEntries.length} records. Alert: ${summary}`);
  }

  return staleEntries;
};

const seedStaleFlagsIfEmpty = async () => {
  const [cropCount, marketCount, priceCount] = await Promise.all([
    Crop.countDocuments(),
    Market.countDocuments(),
    Price.countDocuments()
  ]);

  if (!cropCount || !marketCount || !priceCount) {
    return [];
  }

  return markStalePrices();
};

const startPriceUpdateJob = () => {
  if (process.env.DISABLE_CRON === "true") {
    return null;
  }

  seedStaleFlagsIfEmpty().catch((error) => {
    console.error("Initial stale price check failed", error);
  });

  return cron.schedule(
    "0 6 * * *",
    () => {
      markStalePrices().catch((error) => {
        console.error("Scheduled stale price check failed", error);
      });
    },
    {
      timezone: "Africa/Lagos"
    }
  );
};

export { markStalePrices, startPriceUpdateJob };
