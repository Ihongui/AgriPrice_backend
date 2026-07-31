import bcrypt from "bcryptjs";
import "dotenv/config";
import mongoose from "mongoose";
import Crop from "../src/models/Crop.js";
import Market from "../src/models/Market.js";
import Price from "../src/models/Price.js";
import User from "../src/models/User.js";
import { normalizeCropCategory } from "../src/utils/cropCategories.js";

const dbName = process.env.MONGODB_DB_NAME || "agriprice";
const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;

if (!mongoUri) {
  throw new Error("MONGODB_URI (or MONGO_URI) is not configured");
}

const ensureAdmin = async () => {
  const existingAdmin = await User.findOne({ username: "admin" });

  if (existingAdmin) {
    return { created: false, user: existingAdmin };
  }

  const password = await bcrypt.hash("admin12345", 12);
  const user = await User.create({
    username: "admin",
    password,
    role: "admin",
    verified: true
  });

  return { created: true, user };
};

const normalizeText = (value = "") => String(value).trim().toLowerCase();

const backfillExistingClusterData = async () => {
  let cropsUpdated = 0;
  let marketsUpdated = 0;
  let pricesUpdated = 0;

  const crops = await Crop.find();
  for (const crop of crops) {
    let changed = false;
    const normalizedCategory = normalizeCropCategory(crop.category);

    if (normalizedCategory !== crop.category) {
      crop.category = normalizedCategory;
      changed = true;
    }

    if (crop.active !== undefined && crop.isActive !== crop.active) {
      crop.isActive = crop.active;
      changed = true;
    }

    if (changed) {
      await crop.save();
      cropsUpdated += 1;
    }
  }

  const markets = await Market.find();
  for (const market of markets) {
    let changed = false;

    if (market.active !== undefined && market.isActive !== market.active) {
      market.isActive = market.active;
      changed = true;
    }

    if (!market.city && market.location) {
      market.city = market.location;
      changed = true;
    }

    if (!market.location && market.city) {
      market.location = market.city;
      changed = true;
    }

    if (changed) {
      await market.save();
      marketsUpdated += 1;
    }
  }

  const refreshedCrops = await Crop.find();
  const refreshedMarkets = await Market.find();
  const cropByName = new Map(refreshedCrops.map((crop) => [normalizeText(crop.name), crop]));
  const marketKeys = new Map();

  refreshedMarkets.forEach((market) => {
    [market.name, market.city, market.location].filter(Boolean).forEach((key) => {
      marketKeys.set(normalizeText(key), market);
    });
  });

  const prices = await Price.find().lean();
  for (const price of prices) {
    const set = {};
    const unset = {};

    if (!price.cropId && price.crop) {
      const crop = cropByName.get(normalizeText(price.crop));
      if (crop) {
        set.cropId = crop._id;
      }
    }

    if (!price.marketId) {
      const market =
        marketKeys.get(normalizeText(price.market)) ||
        marketKeys.get(normalizeText(price.city));
      if (market) {
        set.marketId = market._id;
      }
    }

    if (price.date && (!price.dateRecorded || Number(price.dateRecorded) !== Number(price.date))) {
      set.dateRecorded = price.date;
    }

    if (!price.source) {
      set.source = "manual";
    }

    if (price.recordedBy && !mongoose.isValidObjectId(price.recordedBy)) {
      set.recordedByName = String(price.recordedBy);
      unset.recordedBy = "";
    }

    if (Object.keys(set).length || Object.keys(unset).length) {
      await Price.updateOne(
        { _id: price._id },
        {
          ...(Object.keys(set).length ? { $set: set } : {}),
          ...(Object.keys(unset).length ? { $unset: unset } : {})
        },
        { runValidators: false }
      );
      pricesUpdated += 1;
    }
  }

  return { cropsUpdated, marketsUpdated, pricesUpdated };
};

const run = async () => {
  await mongoose.connect(mongoUri, { dbName });

  const backfill = await backfillExistingClusterData();

  const [cropCount, marketCount, priceCount, userCount] = await Promise.all([
    Crop.countDocuments(),
    Market.countDocuments(),
    Price.countDocuments(),
    User.countDocuments()
  ]);

  const admin = await ensureAdmin();

  console.log(`Connected to Cluster0 database: ${dbName}`);
  console.log(`Crops: ${cropCount}`);
  console.log(`Markets: ${marketCount}`);
  console.log(`Prices: ${priceCount}`);
  console.log(`Users before admin check: ${userCount}`);
  console.log(admin.created ? "Admin user created: admin / admin12345" : "Admin user already exists");
  console.log(
    `Backfilled: ${backfill.cropsUpdated} crops, ${backfill.marketsUpdated} markets, ${backfill.pricesUpdated} prices`
  );

  if (cropCount === 0 || marketCount === 0 || priceCount === 0) {
    console.warn("Existing Cluster0 data is incomplete. No crop/market/price records were overwritten.");
  }
};

run()
  .catch((error) => {
    console.error("Seed verification failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
