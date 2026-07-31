import Crop from "../models/Crop.js";
import Price from "../models/Price.js";
import { selectLatestPrices } from "./priceHelpers.js";

const getLatestPopulatedPrices = async (filter = {}) => {
  const docs = await Price.find(filter)
    .sort({ dateRecorded: -1, createdAt: -1 })
    .populate("cropId")
    .populate("marketId")
    .populate("recordedBy", "username role");

  return selectLatestPrices(docs);
};

const getPriceSnapshot = async () => {
  const crops = await Crop.find({ isActive: { $ne: false } }).sort({ name: 1 });
  const latestPrices = await getLatestPopulatedPrices();

  return crops.map((crop) => {
    const cropPrices = latestPrices
      .filter((entry) => String(entry.cropId?._id || entry.cropId) === String(crop._id))
      .sort((a, b) => b.price - a.price);

    return {
      crop: {
        id: crop._id,
        name: crop.name,
        localName: crop.localName,
        unit: crop.unit,
        season: crop.season
      },
      prices: cropPrices.map((entry) => ({
        market: entry.marketId?.name,
        city: entry.marketId?.city,
        region: entry.marketId?.region,
        price: entry.price,
        trend: entry.trend,
        lastUpdated: entry.dateRecorded
      }))
    };
  });
};

export { getLatestPopulatedPrices, getPriceSnapshot };
