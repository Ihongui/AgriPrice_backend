const calculateTrend = (currentPrice, previousPrice) => {
  if (!previousPrice || previousPrice === 0) {
    return {
      trend: "stable",
      changePercent: 0
    };
  }

  const rawChange = ((currentPrice - previousPrice) / previousPrice) * 100;
  const roundedChange = Number(rawChange.toFixed(1));

  if (roundedChange > 0) {
    return { trend: "up", changePercent: roundedChange };
  }

  if (roundedChange < 0) {
    return { trend: "down", changePercent: Math.abs(roundedChange) };
  }

  return { trend: "stable", changePercent: 0 };
};

const selectLatestPrices = (prices) => {
  const latestMap = new Map();

  prices.forEach((priceDoc) => {
    const cropId = priceDoc.cropId?._id || priceDoc.cropId;
    const marketId = priceDoc.marketId?._id || priceDoc.marketId;
    const key = `${cropId}-${marketId}`;

    if (!latestMap.has(key)) {
      latestMap.set(key, priceDoc);
    }
  });

  return Array.from(latestMap.values());
};

export { calculateTrend, selectLatestPrices };
