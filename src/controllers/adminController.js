import Crop from "../models/Crop.js";
import Market from "../models/Market.js";
import Price from "../models/Price.js";
import SmsLog from "../models/SmsLog.js";

const getAdminStats = async (_req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [
    totalCrops,
    totalMarkets,
    pricesUpdatedToday,
    smsQueries24h,
    ussdSessions24h,
    recentActivity,
  ] = await Promise.all([
    Crop.countDocuments({}),
    Market.countDocuments({}),
    Price.countDocuments({ dateRecorded: { $gte: today } }),
    SmsLog.countDocuments({ channel: "sms", createdAt: { $gte: last24Hours } }),
    SmsLog.countDocuments({
      channel: "ussd",
      createdAt: { $gte: last24Hours },
    }),
    SmsLog.find().sort({ createdAt: -1 }).limit(10),
  ]);

  res.json({
    success: true,
    data: {
      totalCrops,
      totalMarkets,
      pricesUpdatedToday,
      smsQueries24h,
      ussdSessions24h,
      recentActivity,
    },
  });
};

export { getAdminStats };
