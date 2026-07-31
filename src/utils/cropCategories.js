const cropCategoryEnum = [
  "Cereals",
  "Roots & Tubers",
  "Vegetables",
  "Legumes",
  "Fruits",
  "Other",
];

const cropCategoryAliases = {
  Cereal: "Cereals",
  Grains: "Cereals",
  Grain: "Cereals",
  Vegetable: "Vegetables",
  Spice: "Other",
  Spices: "Other",
  Tuber: "Roots & Tubers",
  Tubers: "Roots & Tubers",
  "Root & Tubers": "Roots & Tubers",
};

const normalizeCropCategory = (value) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmedValue = value.trim();
  return cropCategoryAliases[trimmedValue] || trimmedValue;
};

export { cropCategoryEnum, normalizeCropCategory };
