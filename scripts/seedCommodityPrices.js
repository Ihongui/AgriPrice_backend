import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import Crop from "../src/models/Crop.js";
import Market from "../src/models/Market.js";
import Price from "../src/models/Price.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const csvPath = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.resolve(__dirname, "../../Commodity prices _04.11.25.csv");

const dbName = process.env.MONGODB_DB_NAME || "agriprice";
const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;

if (!mongoUri) {
  throw new Error("MONGODB_URI (or MONGO_URI) is not configured");
}

const SOURCE_VALUES = new Set(["retail", "wholesale"]);
const DEFAULT_IMAGE_URL =
  "https://images.unsplash.com/photo-1471193945509-9ad0617afabf?auto=format&fit=crop&w=1200&q=80";

const titleCase = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => {
      if (/^(or|and|of|non)$/i.test(word)) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");

const cleanText = (value) => String(value || "").replace(/\s+/g, " ").trim();

const cleanMarketBaseName = (value, district) => {
  const raw = cleanText(value).replace(/[,.]+$/g, "");

  if (!raw || /^\d+(\.\d+)?$/.test(raw)) {
    return `${titleCase(district)} Market`;
  }

  const normalized = raw.toLowerCase().replace(/\s+/g, " ");
  const knownNames = {
    agbogbloshie: "Agbogbloshie Market",
    "agbogbloshie market": "Agbogbloshie Market",
    "agatha market": "Agatha Market",
    "bolga": "Bolgatanga Market",
    "bolga market": "Bolgatanga Market",
    "bolgatanga": "Bolgatanga Market",
    "bolgatanga market": "Bolgatanga Market",
    "bolgatanga municipal market": "Bolgatanga Municipal Market",
    "central marketm": "Central Market",
    "kintampo.": "Kintampo Market",
    "koforidua central": "Koforidua Central Market",
    "koforidua central market": "Koforidua Central Market",
    "nana bosomah": "Nana Bosomah Market",
    "nana bosomahɔ": "Nana Bosomah Market",
    nkwanta: "Nkwanta Market",
    techiman: "Techiman Market",
    "tema community one main market": "Tema Community One Main Market",
    "tuesday market": "Tuesday Market",
    "wa market": "Wa Market",
  };

  return knownNames[normalized] || titleCase(raw);
};

const parseCsvLine = (line) => {
  const fields = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const nextChar = line[index + 1];

    if (char === '"' && inQuotes && nextChar === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      fields.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  fields.push(current);
  return fields;
};

const parseMarketDay = (value) => {
  const [month, day, year] = cleanText(value).split("/").map(Number);

  if (!month || !day || !year) {
    return null;
  }

  return new Date(Date.UTC(year, month - 1, day));
};

const inferCategory = (name) => {
  const value = name.toLowerCase();

  if (/(maize|millet|rice|sorghum)/.test(value)) return "Cereals";
  if (/(cassava|cocoyam|yam|potato|gari|kokonte|plantain)/.test(value)) return "Roots & Tubers";
  if (/(tomato|pepper|onion|okro|garden egg|lettuce|cabbage|carrot|nkontomire|ademe|ayoyo|alefu|amaranthus|ginger)/.test(value)) {
    return "Vegetables";
  }
  if (/(bean|cowpea|soya|groundnut|bambara|agushi|melon seeds)/.test(value)) return "Legumes";
  if (/(banana|mango|orange|pawpaw|pineapple|watermelon|avocado|coconut|palm fruit|tiger nut)/.test(value)) {
    return "Fruits";
  }

  return "Other";
};

const parseCommodityRows = (content) => {
  const lines = content.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim());
  const [headerLine, ...dataLines] = lines;
  const headers = parseCsvLine(headerLine);
  const rows = [];
  const skipped = [];

  dataLines.forEach((line, index) => {
    const fields = parseCsvLine(line);
    const sourceIndex = fields.findIndex((field, fieldIndex) => fieldIndex >= 4 && SOURCE_VALUES.has(cleanText(field).toLowerCase()));

    if (sourceIndex < 4 || fields.length < sourceIndex + 9) {
      skipped.push({ line: index + 2, reason: "Could not find source/type layout" });
      return;
    }

    const row = {
      region: cleanText(fields[0]),
      district: cleanText(fields[1]),
      date: cleanText(fields[2]),
      Market: cleanText(fields.slice(3, sourceIndex).join(",")),
      source: cleanText(fields[sourceIndex]),
      _geolocation: cleanText(fields[sourceIndex + 1]),
      commodity: cleanText(fields[sourceIndex + 2]),
      Price: cleanText(fields[sourceIndex + 3]),
      market_day: cleanText(fields[sourceIndex + 4]),
      Year: cleanText(fields[sourceIndex + 5]),
      month: cleanText(fields[sourceIndex + 6]),
      week: cleanText(fields[sourceIndex + 7]),
      Type: cleanText(fields[sourceIndex + 8]),
    };

    const price = Number(row.Price);
    const marketDay = parseMarketDay(row.market_day);

    if (!row.commodity || !Number.isFinite(price) || price < 0 || !marketDay) {
      skipped.push({ line: index + 2, reason: "Missing commodity, price, or market_day" });
      return;
    }

    rows.push({
      ...row,
      cropName: titleCase(row.commodity),
      cropCategory: inferCategory(row.commodity),
      price,
      marketDay,
      marketBaseName: cleanMarketBaseName(row.Market, row.district),
    });
  });

  return { headers, rows, skipped };
};

const buildMarketNames = (rows) => {
  const baseToKeys = new Map();

  rows.forEach((row) => {
    const key = `${row.marketBaseName.toLowerCase()}|${row.region.toLowerCase()}|${row.district.toLowerCase()}`;
    const keys = baseToKeys.get(row.marketBaseName) || new Set();
    keys.add(key);
    baseToKeys.set(row.marketBaseName, keys);
  });

  rows.forEach((row) => {
    const keys = baseToKeys.get(row.marketBaseName);
    row.marketName = keys.size > 1 ? `${row.marketBaseName} - ${titleCase(row.district)}` : row.marketBaseName;
  });
};

const calculateTrend = (currentPrice, previousPrice) => {
  if (!previousPrice || previousPrice === 0) {
    return { trend: "stable", changePercent: 0 };
  }

  const roundedChange = Number((((currentPrice - previousPrice) / previousPrice) * 100).toFixed(1));

  if (roundedChange > 0) return { trend: "up", changePercent: roundedChange };
  if (roundedChange < 0) return { trend: "down", changePercent: Math.abs(roundedChange) };
  return { trend: "stable", changePercent: 0 };
};

const createNotes = (row) =>
  [
    "Imported from Commodity prices _04.11.25.csv",
    `CSV date=${row.date}`,
    `market_day=${row.market_day}`,
    `district=${row.district}`,
    `source=${row.source}`,
    `type=${row.Type}`,
    `year=${row.Year}`,
    `month=${row.month}`,
    `week=${row.week}`,
    row.Market && row.Market !== row.marketBaseName ? `raw_market=${row.Market}` : "",
  ]
    .filter(Boolean)
    .join("; ");

const run = async () => {
  const content = fs.readFileSync(csvPath, "utf8");
  const { headers, rows, skipped } = parseCommodityRows(content);
  buildMarketNames(rows);

  const uniqueCrops = new Map();
  const uniqueMarkets = new Map();

  rows.forEach((row) => {
    if (!uniqueCrops.has(row.cropName.toLowerCase())) {
      uniqueCrops.set(row.cropName.toLowerCase(), {
        name: row.cropName,
        category: row.cropCategory,
        unit: "kg",
        description: `Market price record for ${row.cropName} from Ghana commodity price data.`,
        imageUrl: DEFAULT_IMAGE_URL,
        isActive: true,
      });
    }

    if (!uniqueMarkets.has(row.marketName.toLowerCase())) {
      uniqueMarkets.set(row.marketName.toLowerCase(), {
        name: row.marketName,
        region: row.region || "Unknown",
        city: row.district,
        location: row.district,
        type: row.source.toLowerCase() === "wholesale" ? "Wholesale" : "Regional Hub",
        isActive: true,
      });
    }
  });

  await mongoose.connect(mongoUri, { dbName });

  const cropByName = new Map();
  const marketByName = new Map();
  let cropsUpserted = 0;
  let marketsUpserted = 0;
  let pricesUpserted = 0;

  for (const crop of uniqueCrops.values()) {
    const doc = await Crop.findOneAndUpdate(
      { name: crop.name },
      { $set: crop },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
    );
    cropByName.set(doc.name.toLowerCase(), doc);
    cropsUpserted += 1;
  }

  for (const market of uniqueMarkets.values()) {
    const doc = await Market.findOneAndUpdate(
      { name: market.name },
      { $set: market },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
    );
    marketByName.set(doc.name.toLowerCase(), doc);
    marketsUpserted += 1;
  }

  const sortedRows = [...rows].sort((a, b) => {
    const cropCompare = a.cropName.localeCompare(b.cropName);
    if (cropCompare !== 0) return cropCompare;
    const marketCompare = a.marketName.localeCompare(b.marketName);
    if (marketCompare !== 0) return marketCompare;
    return a.marketDay - b.marketDay;
  });
  const previousPriceByPair = new Map();

  const priceOperations = [];

  for (const row of sortedRows) {
    const crop = cropByName.get(row.cropName.toLowerCase());
    const market = marketByName.get(row.marketName.toLowerCase());
    const pairKey = `${crop._id}-${market._id}`;
    const { trend, changePercent } = calculateTrend(row.price, previousPriceByPair.get(pairKey));
    const notes = createNotes(row);

    priceOperations.push({
      updateOne: {
        filter: {
          cropId: crop._id,
          marketId: market._id,
          dateRecorded: row.marketDay,
          price: row.price,
          notes,
        },
        update: {
          $set: {
            cropId: crop._id,
            crop: crop.name,
            marketId: market._id,
            market: market.name,
            city: market.city,
            unit: crop.unit,
            price: row.price,
            dateRecorded: row.marketDay,
            date: row.marketDay,
            trend,
            changePercent,
            source: "api",
            notes,
            isVerified: true,
            isStale: false,
          },
        },
        upsert: true,
      },
    });

    previousPriceByPair.set(pairKey, row.price);
    pricesUpserted += 1;
  }

  for (let index = 0; index < priceOperations.length; index += 500) {
    await Price.bulkWrite(priceOperations.slice(index, index + 500), { ordered: true });
  }

  const importedPriceCount = await Price.countDocuments({
    notes: /Imported from Commodity prices _04\.11\.25\.csv/,
  });
  const stalePriceDelete = await Price.deleteMany({
    notes: { $not: /Imported from Commodity prices _04\.11\.25\.csv/ },
  });
  const pricedCropIds = await Price.distinct("cropId");
  const pricedMarketIds = await Price.distinct("marketId");
  const orphanCropDelete = await Crop.deleteMany({ _id: { $nin: pricedCropIds } });
  const orphanMarketDelete = await Market.deleteMany({ _id: { $nin: pricedMarketIds } });
  const [cropCount, marketCount, priceCount] = await Promise.all([
    Crop.countDocuments(),
    Market.countDocuments(),
    Price.countDocuments(),
  ]);

  console.log(`CSV: ${path.basename(csvPath)}`);
  console.log(`Headers: ${headers.join(", ")}`);
  console.log(`Parsed rows: ${rows.length}`);
  console.log(`Skipped rows: ${skipped.length}`);
  console.log(`Crops upserted: ${cropsUpserted}`);
  console.log(`Markets upserted: ${marketsUpserted}`);
  console.log(`Prices upserted: ${pricesUpserted}`);
  console.log(`Imported price documents now in DB: ${importedPriceCount}`);
  console.log(`Removed non-CSV price documents: ${stalePriceDelete.deletedCount}`);
  console.log(`Removed crops with no CSV prices: ${orphanCropDelete.deletedCount}`);
  console.log(`Removed markets with no CSV prices: ${orphanMarketDelete.deletedCount}`);
  console.log(`Database totals: ${JSON.stringify({ crops: cropCount, markets: marketCount, prices: priceCount })}`);

  if (skipped.length) {
    console.log(`Skipped samples: ${JSON.stringify(skipped.slice(0, 5))}`);
  }
};

run()
  .catch((error) => {
    console.error("Commodity CSV seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
