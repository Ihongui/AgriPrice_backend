import Crop from "../models/Crop.js";
import Price from "../models/Price.js";
import { selectLatestPrices } from "../utils/priceHelpers.js";

const populatePrice = (query) => query.populate("cropId").populate("marketId");

const buildPricesContext = async () => {
  const raw = await populatePrice(Price.find().sort({ dateRecorded: -1 }));
  const latest = selectLatestPrices(raw);
  const lines = latest
    .filter((row) => row.cropId && row.marketId)
    .map(
      (row) =>
        `${row.cropId.name} @ ${row.marketId.name}: GHS ${row.price} (${row.dateRecorded?.toISOString?.().slice(0, 10) || "?"})`
    )
    .slice(0, 80);

  return lines.join("\n");
};

const findCropByToken = async (token) => {
  if (!token || token.length < 2) return null;
  const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return Crop.findOne({
    name: { $regex: new RegExp(`^${escaped}$`, "i") }
  });
};

const ruleBasedReply = async (message) => {
  const normalized = message.trim().toLowerCase();
  const crops = await Crop.find({}, "name").sort({ name: 1 });
  const names = crops.map((c) => c.name);
  const escaped = names.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const pattern = escaped.length ? new RegExp(`\\b(${escaped.join("|")})\\b`, "i") : null;
  const match = pattern ? normalized.match(pattern) : null;
  const token = match ? match[1] : null;
  const crop = token ? await findCropByToken(token) : null;

  if (/best|cheap|lowest|compare|price/.test(normalized) && crop) {
    const rows = await populatePrice(Price.find({ cropId: crop._id }).sort({ dateRecorded: -1 }));
    const latest = selectLatestPrices(rows).sort((a, b) => a.price - b.price);
    if (!latest.length) {
      return `I don't have live prices for ${crop.name} yet. Try again later or open the Prices page.`;
    }

    const cheapest = latest[0];
    const priciest = latest[latest.length - 1];
    const lines = latest.map((row) => `${row.marketId.name}: GHS ${row.price}`).join(" · ");
    return `For ${crop.name}: best buyer savings (lowest) is ${cheapest.marketId.name} at GHS ${cheapest.price}. Highest quote: ${priciest.marketId.name} at GHS ${priciest.price}. All: ${lines}. (GHS.)`;
  }

  if (/sms|ussd|384/.test(normalized)) {
    return "SMS: send PRICE <CROP> <MARKET> (e.g. PRICE MAIZE ACCRA). USSD: dial your short code on the SMS/USSD page. Prices are in GHS.";
  }

  const hint = names.length ? `Try naming a crop we track: ${names.slice(0, 6).join(", ")}.` : "Open the Prices page to see crops.";
  return `Ask for “best price for <crop>” or “how do I use SMS?”. ${hint}`;
};

/**
 * Google Gemini — free tier via AI Studio API key (no paid Anthropic required).
 */
const geminiReply = async (userMessage, pricesContext) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const systemText = [
    "You are AgriBot for AgriPrice GH (Ghana). Short, helpful replies about crop prices, markets, SMS/USSD.",
    "Use Ghana Cedis (GHS). Do not invent prices — use the snapshot below when giving numbers.",
    "If snapshot is empty, say you don't have live numbers and suggest the Prices or Compare page.",
    pricesContext ? `Latest snapshot:\n${pricesContext}` : "No snapshot."
  ].join("\n");

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemText }] },
      contents: [{ role: "user", parts: [{ text: userMessage.trim() }] }],
      generationConfig: { maxOutputTokens: 512, temperature: 0.35 }
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Gemini ${response.status}: ${text.slice(0, 180)}`);
  }

  const data = await response.json();
  const parts = data?.candidates?.[0]?.content?.parts;
  const out = Array.isArray(parts) ? parts.map((p) => p.text).join("") : "";
  const text = String(out || "").trim();
  return text || null;
};

const postChatMessage = async (req, res) => {
  const { message } = req.body;

  try {
    const pricesContext = await buildPricesContext();

    if (process.env.GEMINI_API_KEY) {
      try {
        const ai = await geminiReply(message, pricesContext);
        if (ai) {
          return res.json({ success: true, data: { reply: ai, source: "gemini" } });
        }
      } catch (err) {
        console.error("chatbot gemini failed", err.message);
      }
    }

    const reply = await ruleBasedReply(message);
    return res.json({ success: true, data: { reply, source: "rules" } });
  } catch (error) {
    console.error("chatbot failed", error);
    return res.status(500).json({
      success: false,
      message: "Could not process chat message"
    });
  }
};

export { postChatMessage };
