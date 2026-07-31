const normalizeText = (value = "") =>
  value
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .toLowerCase()
    .trim();

const levenshteinDistance = (a, b) => {
  const left = normalizeText(a);
  const right = normalizeText(b);
  const matrix = Array.from({ length: left.length + 1 }, () => Array(right.length + 1).fill(0));

  for (let i = 0; i <= left.length; i += 1) {
    matrix[i][0] = i;
  }

  for (let j = 0; j <= right.length; j += 1) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= left.length; i += 1) {
    for (let j = 1; j <= right.length; j += 1) {
      const cost = left[i - 1] === right[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[left.length][right.length];
};

const findBestMatch = (needle, candidates, getLabel = (item) => item) => {
  const normalizedNeedle = normalizeText(needle);

  if (!normalizedNeedle) {
    return null;
  }

  const scored = candidates
    .map((candidate) => {
      const label = getLabel(candidate);
      const normalizedLabel = normalizeText(label);
      const distance = levenshteinDistance(normalizedNeedle, normalizedLabel);
      const includes = normalizedLabel.includes(normalizedNeedle) || normalizedNeedle.includes(normalizedLabel);
      return { candidate, distance, includes };
    })
    .sort((a, b) => {
      if (a.includes !== b.includes) {
        return a.includes ? -1 : 1;
      }

      return a.distance - b.distance;
    });

  const best = scored[0];

  if (!best) {
    return null;
  }

  return best.includes || best.distance <= Math.max(2, Math.floor(normalizedNeedle.length / 3))
    ? best.candidate
    : null;
};

export { findBestMatch, normalizeText };
