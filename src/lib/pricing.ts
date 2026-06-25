const haircutRates: Array<{ terms: string[]; price: number }> = [
  { terms: ["premium", "barber pro", "diseño", "design", "vip"], price: 28000 },
  { terms: ["fade", "degradado", "taper", "low fade", "high fade"], price: 22000 },
  { terms: ["undercut", "crop", "pompadour"], price: 24000 },
  { terms: ["niño", "kids", "infantil"], price: 14000 },
  { terms: ["barba", "beard"], price: 18000 },
  { terms: ["clásico", "clasico", "normal", "sencillo", "regular"], price: 16000 },
];

const fallbackPrice = 20000;
const beardAddOn = 8000;
const eyebrowsAddOn = 5000;
export const beardAddOnPrice = beardAddOn;
export const eyebrowsAddOnPrice = eyebrowsAddOn;

export function estimateHaircutPrice(options: {
  haircutType: string;
  includeBeard?: boolean;
  includeEyebrows?: boolean;
}) {
  const normalized = options.haircutType.trim().toLowerCase();
  const baseMatch = haircutRates.find(({ terms }) =>
    terms.some((term) => normalized.includes(term)),
  );

  let price = baseMatch?.price ?? fallbackPrice;

  if (options.includeBeard) {
    price += beardAddOnPrice;
  }

  if (options.includeEyebrows) {
    price += eyebrowsAddOnPrice;
  }

  return {
    basePrice: baseMatch?.price ?? fallbackPrice,
    estimatedPrice: price,
    breakdown: {
      haircutType: options.haircutType,
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
