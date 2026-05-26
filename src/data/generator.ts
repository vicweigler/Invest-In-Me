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
