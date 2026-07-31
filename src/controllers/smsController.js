import Crop from "../models/Crop.js";
import Price from "../models/Price.js";
import SmsLog from "../models/SmsLog.js";
import { selectLatestPrices } from "../utils/priceHelpers.js";

const buildHelpMessage = () =>
  "Use PRICE [CROP] [MARKET], COMPARE [CROP], BEST [CROP], or HELP. Example: PRICE MAIZE ACCRA";

const logSms = async (req, command, response) => {
  const phoneNumber = String(req.body.from || req.body.phoneNumber || req.body.phone || "unknown");

  try {
    await SmsLog.create({
      phoneNumber,
      command: command || "HELP",
      response,
      channel: "sms"
    });
  } catch (error) {
    console.error("SMS log failed", error.message);
  }
};

const sendSmsResponse = async (req, res, command, message) => {
  await logSms(req, command, message);
  return res.json({ success: true, message });
};

const getSmsLogs = async (_req, res) => {
  const logs = await SmsLog.find().sort({ createdAt: -1 }).limit(100);
  return res.json({ success: true, data: logs });
};

const incomingSms = async (req, res) => {
  const rawText = String(req.body.text || "").trim();

  if (!rawText) {
    return sendSmsResponse(req, res, "HELP", buildHelpMessage());
  }

  const parts = rawText.split(/\s+/);
  const command = parts[0].toUpperCase();

  if (command === "HELP") {
    return sendSmsResponse(req, res, command, buildHelpMessage());
  }

  if (command === "PRICE") {
    const cropName = parts[1];
    const marketName = parts.slice(2).join(" ");

    if (!cropName || !marketName) {
      return sendSmsResponse(req, res, command, buildHelpMessage());
    }

    const crop = await Crop.findOne({
      name: { $regex: new RegExp(`^${cropName}$`, "i") }
    });

    if (!crop) {
      return sendSmsResponse(req, res, command, `Crop "${cropName}" not found. ${buildHelpMessage()}`);
    }

    const prices = await Price.find({ cropId: crop._id })
      .sort({ dateRecorded: -1 })
      .populate("cropId")
      .populate("marketId");

    const latestPrices = selectLatestPrices(prices);
    const selectedMarket = latestPrices.find(
      (item) =>
        item.marketId.name.toLowerCase() === marketName.toLowerCase() ||
        item.marketId.city?.toLowerCase() === marketName.toLowerCase() ||
        item.marketId.location?.toLowerCase() === marketName.toLowerCase()
    );

    if (!selectedMarket) {
      return sendSmsResponse(req, res, command, `No current price for ${crop.name} in ${marketName}.`);
    }

    const bestMarket = [...latestPrices].sort((a, b) => b.price - a.price)[0];

    return sendSmsResponse(
      req,
      res,
      command,
      `${crop.name} in ${selectedMarket.marketId.name}: GHS ${selectedMarket.price}/${crop.unit}. Best market today: ${bestMarket.marketId.name} GHS ${bestMarket.price}. Powered by AgriPrice GH`
    );
  }

  if (command === "COMPARE" || command === "BEST") {
    const cropName = parts.slice(1).join(" ");

    if (!cropName) {
      return sendSmsResponse(req, res, command, buildHelpMessage());
    }

    const crop = await Crop.findOne({
      name: { $regex: new RegExp(`^${cropName}$`, "i") }
    });

    if (!crop) {
      return sendSmsResponse(req, res, command, `Crop "${cropName}" not found.`);
    }

    const prices = await Price.find({ cropId: crop._id })
      .sort({ dateRecorded: -1 })
      .populate("marketId");
    const latestPrices = selectLatestPrices(prices).sort((a, b) => b.price - a.price);

    if (!latestPrices.length) {
      return sendSmsResponse(req, res, command, `No current price data for ${crop.name}.`);
    }

    if (command === "BEST") {
      const best = latestPrices[0];
      return sendSmsResponse(
        req,
        res,
        command,
        `Best ${crop.name} market today: ${best.marketId.name} at GHS ${best.price}/${crop.unit}.`
      );
    }

    const summary = latestPrices
      .map((item) => `${item.marketId.name}: GHS ${item.price}`)
      .join(" | ");

    return sendSmsResponse(req, res, command, `${crop.name} prices: ${summary}`);
  }

  return sendSmsResponse(req, res, command, buildHelpMessage());
};

export { getSmsLogs, incomingSms };

