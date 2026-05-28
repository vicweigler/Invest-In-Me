import { CompanyDefinition, PricePoint, StockData } from '../types';

// Seeded pseudo-random number generator (LCG)
function seededRng(seed: number) {
  let s = (seed * 1664525 + 1013904223) >>> 0;
  return function () {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

// Box-Muller normal distribution
function normalRandom(rng: () => number): number {
  const u1 = Math.max(rng(), 1e-10);
  const u2 = rng();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

// Sector volatility (annual std dev)
const SECTOR_VOL: Record<string, number> = {
  'Energy':                  0.028,
  'Materials':               0.026,
  'Financials':              0.020,
  'Healthcare':              0.018,
  'Consumer Staples':        0.014,
  'Consumer Discretionary':  0.022,
  'Industrials':             0.019,
  'Technology':              0.025,
  'Real Estate':             0.018,
  'Utilities':               0.014,
  'Communication Services':  0.022,
};

function tradingDaysAgo(days: number): Date {
  const date = new Date();
  let count = 0;
  let d = new Date(date);
  while (count < days) {
    d.setDate(d.getDate() - 1);
    if (d.getDay() !== 0 && d.getDay() !== 6) count++;
  }
  return d;
}

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

export function generatePriceHistory(company: CompanyDefinition, tradingDays: number = 260): PricePoint[] {
  const rng = seededRng(parseInt(company.id) * 997 + 42);
  const vol = SECTOR_VOL[company.sector] ?? 0.020;

  // Target log return from annual performance
  const targetLogReturn = Math.log(1 + company.annualPerf / 100);

  // Generate raw normal steps
  const steps: number[] = [];
  for (let i = 0; i < tradingDays; i++) {
    steps.push(normalRandom(rng) * vol);
  }

  // Scale so cumulative log-return matches annualPerf over 260 trading days
  const rawSum = steps.reduce((a, b) => a + b, 0);
  // Blend: 70% scaled to match target, 30% natural randomness for realism
  const scale = tradingDays === 260 ? targetLogReturn / (rawSum || 0.0001) : 1;
  const scaledSteps = steps.map(s => s * (0.7 * scale + 0.3));

  // Start price (backfilled from current)
  const startLogPrice = Math.log(company.currentPrice) - scaledSteps.reduce((a, b) => a + b, 0);

  const points: PricePoint[] = [];
  let logPrice = startLogPrice;
  const volRng = seededRng(parseInt(company.id) * 1337);

  for (let i = 0; i < tradingDays; i++) {
    logPrice += scaledSteps[i];
    const close = Math.max(Math.exp(logPrice), 1);

    // Intraday range (High/Low) based on volatility
    const dayRange = close * vol * 0.8 * Math.abs(normalRandom(volRng));
    const open = close * (1 - scaledSteps[i] * 0.5);
    const high = Math.max(close, open) + dayRange * 0.5;
    const low = Math.min(close, open) - dayRange * 0.5;

    const date = new Date();
    let daysBack = tradingDays - i;
    let d = new Date(date);
    let count = 0;
    while (count < daysBack) {
      d.setDate(d.getDate() - 1);
      if (d.getDay() !== 0 && d.getDay() !== 6) count++;
    }

    points.push({
      date: formatDate(d),
      price: Math.round(close * 100) / 100,
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.max(Math.round(low * 100) / 100, 1),
      volume: Math.round(company.volume * (0.7 + volRng() * 0.6) * 10) / 10,
    });
  }

  return points;
}

// ── FUNDAMENTAL METRICS GENERATION ────────────────────────────────────────

function lerp(t: number, min: number, max: number) {
  return min + Math.max(0, Math.min(1, t)) * (max - min);
}

const SECTOR_DE_RANGE: Record<string, [number, number]> = {
  'Energy':                    [0.55, 1.60],
  'Materials':                 [0.25, 1.10],
  'Financials':                [4.50, 13.0],
  'Healthcare':                [0.20, 0.90],
  'Consumer Staples':          [0.40, 1.30],
  'Consumer Discretionary':    [0.55, 2.10],
  'Industrials':               [0.35, 1.40],
  'Technology':                [0.10, 0.60],
  'Real Estate':               [0.90, 2.80],
  'Utilities':                 [1.10, 3.00],
  'Communication Services':    [0.50, 1.65],
};

const SECTOR_OCF_RANGE: Record<string, [number, number]> = {
  'Energy':                    [18, 38],
  'Materials':                 [14, 32],
  'Financials':                [15, 36],
  'Healthcare':                [14, 28],
  'Consumer Staples':          [10, 22],
  'Consumer Discretionary':    [ 7, 17],
  'Industrials':               [10, 23],
  'Technology':                [18, 40],
  'Real Estate':               [25, 52],
  'Utilities':                 [20, 44],
  'Communication Services':    [13, 28],
};

const SECTOR_ROA_RANGE: Record<string, [number, number]> = {
  'Energy':                    [ 4.0, 15.0],
  'Materials':                 [ 5.0, 17.0],
  'Financials':                [ 0.5,  2.6],
  'Healthcare':                [ 7.0, 21.0],
  'Consumer Staples':          [ 5.0, 15.0],
  'Consumer Discretionary':    [ 4.0, 14.0],
  'Industrials':               [ 6.0, 18.0],
  'Technology':                [ 8.0, 26.0],
  'Real Estate':               [ 2.5,  9.5],
  'Utilities':                 [ 2.5,  8.0],
  'Communication Services':    [ 4.0, 15.0],
};

function generateFundamentals(company: CompanyDefinition) {
  const seed = ((parseInt(company.id, 10) || 1) * 3571 + 13337) >>> 0;
  const rng = seededRng(seed);

  // EPS (£): derived from P/E ratio (price in pence ÷ PE ÷ 100)
  const eps = company.peRatio ? (company.currentPrice / company.peRatio) / 100 : null;

  // Revenue growth (%): correlated with annual perf + seeded variance
  const revenueGrowth = Math.max(-12, Math.min(36,
    company.annualPerf * 0.35 + (rng() - 0.5) * 10,
  ));

  // D/E ratio: sector-typical range, slightly biased by performance
  const [deMin, deMax] = SECTOR_DE_RANGE[company.sector] ?? [0.3, 1.5];
  const deBias = Math.max(0, Math.min(1, 0.5 - company.annualPerf * 0.005));
  const debtToEquity = lerp(deBias * 0.4 + rng() * 0.6, deMin, deMax);

  // Operating cash flow margin (%): sector-typical, biased by performance
  const [ocfMin, ocfMax] = SECTOR_OCF_RANGE[company.sector] ?? [10, 28];
  const ocfBias = Math.max(0, Math.min(1, 0.5 + company.annualPerf * 0.008));
  const operatingCashFlowMargin = lerp(ocfBias * 0.4 + rng() * 0.6, ocfMin, ocfMax);

  // Net profit margin (%): 38-65% of OCF margin with small noise
  const marginRatio = lerp(rng(), 0.38, 0.65);
  const netProfitMargin = Math.max(0, operatingCashFlowMargin * marginRatio + (rng() - 0.5) * 2);

  // Return on assets (%): sector-typical range, biased by performance
  const [roaMin, roaMax] = SECTOR_ROA_RANGE[company.sector] ?? [4, 16];
  const roaBias = Math.max(0, Math.min(1, 0.5 + company.annualPerf * 0.008));
  const returnOnAssets = lerp(roaBias * 0.4 + rng() * 0.6, roaMin, roaMax);

  // Moat score (0-10): market rank + company age + P/E premium signal
  let moatPts = 0;
  if (company.ftseRank <= 10) moatPts += 4;
  else if (company.ftseRank <= 25) moatPts += 3;
  else if (company.ftseRank <= 50) moatPts += 2;
  else moatPts += 1;

  const age = new Date().getFullYear() - company.founded;
  if (age >= 125) moatPts += 3;
  else if (age >= 75) moatPts += 2;
  else if (age >= 30) moatPts += 1;

  if (company.peRatio && company.peRatio > 22) moatPts += 2;
  else if (company.peRatio && company.peRatio > 15) moatPts += 1;

  const moatScore = Math.min(10, Math.max(0, (moatPts / 9) * 10 + (rng() - 0.5) * 1.5));

  return { eps, revenueGrowth, debtToEquity, operatingCashFlowMargin, netProfitMargin, returnOnAssets, moatScore };
}

export function buildStockData(company: CompanyDefinition): StockData {
  const yearlyData = generatePriceHistory(company, 260);

  // Slice subsets from the yearly data
  const sixMonthData = yearlyData.slice(Math.max(0, yearlyData.length - 130));
  const threeMonthData = yearlyData.slice(Math.max(0, yearlyData.length - 65));
  const monthlyData = yearlyData.slice(Math.max(0, yearlyData.length - 22));
  const weeklyData = yearlyData.slice(Math.max(0, yearlyData.length - 5));

  const prices = yearlyData.map(p => p.price);
  const high52w = Math.max(...prices);
  const low52w = Math.min(...prices);

  const cur = yearlyData[yearlyData.length - 1]?.price ?? company.currentPrice;
  const p6m = sixMonthData[0]?.price ?? cur;
  const p3m = threeMonthData[0]?.price ?? cur;

  const fundamentals = generateFundamentals(company);

  return {
    ...company,
    currentPrice: cur,
    yearlyData,
    sixMonthData,
    threeMonthData,
    monthlyData,
    weeklyData,
    high52w,
    low52w,
    threeMonthPerf: ((cur - p3m) / p3m) * 100,
    sixMonthPerf: ((cur - p6m) / p6m) * 100,
    ...fundamentals,
  };
}

// Format pence to display string
export function formatPrice(pence: number): string {
  if (pence >= 100) {
    return `£${(pence / 100).toFixed(2)}`;
  }
  return `${pence.toFixed(1)}p`;
}

export function formatPriceRaw(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`;
}

export function formatMarketCap(bn: number): string {
  if (bn >= 100) return `£${bn.toFixed(0)}bn`;
  if (bn >= 10) return `£${bn.toFixed(1)}bn`;
  return `£${bn.toFixed(2)}bn`;
}

export function formatVolume(millions: number): string {
  if (millions >= 1000) return `${(millions / 1000).toFixed(1)}bn`;
  return `${millions.toFixed(1)}m`;
}

export function perfColor(value: number): string {
  if (value > 0) return 'text-emerald-400';
  if (value < 0) return 'text-red-400';
  return 'text-slate-400';
}

export function perfBg(value: number): string {
  if (value > 0) return 'bg-emerald-500/10 text-emerald-400';
  if (value < 0) return 'bg-red-500/10 text-red-400';
  return 'bg-slate-500/10 text-slate-400';
}

export function formatPerf(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}
