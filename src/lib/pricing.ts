export const beardAddOnPrice = 10000;
export const eyebrowsAddOnPrice = 10000;

export const haircutPackages = [
  { key: "corte", label: "Corte", price: 20000 },
  { key: "solo-barba", label: "Solo barba", price: 8000 },
  { key: "solo-cejas", label: "Solo cejas", price: 5000 },
  { key: "base", label: "Base", price: 18000 },
  { key: "base-barba", label: "Base y barba", price: 26000 },
  { key: "base-cejas", label: "Base y cejas", price: 23000 },
  { key: "base-barba-cejas", label: "Base, cejas y barba", price: 28000 },
] as const;

const haircutRates: Array<{ terms: string[]; price: number; label: string }> = [
  { terms: ["corte"], price: 20000, label: "Corte" },
  { terms: ["solo barba"], price: 8000, label: "Solo barba" },
  { terms: ["solo cejas"], price: 5000, label: "Solo cejas" },
  { terms: ["base, cejas y barba", "base cejas y barba", "base barba y cejas", "base barba cejas"], price: 28000, label: "Base, cejas y barba" },
  { terms: ["base y barba", "base barba"], price: 26000, label: "Base y barba" },
  { terms: ["base y cejas", "base cejas"], price: 23000, label: "Base y cejas" },
  { terms: ["base"], price: 18000, label: "Base" },
];

const fallbackPrice = 18000;

export function estimateHaircutPrice(options: {
  haircutType: string;
  includeBeard?: boolean;
  includeEyebrows?: boolean;
}) {
  const normalized = options.haircutType.trim().toLowerCase();
  const baseMatch = haircutRates.find(({ terms }) =>
    terms.some((term) => normalized.includes(term)),
  );

  const price = baseMatch?.price ?? fallbackPrice;

  return {
    basePrice: baseMatch?.price ?? fallbackPrice,
    estimatedPrice: price,
    breakdown: {
      haircutType: options.haircutType,
      baseLabel: baseMatch?.label ?? "Base",
      includeBeard: Boolean(options.includeBeard),
      includeEyebrows: Boolean(options.includeEyebrows),
      beardAddOn: options.includeBeard ? beardAddOnPrice : 0,
      eyebrowsAddOn: options.includeEyebrows ? eyebrowsAddOnPrice : 0,
    },
  };
}

export const availableTimeSlots = [
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
] as const;
