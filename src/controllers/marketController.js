import Market from "../models/Market.js";

const getMarkets = async (_req, res) => {
  const markets = await Market.find().sort({ name: 1 });
  res.json({ success: true, data: markets });
};

const createMarket = async (req, res) => {
  const payload = {
    ...req.body,
    city: req.body.city || req.body.location || "",
    location: req.body.location || req.body.city || ""
  };
  const market = await Market.create(payload);
  res.status(201).json({ success: true, data: market });
};

const updateMarket = async (req, res) => {
  const payload = {
    ...req.body,
    city: req.body.city || req.body.location || "",
    location: req.body.location || req.body.city || ""
  };
  const market = await Market.findByIdAndUpdate(req.params.id, payload, {
    new: true,
    runValidators: true
  });

  if (!market) {
    return res.status(404).json({ success: false, message: "Market not found" });
  }

  return res.json({ success: true, data: market });
};

const deleteMarket = async (req, res) => {
  const market = await Market.findByIdAndDelete(req.params.id);

  if (!market) {
    return res.status(404).json({ success: false, message: "Market not found" });
  }

  return res.json({ success: true, message: "Market deleted" });
};

export { createMarket, deleteMarket, getMarkets, updateMarket };

