// Sri Balaji Borewells - Depth Calculation & Rate Engine
import { DrillingRateConfig, DrillingRateSlab, DepthCalculationResult, CalculatedSlabRow, OtherChargeItem } from '../types';

export const DEFAULT_DRILLING_SLABS: DrillingRateSlab[] = [
  { id: 'slab-1', fromFeet: 0, toFeet: 200, ratePerFoot: 145 },
  { id: 'slab-2', fromFeet: 200, toFeet: 300, ratePerFoot: 150 },
  { id: 'slab-3', fromFeet: 300, toFeet: 400, ratePerFoot: 155 },
  { id: 'slab-4', fromFeet: 400, toFeet: 500, ratePerFoot: 165 },
  { id: 'slab-5', fromFeet: 500, toFeet: 600, ratePerFoot: 185 },
  { id: 'slab-6', fromFeet: 600, toFeet: 700, ratePerFoot: 215 },
  { id: 'slab-7', fromFeet: 700, toFeet: 9999, ratePerFoot: 265 },
];

export const DEFAULT_RATE_CONFIG: DrillingRateConfig = {
  id: 'default-rate-template',
  templateName: 'Standard Borewell Rates (Karnataka / Chitradurga)',
  isTemplate: true,
  slabs: DEFAULT_DRILLING_SLABS,
  defaultCasingRate: 380, // ₹380 per ft MS Casing
  defaultCallerRate: 450, // ₹450 per caller
  defaultWeldingRate: 250, // ₹250 per joint welding
  defaultMealsCharge: 1500, // ₹1,500 crew meals
  defaultTransportCharge: 2500, // ₹2,500 transport
};

/**
 * Validates that drilling slabs are sequential, continuous, and non-overlapping.
 * Returns an error string if invalid, or null if valid.
 */
export function validateSlabsContinuity(slabs: DrillingRateSlab[]): string | null {
  if (!slabs || slabs.length === 0) {
    return 'At least one drilling rate slab is required.';
  }

  // Sort by fromFeet
  const sorted = [...slabs].sort((a, b) => a.fromFeet - b.fromFeet);

  if (sorted[0].fromFeet !== 0) {
    return `First slab must start at 0 ft, currently starts at ${sorted[0].fromFeet} ft.`;
  }

  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i];
    if (current.toFeet <= current.fromFeet) {
      return `Slab ${current.fromFeet}-${current.toFeet} has invalid range: ending depth must be greater than starting depth.`;
    }
    if (current.ratePerFoot < 0) {
      return `Rate cannot be negative for slab ${current.fromFeet}-${current.toFeet}.`;
    }

    if (i > 0) {
      const prev = sorted[i - 1];
      if (current.fromFeet < prev.toFeet) {
        return `Overlapping slabs detected: ${prev.fromFeet}-${prev.toFeet} overlaps with ${current.fromFeet}-${current.toFeet}.`;
      }
      if (current.fromFeet > prev.toFeet) {
        return `Gap detected: missing rates between ${prev.toFeet} ft and ${current.fromFeet} ft.`;
      }
    }
  }

  return null;
}

export interface CalculationInput {
  totalDepth: number;
  rateConfig: DrillingRateConfig;
  casingQty?: number;
  casingRate?: number;
  callerQty?: number;
  callerRate?: number;
  weldingQty?: number;
  weldingRate?: number;
  mealsCharge?: number;
  mealsType?: 'fixed' | 'calculated';
  mealsRate?: number;
  mealsQty?: number;
  transportCharge?: number;
  transportType?: 'fixed' | 'calculated';
  transportRate?: number;
  transportQty?: number;
  otherCharges?: OtherChargeItem[];
}

/**
 * Calculates depth-wise charges and grand total automatically.
 * Follows exact formula as verified in Master Prompt:
 * E.g. 805 ft = 200*145 + 100*150 + 100*155 + 100*165 + 100*185 + 100*215 + 105*265 = 1,43,825.
 */
export function calculateDepthCharges(input: CalculationInput): DepthCalculationResult {
  const { totalDepth, rateConfig } = input;
  const slabs = [...rateConfig.slabs].sort((a, b) => a.fromFeet - b.fromFeet);
  const slabRows: CalculatedSlabRow[] = [];

  let drillingSubtotal = 0;

  for (const slab of slabs) {
    if (totalDepth <= slab.fromFeet) {
      break;
    }

    const slabStart = slab.fromFeet;
    const slabEnd = Math.min(totalDepth, slab.toFeet);
    const feetInSlab = Math.max(0, slabEnd - slabStart);

    if (feetInSlab > 0) {
      const amount = feetInSlab * slab.ratePerFoot;
      drillingSubtotal += amount;

      slabRows.push({
        fromFeet: slabStart,
        toFeet: slabEnd,
        feetInSlab,
        ratePerFoot: slab.ratePerFoot,
        amount,
      });
    }

    if (totalDepth <= slab.toFeet) {
      break;
    }
  }

  // Add-ons
  const casingQty = input.casingQty ?? 0;
  const casingRate = input.casingRate ?? rateConfig.defaultCasingRate;
  const casingAmount = casingQty * casingRate;

  const callerQty = input.callerQty ?? 0;
  const callerRate = input.callerRate ?? rateConfig.defaultCallerRate;
  const callerAmount = callerQty * callerRate;

  const weldingQty = input.weldingQty ?? 0;
  const weldingRate = input.weldingRate ?? rateConfig.defaultWeldingRate;
  const weldingAmount = weldingQty * weldingRate;

  // Meals
  const mealsType = input.mealsType ?? 'fixed';
  let mealsCharge = 0;
  if (mealsType === 'fixed') {
    mealsCharge = input.mealsCharge !== undefined ? input.mealsCharge : rateConfig.defaultMealsCharge;
  } else {
    const qty = input.mealsQty ?? 1;
    const rate = input.mealsRate ?? rateConfig.defaultMealsCharge;
    mealsCharge = qty * rate;
  }

  // Transport
  const transportType = input.transportType ?? 'fixed';
  let transportCharge = 0;
  if (transportType === 'fixed') {
    transportCharge = input.transportCharge !== undefined ? input.transportCharge : rateConfig.defaultTransportCharge;
  } else {
    const qty = input.transportQty ?? 1;
    const rate = input.transportRate ?? rateConfig.defaultTransportCharge;
    transportCharge = qty * rate;
  }

  const otherCharges = input.otherCharges ?? [];
  const otherChargesSubtotal = otherCharges.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

  const grandTotal = drillingSubtotal + casingAmount + callerAmount + weldingAmount + mealsCharge + transportCharge + otherChargesSubtotal;

  return {
    totalDepth,
    slabRows,
    drillingSubtotal,
    casingQty,
    casingRate,
    casingAmount,
    callerQty,
    callerRate,
    callerAmount,
    weldingQty,
    weldingRate,
    weldingAmount,
    mealsCharge,
    mealsType,
    mealsRate: input.mealsRate,
    mealsQty: input.mealsQty,
    transportCharge,
    transportType,
    transportRate: input.transportRate,
    transportQty: input.transportQty,
    otherCharges,
    otherChargesSubtotal,
    grandTotal,
  };
}

/**
 * Format currency in Indian Numbering System (e.g. ₹1,43,825.00)
 */
export function formatINR(amount: number, showDecimals = false): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '₹0';
  const rounded = Math.round(amount * 100) / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: showDecimals ? 2 : 0,
    minimumFractionDigits: showDecimals ? 2 : 0,
  }).format(rounded);
}

/**
 * Convert number to words in Indian numbering system (Lakhs, Crores)
 */
export function numberToIndianWords(num: number): string {
  if (!num || isNaN(num) || num === 0) return 'Zero Rupees Only';

  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function inWords(n: number): string {
    if (n < 20) return a[n];
    const digit = n % 10;
    if (n < 100) return b[Math.floor(n / 10)] + (digit ? ' ' + a[digit] : '');
    if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 === 0 ? '' : ' ' + inWords(n % 100));
    return '';
  }

  const intNum = Math.floor(Math.abs(num));
  let str = '';

  const crore = Math.floor(intNum / 10000000);
  const lakh = Math.floor((intNum % 10000000) / 100000);
  const thousand = Math.floor((intNum % 100000) / 1000);
  const hundred = Math.floor((intNum % 1000) / 100);
  const remainder = intNum % 100;

  if (crore > 0) {
    str += inWords(crore) + ' Crore ';
  }
  if (lakh > 0) {
    str += inWords(lakh) + ' Lakh ';
  }
  if (thousand > 0) {
    str += inWords(thousand) + ' Thousand ';
  }
  if (hundred > 0) {
    str += inWords(hundred) + ' Hundred ';
  }
  if (remainder > 0) {
    if (str !== '') str += 'and ';
    str += inWords(remainder) + ' ';
  }

  return str.trim() + ' Rupees Only';
}
