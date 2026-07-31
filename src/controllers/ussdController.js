import Crop from "../models/Crop.js";
import Price from "../models/Price.js";
import SmsLog from "../models/SmsLog.js";
import { selectLatestPrices } from "../utils/priceHelpers.js";

const sendUssdResponse = async (req, res, response) => {
  try {
    await SmsLog.create({
      phoneNumber: String(req.body.phoneNumber || req.body.from || "unknown"),
      command: String(req.body.text || "MAIN_MENU"),
      response,
      channel: "ussd",
      sessionId: String(req.body.sessionId || "")
    });
  } catch (error) {
    console.error("USSD log failed", error.message);
  }

  return res.send(response);
};

const ussdSession = async (req, res) => {
  const text = String(req.body.text || "");
  const levels = text ? text.split("*") : [];

  res.set("Content-Type", "text/plain");

  if (!text) {
    return sendUssdResponse(req, res, "CON AgriPrice GH\n1. Check Prices\n2. Compare Markets\n3. SMS Instructions\n0. Exit");
  }

  if (levels[0] === "0") {
    return sendUssdResponse(req, res, "END Thanks for using AgriPrice GH");
  }

  if (levels[0] === "3") {
    return sendUssdResponse(req, res, "END SMS PRICE <CROP> <MARKET>, COMPARE <CROP>, BEST <CROP>, or HELP.");
  }

  const crops = await Crop.find().sort({ name: 1 });

  if ((levels[0] === "1" || levels[0] === "2") && levels.length === 1) {
    const menu = crops.map((crop, index) => `${index + 1}. ${crop.name}`).join("\n");
    return sendUssdResponse(req, res, `CON Select Crop\n${menu}`);
  }

  const cropIndex = Number(levels[1]) - 1;
  const crop = crops[cropIndex];

  if (!crop) {
    return sendUssdResponse(req, res, "END Invalid crop selection");
  }

  const prices = await Price.find({ cropId: crop._id })
    .sort({ dateRecorded: -1 })
    .populate("marketId");
  const latestPrices = selectLatestPrices(prices).sort((a, b) => b.price - a.price);

  if (!latestPrices.length) {
    return sendUssdResponse(req, res, `END No current prices for ${crop.name}`);
  }

  const lines = latestPrices.map((item, index) => {
    const marker = index === 0 ? " ✓" : "";
    return `${item.marketId.name}: GHS ${item.price}/${crop.unit}${marker}`;
  });

  return sendUssdResponse(req, res, `END ${crop.name} prices\n${lines.join("\n")}`);
};

export { ussdSession };

