import Crop from "../models/Crop.js";
import Market from "../models/Market.js";
import Price from "../models/Price.js";
import { calculateTrend, selectLatestPrices } from "../utils/priceHelpers.js";

const getCurrentPrices = async (_req, res) => {
  const prices = await Price.find()
    .sort({ dateRecorded: -1 })
    .populate("cropId")
    .populate("marketId");

  const latestPrices = selectLatestPrices(prices);

  res.json({ success: true, data: latestPrices });
};

const getLatestPrices = async (_req, res) => {
  const prices = await Price.find()
    .sort({ dateRecorded: -1, createdAt: -1 })
    .populate("cropId")
    .populate("marketId");

  const latestPrices = selectLatestPrices(prices).sort((a, b) => {
    const cropCompare = String(a.cropId?.name || "").localeCompare(String(b.cropId?.name || ""));
    if (cropCompare !== 0) return cropCompare;
    return String(a.marketId?.name || "").localeCompare(String(b.marketId?.name || ""));
  });

  res.json({ success: true, data: latestPrices });
};

const getComparePrices = async (req, res) => {
  const cropQuery = req.query.crop;

  if (!cropQuery) {
    return res.status(400).json({ success: false, message: "crop query is required" });
  }

  const crop = await Crop.findOne({
    name: { $regex: new RegExp(`^${cropQuery}$`, "i") }
  });

  if (!crop) {
    return res.status(404).json({ success: false, message: "Crop not found" });
  }

  const prices = await Price.find({ cropId: crop._id })
    .sort({ dateRecorded: -1 })
    .populate("cropId")
    .populate("marketId");

  const latestPrices = selectLatestPrices(prices).sort((a, b) => b.price - a.price);

  return res.json({
    success: true,
    crop,
    data: latestPrices
  });
};

const getPriceHistory = async (_req, res) => {
  const prices = await Price.find()
    .sort({ dateRecorded: -1 })
    .populate("cropId")
    .populate("marketId");

  res.json({ success: true, data: prices });
};

const getPriceTrends = async (req, res) => {
  const crop = await Crop.findById(req.params.cropId);

  if (!crop) {
    return res.status(404).json({ success: false, message: "Crop not found" });
  }

  const since = new Date();
  since.setMonth(since.getMonth() - 6);

  const rows = await Price.aggregate([
    {
      $match: {
        cropId: crop._id,
        dateRecorded: { $gte: since }
      }
    },
    {
      $group: {
        _id: {
          isoWeekYear: { $isoWeekYear: "$dateRecorded" },
          isoWeek: { $isoWeek: "$dateRecorded" }
        },
        averagePrice: { $avg: "$price" },
        count: { $sum: 1 },
        weekStart: { $min: "$dateRecorded" }
      }
    },
    { $sort: { "_id.isoWeekYear": 1, "_id.isoWeek": 1 } }
  ]);

  return res.json({
    success: true,
    crop,
    data: rows.map((row) => ({
      week: `${row._id.isoWeekYear}-W${String(row._id.isoWeek).padStart(2, "0")}`,
      weekStart: row.weekStart,
      averagePrice: Number(row.averagePrice.toFixed(2)),
      count: row.count
    }))
  });
};

const savePriceForDay = async ({ cropId, marketId, price, dateRecorded, source, notes, userId }) => {
  const recordedDate = dateRecorded ? new Date(dateRecorded) : new Date();
  const dayStart = new Date(recordedDate);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(recordedDate);
  dayEnd.setHours(23, 59, 59, 999);

  const previousEntry = await Price.findOne({
    cropId,
    marketId,
    dateRecorded: { $lt: dayStart }
  }).sort({ dateRecorded: -1 });

  const { trend, changePercent } = calculateTrend(Number(price), previousEntry?.price);

  const existingSameDay = await Price.findOne({
    cropId,
    marketId,
    dateRecorded: {
      $gte: dayStart,
      $lte: dayEnd
    }
  });

  if (existingSameDay) {
    existingSameDay.price = Number(price);
    existingSameDay.dateRecorded = recordedDate;
    existingSameDay.trend = trend;
    existingSameDay.changePercent = changePercent;
    existingSameDay.source = source || existingSameDay.source || "manual";
    existingSameDay.notes = notes ?? existingSameDay.notes;
    existingSameDay.recordedBy = userId || existingSameDay.recordedBy;
    existingSameDay.isStale = false;
    return { doc: await existingSameDay.save(), created: false };
  }

  const doc = await Price.create({
    cropId,
    marketId,
    price: Number(price),
    dateRecorded: recordedDate,
    trend,
    changePercent,
    source: source || "manual",
    notes: notes || "",
    recordedBy: userId,
    isStale: false
  });

  return { doc, created: true };
};

const createOrUpdatePrice = async (req, res) => {
  const { cropId, marketId, price, dateRecorded, source, notes } = req.body;

  if (!cropId || !marketId || price === undefined) {
    return res
      .status(400)
      .json({ success: false, message: "cropId, marketId and price are required" });
  }

  const [crop, market] = await Promise.all([Crop.findById(cropId), Market.findById(marketId)]);

  if (!crop || !market) {
    return res.status(404).json({ success: false, message: "Crop or market not found" });
  }

  const { doc, created } = await savePriceForDay({
    cropId,
    marketId,
    price,
    dateRecorded,
    source,
    notes,
    userId: req.user?._id
  });

  const populated = await doc.populate("cropId marketId");
  return res.status(created ? 201 : 200).json({ success: true, data: populated });
};

const bulkCreateOrUpdatePrices = async (req, res) => {
  const { cropId, prices, dateRecorded, source } = req.body;
  const crop = await Crop.findById(cropId);

  if (!crop) {
    return res.status(404).json({ success: false, message: "Crop not found" });
  }

  const marketIds = prices.map((entry) => entry.marketId);
  const marketCount = await Market.countDocuments({ _id: { $in: marketIds } });

  if (marketCount !== marketIds.length) {
    return res.status(404).json({ success: false, message: "One or more markets were not found" });
  }

  const saved = await Promise.all(
    prices.map((entry) =>
      savePriceForDay({
        cropId,
        marketId: entry.marketId,
        price: entry.price,
        dateRecorded,
        source,
        notes: entry.notes,
        userId: req.user?._id
      })
    )
  );

  const populated = await Promise.all(saved.map(({ doc }) => doc.populate("cropId marketId")));
  return res.status(saved.some((entry) => entry.created) ? 201 : 200).json({ success: true, data: populated });
};

const updatePrice = async (req, res) => {
  const priceDoc = await Price.findById(req.params.id);

  if (!priceDoc) {
    return res.status(404).json({ success: false, message: "Price not found" });
  }

  const nextPrice = req.body.price ?? priceDoc.price;
  const previousEntry = await Price.findOne({
    cropId: priceDoc.cropId,
    marketId: priceDoc.marketId,
    dateRecorded: { $lt: priceDoc.dateRecorded },
    _id: { $ne: priceDoc._id }
  }).sort({ dateRecorded: -1 });

  const { trend, changePercent } = calculateTrend(Number(nextPrice), previousEntry?.price);

  priceDoc.price = Number(nextPrice);
  priceDoc.dateRecorded = req.body.dateRecorded ? new Date(req.body.dateRecorded) : priceDoc.dateRecorded;
  priceDoc.trend = trend;
  priceDoc.changePercent = changePercent;
  priceDoc.source = req.body.source || priceDoc.source;
  priceDoc.notes = req.body.notes ?? priceDoc.notes;
  priceDoc.recordedBy = req.user?._id || priceDoc.recordedBy;
  priceDoc.isStale = false;

  await priceDoc.save();
  const populated = await priceDoc.populate("cropId marketId");

  return res.json({ success: true, data: populated });
};

const deletePrice = async (req, res) => {
  const deleted = await Price.findByIdAndDelete(req.params.id);

  if (!deleted) {
    return res.status(404).json({ success: false, message: "Price not found" });
  }

  return res.json({ success: true, message: "Price deleted" });
};

export {
  bulkCreateOrUpdatePrices,
  createOrUpdatePrice,
  deletePrice,
  getComparePrices,
  getCurrentPrices,
  getLatestPrices,
  getPriceHistory,
  getPriceTrends,
  updatePrice
};

