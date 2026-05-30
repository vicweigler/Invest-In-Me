import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, Activity, BarChart2, ArrowUpRight, ArrowDownRight, ScanSearch, X } from 'lucide-react';
import { useMarketStore, selectTopGainers, selectTopDecliners, ftse100IndexLevel } from '../../store/marketStore';
import { formatPrice, formatPerf, formatMarketCap, perfColor, perfBg } from '../../data/generator';
import { SECTOR_COLORS } from '../../data/companies';
import { StockData } from '../../types';
import { FundamentalData } from '../../services/marketData';
import clsx from 'clsx';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';

// ── MARKET SUMMARY CARDS ─────────────────────────────────────────────────
function SummaryCard({ label, value, sub, subColor }: { label: string; value: string; sub?: string; subColor?: string }) {
  return (
    <div className="bg-[#0F172A] border border-white/[0.06] rounded-xl p-4 flex flex-col gap-1">
      <span className="text-slate-500 text-xs font-medium uppercase tracking-wider">{label}</span>
      <span className="text-white text-2xl font-bold font-mono">{value}</span>
      {sub && <span className={clsx('text-sm font-semibold', subColor ?? 'text-slate-400')}>{sub}</span>}
    </div>
  );
}

// ── MINI SPARKLINE ────────────────────────────────────────────────────────
function MiniChart({ data, positive }: { data: number[]; positive: boolean }) {
  const chartData = data.map((v, i) => ({ i, v }));
  const color = positive ? '#10B981' : '#F43F5E';
  return (
    <ResponsiveContainer width="100%" height={40}>
      <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`g-${positive}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5}
          fill={`url(#g-${positive})`} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ── TOP MOVER CARD ────────────────────────────────────────────────────────
function MoverCard({ stock, onClick }: { stock: StockData; onClick: () => void }) {
  const positive = stock.dayPerf >= 0;
  const prices = stock.monthlyData.map(p => p.price);

  return (
    <button onClick={onClick}
      className="bg-[#0F172A] border border-white/[0.06] rounded-xl p-4 hover:border-indigo-500/30 hover:bg-indigo-500/[0.03] transition-all text-left group w-full"
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-white font-bold text-sm">{stock.symbol}</span>
            <span className={clsx('text-[10px] font-bold px-1.5 py-0.5 rounded', perfBg(stock.dayPerf))}>
              {formatPerf(stock.dayPerf)}
            </span>
          </div>
          <p className="text-slate-500 text-xs mt-0.5 truncate max-w-[140px]">{stock.name}</p>
        </div>
        <div className="text-right">
          <p className="text-white font-mono text-sm font-semibold">{formatPrice(stock.currentPrice)}</p>
          {positive
            ? <ArrowUpRight size={14} className="text-emerald-400 ml-auto" />
            : <ArrowDownRight size={14} className="text-red-400 ml-auto" />
          }
        </div>
      </div>
      <MiniChart data={prices} positive={positive} />
    </button>
  );
}

// ── SECTOR HEATMAP ────────────────────────────────────────────────────────
function SectorHeatmap({ stocks }: { stocks: StockData[] }) {
  const sectors = Array.from(new Set(stocks.map(s => s.sector)));
  const sectorPerf = sectors.map(sector => {
    const ss = stocks.filter(s => s.sector === sector);
    const avg = ss.reduce((a, b) => a + b.dayPerf, 0) / ss.length;
    return { sector, avg, count: ss.length };
  }).sort((a, b) => b.avg - a.avg);

  return (
    <div className="bg-[#0F172A] border border-white/[0.06] rounded-xl p-5">
      <h3 className="text-slate-300 font-semibold text-sm mb-4 flex items-center gap-2">
        <BarChart2 size={14} className="text-indigo-400" />
        Sector Performance Today
      </h3>
      <div className="space-y-2">
        {sectorPerf.map(({ sector, avg, count }) => {
          const color = SECTOR_COLORS[sector] ?? '#6366F1';
          const barWidth = Math.min(Math.abs(avg) * 15, 100);
          return (
            <div key={sector} className="flex items-center gap-3">
              <span className="text-slate-400 text-xs w-44 truncate">{sector}</span>
              <div className="flex-1 h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${barWidth}%`,
                    backgroundColor: avg >= 0 ? '#10B981' : '#F43F5E',
                    marginLeft: avg < 0 ? `${100 - barWidth}%` : undefined,
                  }}
                />
              </div>
              <span className={clsx('text-xs font-mono font-semibold w-16 text-right', perfColor(avg))}>
                {formatPerf(avg)}
              </span>
              <span className="text-slate-600 text-xs w-8 text-right">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── INDEX CHART ────────────────────────────────────────────────────────────
function IndexChart({ stocks }: { stocks: StockData[] }) {
  if (!stocks.length) return null;

  // Build a synthetic FTSE 100 daily series from avg of all stocks' monthly data
  const len = stocks[0]?.monthlyData?.length ?? 0;
  const chartData = Array.from({ length: len }, (_, i) => {
    const avgPrice = stocks.reduce((s, st) => {
      const pt = st.monthlyData[i];
      // normalise each stock to 100 at start
      const start = st.monthlyData[0]?.price ?? 1;
      return s + (pt ? pt.price / start : 1);
    }, 0) / stocks.length;
    const date = stocks[0].monthlyData[i]?.date ?? '';
    return { date, value: +(8285 * avgPrice).toFixed(0) };
  });

  const isPos = (chartData[chartData.length - 1]?.value ?? 8285) >= (chartData[0]?.value ?? 8285);

  return (
    <div className="bg-[#0F172A] border border-white/[0.06] rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-slate-300 font-semibold text-sm flex items-center gap-2">
          <Activity size={14} className="text-indigo-400" />
          FTSE 100 — 30 Day Performance
        </h3>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={chartData} margin={{ top: 5, right: 0, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="ftse-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={isPos ? '#10B981' : '#F43F5E'} stopOpacity={0.25} />
              <stop offset="95%" stopColor={isPos ? '#10B981' : '#F43F5E'} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis dataKey="date" tick={{ fill: '#475569', fontSize: 10 }}
            tickFormatter={d => d ? d.slice(5) : ''} interval={Math.floor(len / 5)} />
          <YAxis tick={{ fill: '#475569', fontSize: 10 }}
            domain={['auto', 'auto']}
            tickFormatter={v => v.toLocaleString()} />
          <Tooltip
            contentStyle={{ background: '#1E293B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#F1F5F9', fontSize: 12 }}
            formatter={(v: number) => [v.toLocaleString('en-GB'), 'FTSE 100']}
          />
          <Area type="monotone" dataKey="value" stroke={isPos ? '#10B981' : '#F43F5E'}
            strokeWidth={2} fill="url(#ftse-grad)" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── STOCK SCAN — SCORING ENGINE ───────────────────────────────────────────
interface CriteriaScores {
  eps: number; pe: number; revGrowth: number; debtEquity: number;
  ocf: number; margin: number; roa: number; moat: number;
  dividend: number; valuation: number;
}
const SCAN_WEIGHTS: Record<keyof CriteriaScores, number> = {
  eps: 1.0, pe: 1.2, revGrowth: 1.2, debtEquity: 1.0,
  ocf: 0.9, margin: 1.0, roa: 1.0, moat: 0.8,
  dividend: 0.6, valuation: 1.3,
};
const SCAN_TOTAL_WEIGHT = Object.values(SCAN_WEIGHTS).reduce((a, b) => a + b, 0);
const SCAN_THRESHOLD = 5.5;

/** Compute moat score (0-10) from real gross margins, ROE, and market position */
function computeMoat(stock: StockData, real: FundamentalData | null): number {
  let pts = 0;
  // Market position (FTSE rank)
  if (stock.ftseRank <= 10) pts += 3;
  else if (stock.ftseRank <= 25) pts += 2.5;
  else if (stock.ftseRank <= 50) pts += 2;
  else pts += 1;

  // Gross margins (pricing power) — prefer real
  const gm = real?.grossMargins != null ? real.grossMargins * 100 : null;
  if (gm !== null) {
    if (gm > 60) pts += 3; else if (gm > 40) pts += 2.5;
    else if (gm > 20) pts += 1.5; else pts += 0.5;
  } else {
    // Fallback: use PE premium as proxy for pricing power
    if (stock.peRatio && stock.peRatio > 22) pts += 2;
    else if (stock.peRatio && stock.peRatio > 15) pts += 1;
  }

  // ROE (capital efficiency) — prefer real
  const roe = real?.returnOnEquity != null ? real.returnOnEquity * 100 : null;
  if (roe !== null) {
    if (roe > 25) pts += 2; else if (roe > 15) pts += 1.5; else if (roe > 8) pts += 1;
  }

  // Company age (durability)
  const age = new Date().getFullYear() - stock.founded;
  if (age >= 100) pts += 1.5; else if (age >= 50) pts += 1; else pts += 0.5;

  return Math.min(10, Math.max(0, (pts / 9.5) * 10));
}

function scoreStock(stock: StockData, real: FundamentalData | null): { scores: CriteriaScores; composite: number } {
  const isFin = stock.sector === 'Financials';

  // Resolve effective values — real data overrides generated where available.
  // Yahoo Finance returns margin/growth/ROA fields as decimals (0.10 = 10%).
  // debtToEquity is in Yahoo's percentage format (50 = 0.5 standard D/E).
  const effEps     = real?.eps ?? stock.eps;
  const effRevGrow = real?.revenueGrowth  != null ? real.revenueGrowth  * 100 : stock.revenueGrowth;
  const effDE      = real?.debtToEquity   != null
    ? (real.debtToEquity > 10 ? real.debtToEquity / 100 : real.debtToEquity)
    : stock.debtToEquity;
  const effOCF     = real?.operatingMargins != null ? real.operatingMargins * 100 : stock.operatingCashFlowMargin;
  const effMargin  = real?.profitMargins    != null ? real.profitMargins    * 100 : stock.netProfitMargin;
  const effROA     = real?.returnOnAssets   != null ? real.returnOnAssets   * 100 : stock.returnOnAssets;
  const effMoat    = computeMoat(stock, real);

  // 1. EPS — earnings yield (driven by real peRatio from Yahoo quotes)
  const epsScore = effEps == null ? 3
    : effEps <= 0 ? 0
    : stock.peRatio == null ? 5
    : (() => { const y = (1 / stock.peRatio) * 100; return y >= 10 ? 10 : y >= 7 ? 9 : y >= 5 ? 7 : y >= 3 ? 6 : 5; })();

  // 2. P/E — valuation
  const peScore = stock.peRatio == null ? 4
    : stock.peRatio < 5 ? 3 : stock.peRatio < 12 ? 8 : stock.peRatio < 20 ? 9
    : stock.peRatio < 30 ? 7 : stock.peRatio < 40 ? 5 : 3;

  // 3. Revenue growth (real % YoY)
  const rgScore = effRevGrow < -5 ? 1 : effRevGrow < 0 ? 3
    : effRevGrow < 3 ? 5 : effRevGrow < 7 ? 7 : effRevGrow < 12 ? 9 : 10;

  // 4. D/E ratio (sector-adjusted for Financials)
  const deScore = isFin
    ? (effDE < 5 ? 10 : effDE < 8 ? 8 : effDE < 12 ? 6 : 4)
    : effDE < 0.2 ? 10 : effDE < 0.5 ? 9 : effDE < 1.0 ? 7
    : effDE < 1.5 ? 5 : effDE < 2.5 ? 3 : 1;

  // 5. Operating cash flow / operating margin
  const ocfScore = effOCF < 0 ? 0 : effOCF < 8 ? 3 : effOCF < 15 ? 6
    : effOCF < 25 ? 8 : effOCF < 35 ? 9 : 10;

  // 6. Net profit margin
  const marginScore = effMargin < 0 ? 0 : effMargin < 4 ? 3 : effMargin < 8 ? 6
    : effMargin < 15 ? 8 : effMargin < 22 ? 9 : 10;

  // 7. Return on assets (banks use tighter scale)
  const roaScore = isFin
    ? (effROA < 0.5 ? 3 : effROA < 1.0 ? 6 : effROA < 1.5 ? 8 : 10)
    : effROA < 2 ? 2 : effROA < 5 ? 5 : effROA < 10 ? 7 : effROA < 15 ? 9 : 10;

  // 8. Competitive moat
  const moatScore = effMoat;

  // 9. Dividend (very high yield can signal distress)
  const dY = stock.dividendYield ?? 0;
  const divScore = dY <= 0 ? 4 : dY < 1.5 ? 5 : dY < 3 ? 7 : dY < 5.5 ? 9 : dY < 8 ? 7 : 4;

  // 10. Valuation / market sentiment (real price position in 52w range + momentum)
  const priceRange = stock.high52w - stock.low52w;
  const posInRange = priceRange > 0 ? (stock.currentPrice - stock.low52w) / priceRange : 0.5;
  const valScore = Math.min(10, Math.max(0,
    posInRange * 5
    + (stock.weekPerf > 0 ? 2 : 0)
    + (stock.monthPerf > 0 ? 2 : 0)
    + (stock.threeMonthPerf > 10 ? 1 : 0),
  ));

  const scores: CriteriaScores = {
    eps: epsScore, pe: peScore, revGrowth: rgScore, debtEquity: deScore,
    ocf: ocfScore, margin: marginScore, roa: roaScore, moat: moatScore,
    dividend: divScore, valuation: valScore,
  };
  const composite = (Object.keys(scores) as Array<keyof CriteriaScores>)
    .reduce((sum, k) => sum + scores[k] * SCAN_WEIGHTS[k], 0) / SCAN_TOTAL_WEIGHT;

  return { scores, composite };
}

// ── STOCK SCAN MODAL ─────────────────────────────────────────────────────
function StockScanModal({ stocks, fundamentals, fundamentalsStatus, onClose, onSelect }: {
  stocks: StockData[];
  fundamentals: Record<string, FundamentalData>;
  fundamentalsStatus: 'idle' | 'loading' | 'loaded' | 'error';
  onClose: () => void;
  onSelect: (symbol: string) => void;
}) {
  const { picks, analysed, filtered } = useMemo(() => {
    const candidates = [...stocks]
      .filter(s => s.threeMonthPerf > 0)
      .sort((a, b) => b.threeMonthPerf - a.threeMonthPerf);

    const picks: Array<{ stock: StockData; composite: number; hasReal: boolean }> = [];
    let analysed = 0;
    let filtered = 0;

    for (const stock of candidates) {
      if (picks.length >= 5) break;
      analysed++;
      const real = fundamentals[stock.symbol] ?? null;
      const { composite } = scoreStock(stock, real);
      if (composite >= SCAN_THRESHOLD) {
        picks.push({ stock, composite, hasReal: !!real });
      } else {
        filtered++;
      }
    }
    return { picks, analysed, filtered };
  }, [stocks, fundamentals]);

  const isRealData = fundamentalsStatus === 'loaded';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-[#0D1424] border border-white/[0.08] rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[88vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center">
              <ScanSearch size={16} className="text-indigo-400" />
            </div>
            <div>
              <h2 className="text-white font-bold text-sm">Stock Scan</h2>
              <p className="text-slate-500 text-xs flex items-center gap-1.5">
                <span className={clsx('w-1.5 h-1.5 rounded-full shrink-0', isRealData ? 'bg-emerald-400' : fundamentalsStatus === 'loading' ? 'bg-amber-400 animate-pulse' : 'bg-slate-500')} />
                {fundamentalsStatus === 'loading'
                  ? 'Fetching live fundamentals…'
                  : isRealData
                    ? `Live data · ${analysed} analysed · ${filtered} filtered`
                    : `Simulated data · ${analysed} analysed · ${filtered} filtered`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-300 p-1.5 rounded-lg hover:bg-white/[0.04] transition-all"
          >
            <X size={16} />
          </button>
        </div>

        {/* Picks */}
        <div className="overflow-y-auto p-3 space-y-1">
          {picks.map(({ stock, composite }, i) => {
            const real = fundamentals[stock.symbol] ?? null;
            const scoreColor = composite >= 7.5 ? 'text-emerald-400'
              : composite >= 6.5 ? 'text-sky-400' : 'text-amber-400';
            const scoreBg = composite >= 7.5 ? 'bg-emerald-500/10 border-emerald-500/20'
              : composite >= 6.5 ? 'bg-sky-500/10 border-sky-500/20'
              : 'bg-amber-500/10 border-amber-500/20';

            // Display values: prefer real, fall back to generated
            const dispEps = real?.eps != null
              ? `EPS £${real.eps.toFixed(2)}`
              : stock.eps != null ? `EPS £${stock.eps.toFixed(2)}` : 'EPS N/A';
            const dispPE = stock.peRatio != null ? `P/E ${stock.peRatio.toFixed(1)}` : 'P/E N/A';
            const dispDE = real?.debtToEquity != null
              ? `D/E ${(real.debtToEquity > 10 ? real.debtToEquity / 100 : real.debtToEquity).toFixed(2)}`
              : `D/E ${stock.debtToEquity.toFixed(2)}`;
            const dispMgn = real?.profitMargins != null
              ? `Mgn ${(real.profitMargins * 100).toFixed(1)}%`
              : `Mgn ${stock.netProfitMargin.toFixed(1)}%`;

            return (
              <button
                key={stock.id}
                onClick={() => { onSelect(stock.symbol); onClose(); }}
                className="w-full p-3 rounded-xl hover:bg-white/[0.04] transition-all text-left group"
              >
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-indigo-500/15 text-indigo-400 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-white font-bold text-sm">{stock.symbol}</span>
                        <span className="text-slate-500 text-[10px] bg-white/[0.04] px-1.5 py-0.5 rounded">{stock.sector}</span>
                      </div>
                      <span className="text-emerald-400 font-mono font-bold text-sm shrink-0">
                        +{stock.threeMonthPerf.toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-0.5 gap-2">
                      <p className="text-slate-400 text-xs truncate">{stock.name}</p>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={clsx('text-[10px] font-bold px-1.5 py-0.5 rounded border', scoreBg, scoreColor)}>
                          {composite.toFixed(1)}/10
                        </span>
                        <span className="text-slate-500 text-xs font-mono">{formatPrice(stock.currentPrice)}</span>
                      </div>
                    </div>
                    <p className="text-slate-600 text-[10px] mt-1 truncate">
                      {dispEps} · {dispPE} · {dispDE} · {dispMgn}
                    </p>
                  </div>
                  <ArrowUpRight size={14} className="text-slate-600 group-hover:text-indigo-400 shrink-0 transition-colors mt-1" />
                </div>
              </button>
            );
          })}
          {picks.length === 0 && (
            <p className="text-slate-500 text-sm text-center py-6">No qualifying stocks found.</p>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-white/[0.06] shrink-0">
          <p className="text-slate-600 text-[10px]">
            10-factor analysis: EPS · P/E · Revenue Growth · D/E · Cash Flow · Net Margin · ROA · Moat · Dividend · Valuation · Not financial advice.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── MAIN DASHBOARD ────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate();
  const [showScan, setShowScan] = useState(false);
  const { stocks, isLoaded, loadMarket, tickPrices, fundamentals, fundamentalsStatus } = useMarketStore();

  useEffect(() => {
    if (!isLoaded) loadMarket();
  }, [isLoaded, loadMarket]);

  useEffect(() => {
    const interval = setInterval(tickPrices, 8000);
    return () => clearInterval(interval);
  }, [tickPrices]);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Loading market data…</p>
        </div>
      </div>
    );
  }

  const topGainers = selectTopGainers(stocks, 5);
  const topDecliners = selectTopDecliners(stocks, 5);
  const indexLevel = ftse100IndexLevel(stocks);
  const avgDayPerf = stocks.reduce((s, st) => s + st.dayPerf, 0) / stocks.length;
  const totalVolume = stocks.reduce((s, st) => s + st.volume, 0);
  const advancing = stocks.filter(s => s.dayPerf > 0).length;
  const declining = stocks.filter(s => s.dayPerf < 0).length;

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-white text-xl font-bold">Market Overview</h1>
          <p className="text-slate-500 text-sm mt-0.5">FTSE 100 — {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
        <button
          onClick={() => setShowScan(true)}
          className="flex items-center gap-2 px-3 py-2 bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 rounded-xl text-indigo-300 text-sm font-semibold transition-all shrink-0"
        >
          <ScanSearch size={15} />
          Stock Scan
        </button>
      </div>

      {showScan && (
        <StockScanModal
          stocks={stocks}
          fundamentals={fundamentals}
          fundamentalsStatus={fundamentalsStatus}
          onClose={() => setShowScan(false)}
          onSelect={symbol => navigate(`/stock/${symbol}`)}
        />
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SummaryCard label="FTSE 100" value={indexLevel.toLocaleString('en-GB')}
          sub={formatPerf(avgDayPerf)} subColor={perfColor(avgDayPerf)} />
        <SummaryCard label="Advancing" value={String(advancing)}
          sub={`${declining} declining`} subColor="text-slate-400" />
        <SummaryCard label="Total Volume" value={`${totalVolume.toFixed(0)}M`}
          sub="shares traded today" />
        <SummaryCard label="Market Status"
          value={(() => { const _d = new Date(); const _h = _d.getHours(); const _m = _d.getMinutes(); return (_h > 8 || (_h === 8 && _m >= 0)) && (_h < 16 || (_h === 16 && _m < 30)) ? 'OPEN' : 'CLOSED'; })()}
          sub="LSE 08:00 – 16:30 GMT" />
      </div>

      {/* Index chart */}
      <IndexChart stocks={stocks} />

      {/* Top gainers and decliners */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={15} className="text-emerald-400" />
            <h2 className="text-slate-200 font-semibold text-sm">Top Gainers Today</h2>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {topGainers.map(s => (
              <MoverCard key={s.id} stock={s} onClick={() => navigate(`/stock/${s.symbol}`)} />
            ))}
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2 mb-3">
            <TrendingDown size={15} className="text-red-400" />
            <h2 className="text-slate-200 font-semibold text-sm">Top Decliners Today</h2>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {topDecliners.map(s => (
              <MoverCard key={s.id} stock={s} onClick={() => navigate(`/stock/${s.symbol}`)} />
            ))}
          </div>
        </div>
      </div>

      {/* Sector heatmap */}
      <SectorHeatmap stocks={stocks} />
    </div>
  );
}
