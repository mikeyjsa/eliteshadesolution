// ============================================================
// Quote engine — ported verbatim from the blueprint demo
// (Elite-Shade-Solutions-Business-Blueprint.html, lines 890–978).
// Single source of truth for estimates. Rates are passed in from
// the editable `pricing` store so /admin/pricing drives live quotes.
// ============================================================
import type { QuoteInputs, QuoteLineItem, PricingRate } from "./types";

export interface Product {
  shape: "triangle" | "rectangle" | "square";
  range: "Standard" | "Extreme";
  label: string;
  L: number; // nominal covering length (m)
  W: number; // nominal covering width (m)
  p: number; // Kalahari retail price (ZAR)
  pts: number; // fixing points
}

// ONLY genuine Kalahari nets & their real sizes (kalaharishade.co.za, Jun 2026).
export const PRODUCTS: Product[] = [
  { shape: "triangle", range: "Standard", label: "Standard Right-Angle Triangle 3.6 × 3.6 × 5m", L: 3.6, W: 3.6, p: 899, pts: 3 },
  { shape: "rectangle", range: "Standard", label: "Standard Rectangle 3 × 5m", L: 5.0, W: 3.0, p: 1799, pts: 4 },
  { shape: "square", range: "Standard", label: "Standard Square 5 × 5m", L: 5.0, W: 5.0, p: 2199, pts: 4 },
  { shape: "triangle", range: "Extreme", label: "Extreme Right Triangle 3.6 × 3.6 × 5m", L: 3.6, W: 3.6, p: 1399, pts: 3 },
  { shape: "triangle", range: "Extreme", label: "Extreme Triangle 5 × 5 × 5m", L: 5.0, W: 4.3, p: 1899, pts: 3 },
  { shape: "square", range: "Extreme", label: "Extreme Square 3.6 × 3.6m", L: 3.6, W: 3.6, p: 2199, pts: 4 },
  { shape: "square", range: "Extreme", label: "Extreme Square 5.4 × 5.4m", L: 5.4, W: 5.4, p: 3999, pts: 4 },
  { shape: "rectangle", range: "Extreme", label: "Extreme Rectangle 5 × 3m", L: 5.0, W: 3.0, p: 2699, pts: 4 },
];

export const STRETCH = 0.8; // nets stretch ~1m → cover up to 0.8m more per side
export const RANGE_SPREAD = 0.12; // ±12% shown to customer
export const VAT_RATE = 0.15;

export interface Rates {
  pole: number;
  turnbuckle: number;
  chain: number;
  padEye: number;
  eyeBolt: number;
  labourBase: number;
  labourM2: number;
}

export const DEFAULT_RATES: Rates = {
  pole: 1550,
  turnbuckle: 150,
  chain: 160,
  padEye: 175,
  eyeBolt: 90,
  labourBase: 1725,
  labourM2: 90,
};

// Pull editable rates out of the pricing store (falls back to defaults).
export function ratesFromPricing(pricing: PricingRate[]): Rates {
  const find = (k: string, d: number) =>
    pricing.find((r) => r.key === k)?.rate ?? d;
  return {
    pole: find("pole", DEFAULT_RATES.pole),
    turnbuckle: find("turnbuckle", DEFAULT_RATES.turnbuckle),
    chain: find("chain", DEFAULT_RATES.chain),
    padEye: find("padEye", DEFAULT_RATES.padEye),
    eyeBolt: find("eyeBolt", DEFAULT_RATES.eyeBolt),
    labourBase: find("labourBase", DEFAULT_RATES.labourBase),
    labourM2: find("labourM2", DEFAULT_RATES.labourM2),
  };
}

export interface QuoteResult {
  ok: boolean;
  message?: string;
  exceeded: boolean;
  netLabel: string;
  lineItems: QuoteLineItem[];
  subtotal: number;
  vat: number;
  low: number;
  high: number;
  poleCount: number;
  points: number;
  area: number;
}

export function calcQuote(
  inputs: QuoteInputs,
  rates: Rates = DEFAULT_RATES
): QuoteResult {
  const L = Number(inputs.length) || 0;
  const W = Number(inputs.width) || 0;
  const { shape, range: rangePref, poles } = inputs;

  if (L <= 0 || W <= 0) {
    return {
      ok: false,
      message: "Please enter a valid length and width.",
      exceeded: false,
      netLabel: "",
      lineItems: [],
      subtotal: 0,
      vat: 0,
      low: 0,
      high: 0,
      poleCount: 0,
      points: 0,
      area: 0,
    };
  }

  const need = { L: Math.max(L, W), W: Math.min(L, W) };

  // candidates: filter by shape + range, that cover the area (+stretch), cheapest first
  const fits = PRODUCTS.filter((pr) => {
    if (shape !== "auto" && pr.shape !== shape) return false;
    if (rangePref !== "any" && pr.range !== rangePref) return false;
    const capL = Math.max(pr.L, pr.W) + STRETCH;
    const capW = Math.min(pr.L, pr.W) + STRETCH;
    return capL >= need.L - 0.001 && capW >= need.W - 0.001;
  }).sort((a, b) => a.p - b.p);

  let chosen = fits[0] || null;
  let exceeded = false;

  if (!chosen) {
    // area exceeds everything → fall back to our LARGEST net by coverage
    let pool = PRODUCTS.filter((pr) => {
      if (shape !== "auto" && pr.shape !== shape) return false;
      if (rangePref !== "any" && pr.range !== rangePref) return false;
      return true;
    });
    if (!pool.length) pool = PRODUCTS.slice();
    pool.sort((a, b) => b.L * b.W - a.L * a.W);
    chosen = pool[0];
    exceeded = true;
  }

  const points = chosen.pts;
  const maxSpan = Math.max(chosen.L, chosen.W);
  let poleCount = points;
  if (maxSpan > 6) poleCount += 2;

  const netPrice = chosen.p;
  const structureCost = poles ? poleCount * rates.pole : 0;
  // per-point tension kit: turnbuckle + chain + (eye-bolt on pole / pad eye on wall)
  const kitPer = rates.turnbuckle + rates.chain + (poles ? rates.eyeBolt : rates.padEye);
  const hardware = points * kitPer;
  const area = L * W;
  const labour = rates.labourBase + area * rates.labourM2;
  const subtotal = netPrice + structureCost + hardware + labour;
  const low = subtotal * (1 - RANGE_SPREAD);
  const high = subtotal * (1 + RANGE_SPREAD);
  const vat = subtotal * VAT_RATE;

  const lineItems: QuoteLineItem[] = [];
  lineItems.push({ label: "Kalahari " + chosen.label, amount: netPrice });
  if (poles)
    lineItems.push({
      label: poleCount + " × galvanised pole (installed)",
      amount: structureCost,
    });
  lineItems.push({
    label:
      points +
      " × " +
      (poles ? "pole" : "wall") +
      " tension kit (turnbuckle + chain + " +
      (poles ? "eye-bolt" : "pad eye") +
      ")",
    amount: hardware,
  });
  lineItems.push({
    label: "Installation labour (base + " + area.toFixed(1) + "m²)",
    amount: labour,
  });

  const message = exceeded
    ? `Your ${L}m × ${W}m area exceeds our maximum net. Quoted at our largest size — ${chosen.label}. For full cover we'd add a second sail or custom shade-port, confirmed on a free site survey.`
    : `Recommended net: ${chosen.label} (covers your ${L}m × ${W}m ≈ ${area.toFixed(
        1
      )}m² · ${poles ? poleCount + " support poles" : points + " wall fixings"})`;

  return {
    ok: true,
    message,
    exceeded,
    netLabel: chosen.label,
    lineItems,
    subtotal,
    vat,
    low,
    high,
    poleCount,
    points,
    area,
  };
}
