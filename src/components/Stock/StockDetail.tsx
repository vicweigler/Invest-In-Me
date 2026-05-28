import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, TrendingUp, TrendingDown, Newspaper, Globe,
  Building2, Users, MapPin, ShoppingCart, BookOpen,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, Cell, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, ReferenceLine,
} from 'recharts';
import { StockData } from '../../types';
import { usePortfolioStore } from '../../store/portfolioStore';
import { useSettingsStore, calcTradeFee } from '../../store/settingsStore';
import { formatPrice, formatPriceRaw, formatPerf, formatMarketCap, formatVolume, perfColor, perfBg } from '../../data/generator';
import { getNewsForCompany, getGeopoliticalForSectors, SECTOR_ANALYSES } from '../../data/news';
import { SECTOR_COLORS } from '../../data/companies';
import clsx from 'clsx';

type Period = '1W' | '1M' | '3M' | '6M' | '1Y';

const PERIODS: Period[] = ['1W', '1M', '3M', '6M', '1Y'];

function PeriodBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={clsx('px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
        active ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.04]'
      )}
    >{label}</button>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-[#0F172A] border border-white/[0.06] rounded-xl p-4">
      <p className="text-slate-500 text-xs mb-1 uppercase tracking-wider">{label}</p>
      <p className="text-white font-mono font-bold text-lg">{value}</p>
      {sub && <p className="text-slate-500 text-xs mt-0.5">{sub}</p>}
    </div>
  );
}

// ── PERFORMANCE CHART ─────────────────────────────────────────────────────
function PerformanceChart({ stock, period }: { stock: StockData; period: Period }) {
  const dataMap: Record<Period, typeof stock.weeklyData> = {
    '1W': stock.weeklyData,
    '1M': stock.monthlyData,
    '3M': stock.threeMonthData,
    '6M': stock.sixMonthData,
    '1Y': stock.yearlyData,
  };
  const data = dataMap[period];
  if (!data?.length) return null;

  const start = data[0].price;
  const end = data[data.length - 1].price;
  const isPos = end >= start;
  const color = isPos ? '#10B981' : '#F43F5E';

  const chartData = data.map(p => ({
    date: p.date,
    price: p.price,
    open: p.open,
    high: p.high,
    low: p.low,
    pct: +((p.price - start) / start * 100).toFixed(2),
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="price-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.25} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
        <XAxis dataKey="date" tick={{ fill: '#475569', fontSize: 10 }}
          tickFormatter={d => {
            if (!d) return '';
            const parts = d.split('-');
            return period === '1W' ? `${parts[2]}/${parts[1]}` : `${parts[2]}/${parts[1]}`;
          }}
          interval={Math.max(1, Math.floor(chartData.length / 6))}
        />
        <YAxis tick={{ fill: '#475569', fontSize: 10 }} domain={['auto', 'auto']}
          tickFormatter={v => formatPrice(v)} />
        <Tooltip
          contentStyle={{ background: '#1E293B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12, color: '#F1F5F9' }}
          formatter={(v: number, name: string) => [
            name === 'price' ? formatPrice(v) : `${v > 0 ? '+' : ''}${v}%`,
            name === 'price' ? 'Price' : 'Change',
          ]}
          labelStyle={{ color: '#94A3B8', marginBottom: 4 }}
        />
        <ReferenceLine y={start} stroke="rgba(255,255,255,0.15)" strokeDasharray="4 4" />
        <Area type="monotone" dataKey="price" stroke={color} strokeWidth={2}
          fill="url(#price-grad)" dot={false} activeDot={{ r: 4, fill: color }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ── PERFORMANCE BAR CHART ─────────────────────────────────────────────────
function PerfCompareChart({ stock }: { stock: StockData }) {
  const data = [
    { period: 'Today', value: stock.dayPerf },
    { period: '1 Week', value: stock.weekPerf },
    { period: '1 Month', value: stock.monthPerf },
    { period: '3 Month', value: stock.threeMonthPerf },
    { period: '6 Month', value: stock.sixMonthPerf },
    { period: '1 Year', value: stock.annualPerf },
  ];
  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={data} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
        <XAxis dataKey="period" tick={{ fill: '#475569', fontSize: 10 }} />
        <YAxis tick={{ fill: '#475569', fontSize: 10 }} tickFormatter={v => `${v}%`} />
        <Tooltip
          contentStyle={{ background: '#1E293B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12, color: '#F1F5F9' }}
          formatter={(v: number) => [`${v > 0 ? '+' : ''}${v.toFixed(2)}%`, 'Return']}
        />
        <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.value >= 0 ? '#10B981' : '#F43F5E'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── TRADE MODAL ───────────────────────────────────────────────────────────
function TradeModal({ stock, onClose }: { stock: StockData; onClose: () => void }) {
  const { cashBalance, holdings, buyShares, sellShares, isInitialised, setInitialBalance } = usePortfolioStore();
  const { tradingCosts } = useSettingsStore();
  const [mode, setMode] = useState<'BUY' | 'SELL'>('BUY');
  const [inputMode, setInputMode] = useState<'shares' | 'amount'>('shares');
  const [sharesInput, setSharesInput] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [balanceInput, setBalanceInput] = useState('');
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  const priceGBP = stock.currentPrice / 100; // pence → GBP

  // Derive shares from whichever input is active
  const sharesFromAmount = amountInput
    ? Math.floor(parseFloat(amountInput) / priceGBP)
    : 0;
  const shares = inputMode === 'shares'
    ? (parseInt(sharesInput) || 0)
    : sharesFromAmount;

  const tradeValueGBP = shares * priceGBP;
  const feeKey = mode === 'BUY' ? 'buy' : 'sell';
  const fee = calcTradeFee(
    feeKey === 'buy' ? tradingCosts.buyFeeType : tradingCosts.sellFeeType,
    feeKey === 'buy' ? tradingCosts.buyFeeAmount : tradingCosts.sellFeeAmount,
    tradeValueGBP
  );
  const totalWithFee = mode === 'BUY' ? tradeValueGBP + fee : tradeValueGBP - fee;

  // Unspent cash when buying by amount
  const unspent = inputMode === 'amount' && mode === 'BUY' && parseFloat(amountInput) > 0
    ? Math.max(0, parseFloat(amountInput) - fee - tradeValueGBP)
    : null;

  const holding = holdings.find(h => h.companyId === stock.id);

  function handleTrade() {
    if (!shares || shares <= 0) { setMessage({ text: 'Enter a valid amount.', ok: false }); return; }
    if (mode === 'BUY') {
      const result = buyShares({ companyId: stock.id, symbol: stock.symbol, companyName: stock.name, sector: stock.sector, shares, pricePerShare: stock.currentPrice });
      setMessage({ text: result.message, ok: result.success });
      if (result.success) { setSharesInput(''); setAmountInput(''); }
    } else {
      const result = sellShares({ companyId: stock.id, symbol: stock.symbol, shares, pricePerShare: stock.currentPrice });
      setMessage({ text: result.message, ok: result.success });
      if (result.success) { setSharesInput(''); setAmountInput(''); }
    }
  }

  function handleModeChange(m: 'BUY' | 'SELL') {
    setMode(m);
    setMessage(null);
    setSharesInput('');
    setAmountInput('');
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-[#0F172A] border border-white/[0.1] rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-white font-bold text-lg">Shadow Trade</h2>
            <p className="text-slate-400 text-sm">{stock.symbol} — {stock.name}</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 text-xl">✕</button>
        </div>

        {!isInitialised ? (
          <div className="space-y-3">
            <p className="text-slate-400 text-sm">Set your starting portfolio balance to begin shadow trading.</p>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">£</span>
              <input
                type="number" value={balanceInput} onChange={e => setBalanceInput(e.target.value)}
                placeholder="10000"
                className="w-full bg-[#1E293B] border border-white/[0.08] rounded-lg pl-8 pr-3 py-2.5 text-white font-mono focus:outline-none focus:border-indigo-500/50"
              />
            </div>
            <button
              onClick={() => { const v = parseFloat(balanceInput); if (v > 0) setInitialBalance(v); }}
              className="w-full bg-indigo-500 hover:bg-indigo-400 text-white font-semibold py-2.5 rounded-lg transition-all"
            >Set Balance</button>
          </div>
        ) : (
          <>
            {/* Balance display */}
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 mb-4 flex justify-between items-center">
              <span className="text-slate-400 text-sm">Available Cash</span>
              <span className="text-white font-mono font-semibold">£{cashBalance.toFixed(2)}</span>
            </div>

            {/* BUY / SELL tabs */}
            <div className="flex gap-1 mb-4 bg-white/[0.03] rounded-lg p-1">
              {(['BUY', 'SELL'] as const).map(m => (
                <button key={m}
                  onClick={() => handleModeChange(m)}
                  className={clsx('flex-1 py-2 rounded-lg text-sm font-semibold transition-all',
                    mode === m
                      ? m === 'BUY' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                      : 'text-slate-500 hover:text-slate-300'
                  )}
                >{m}</button>
              ))}
            </div>

            {/* Current price + holding */}
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-400">Current Price</span>
              <span className="text-white font-mono font-semibold">{formatPrice(stock.currentPrice)}</span>
            </div>
            {holding && (
              <div className="flex justify-between text-sm mb-3">
                <span className="text-slate-400">You Hold</span>
                <span className="text-white font-mono">{holding.shares.toLocaleString()} shares</span>
              </div>
            )}

            {/* Input mode toggle — only for BUY */}
            {mode === 'BUY' && (
              <div className="flex gap-1 mb-3 bg-white/[0.03] rounded-lg p-1">
                {(['shares', 'amount'] as const).map(im => (
                  <button key={im}
                    onClick={() => { setInputMode(im); setSharesInput(''); setAmountInput(''); setMessage(null); }}
                    className={clsx('flex-1 py-1.5 rounded-md text-xs font-semibold transition-all',
                      inputMode === im
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/20'
                        : 'text-slate-500 hover:text-slate-300'
                    )}
                  >{im === 'shares' ? 'By Shares' : 'By Amount (£)'}</button>
                ))}
              </div>
            )}

            {/* Input field */}
            <div className="mb-4">
              {(mode === 'SELL' || inputMode === 'shares') ? (
                <>
                  <label className="text-slate-400 text-xs mb-1.5 block">Number of Shares</label>
                  <input
                    type="number" min="1" value={sharesInput} onChange={e => setSharesInput(e.target.value)}
                    placeholder="0"
                    className="w-full bg-[#1E293B] border border-white/[0.08] rounded-lg px-3 py-2.5 text-white font-mono focus:outline-none focus:border-indigo-500/50"
                  />
                </>
              ) : (
                <>
                  <label className="text-slate-400 text-xs mb-1.5 block">Amount to invest (£)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">£</span>
                    <input
                      type="number" min="0" step="0.01" value={amountInput} onChange={e => setAmountInput(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-[#1E293B] border border-white/[0.08] rounded-lg pl-8 pr-3 py-2.5 text-white font-mono focus:outline-none focus:border-indigo-500/50"
                    />
                  </div>
                  {shares > 0 && (
                    <p className="text-indigo-400 text-xs mt-1.5 font-mono">
                      = {shares.toLocaleString()} whole shares at {formatPrice(stock.currentPrice)}
                    </p>
                  )}
                  {sharesFromAmount === 0 && parseFloat(amountInput) > 0 && (
                    <p className="text-amber-400 text-xs mt-1.5">
                      Insufficient for 1 share (min £{priceGBP.toFixed(2)})
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Cost breakdown */}
            {shares > 0 && (
              <div className="bg-white/[0.03] rounded-xl p-3 space-y-1.5 mb-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">{shares.toLocaleString()} shares × {formatPrice(stock.currentPrice)}</span>
                  <span className="text-slate-200 font-mono">£{tradeValueGBP.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">
                    {mode === 'BUY' ? 'Buy' : 'Sell'} commission
                    {tradingCosts[`${feeKey}FeeType`] === 'percentage'
                      ? ` (${tradingCosts[`${feeKey}FeeAmount`]}%)`
                      : ''}
                  </span>
                  <span className="text-amber-400/80 font-mono">
                    {mode === 'BUY' ? '+' : '-'}£{fee.toFixed(2)}
                  </span>
                </div>
                {unspent !== null && unspent > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-500 text-xs">Unspent (stays in cash)</span>
                    <span className="text-slate-500 font-mono text-xs">£{unspent.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t border-white/[0.06] pt-1.5 flex justify-between font-semibold">
                  <span className="text-slate-300">{mode === 'BUY' ? 'Total Cost' : 'Net Proceeds'}</span>
                  <span className={clsx('font-mono', mode === 'BUY' ? 'text-red-400' : 'text-emerald-400')}>
                    £{totalWithFee.toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            {message && (
              <div className={clsx('rounded-lg px-3 py-2 text-sm mb-3', message.ok ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400')}>
                {message.text}
              </div>
            )}

            <button
              onClick={handleTrade}
              className={clsx('w-full py-3 rounded-xl font-semibold text-sm transition-all',
                mode === 'BUY'
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-white'
                  : 'bg-red-500 hover:bg-red-400 text-white'
              )}
            >{mode === 'BUY' ? `Buy ${shares || 0} Shares` : `Sell ${shares || 0} Shares`}</button>
          </>
        )}
      </div>
    </div>
  );
}

// ── RESEARCH PANEL ────────────────────────────────────────────────────────
function ResearchPanel({ stock, onClose }: { stock: StockData; onClose: () => void }) {
  const news = getNewsForCompany(stock.symbol, stock.sector);
  const geoEvents = getGeopoliticalForSectors([stock.sector]);
  const analysis = SECTOR_ANALYSES[stock.sector];
  const sectorColor = SECTOR_COLORS[stock.sector] ?? '#6366F1';

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-xl bg-[#0D1424] border-l border-white/[0.08] flex flex-col h-full overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-[#0D1424] border-b border-white/[0.08] px-5 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <BookOpen size={15} className="text-indigo-400" />
            <span className="text-white font-semibold">Research: {stock.symbol}</span>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 text-lg">✕</button>
        </div>

        <div className="p-5 space-y-6">
          {/* About */}
          <section>
            <h3 className="text-slate-300 font-semibold text-sm mb-3 flex items-center gap-2">
              <Building2 size={13} className="text-indigo-400" />
              About {stock.name}
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed">{stock.description}</p>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div className="bg-white/[0.03] rounded-lg p-3">
                <p className="text-slate-600 text-xs">Founded</p>
                <p className="text-slate-300 text-sm font-semibold">{stock.founded}</p>
              </div>
              <div className="bg-white/[0.03] rounded-lg p-3">
                <p className="text-slate-600 text-xs">Employees</p>
                <p className="text-slate-300 text-sm font-semibold">{stock.employees.toLocaleString()}</p>
              </div>
              <div className="bg-white/[0.03] rounded-lg p-3 col-span-2">
                <p className="text-slate-600 text-xs flex items-center gap-1"><MapPin size={10} /> Headquarters</p>
                <p className="text-slate-300 text-sm font-semibold">{stock.headquarters}</p>
              </div>
            </div>
          </section>

          {/* Sector Analysis */}
          {analysis && (
            <section>
              <h3 className="text-slate-300 font-semibold text-sm mb-3 flex items-center gap-2">
                <BarChart2Icon size={13} className="text-indigo-400" />
                Sector Analysis — {stock.sector}
              </h3>
              <div className={clsx('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold mb-3',
                analysis.outlook === 'Bullish' ? 'bg-emerald-500/15 text-emerald-400'
                  : analysis.outlook === 'Bearish' ? 'bg-red-500/15 text-red-400'
                  : 'bg-amber-500/15 text-amber-400'
              )}>
                {analysis.outlook === 'Bullish' ? <TrendingUp size={11} /> : analysis.outlook === 'Bearish' ? <TrendingDown size={11} /> : null}
                {analysis.outlook}
              </div>
              <p className="text-slate-400 text-sm leading-relaxed mb-3">{analysis.summary}</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/[0.03] rounded-lg p-3">
                  <p className="text-emerald-400 text-xs font-semibold mb-2">Key Drivers</p>
                  <ul className="space-y-1">
                    {analysis.keyDrivers.map((d, i) => (
                      <li key={i} className="text-slate-400 text-xs flex items-start gap-1.5">
                        <span className="text-emerald-500 mt-0.5">•</span>{d}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-white/[0.03] rounded-lg p-3">
                  <p className="text-red-400 text-xs font-semibold mb-2">Key Risks</p>
                  <ul className="space-y-1">
                    {analysis.risks.map((r, i) => (
                      <li key={i} className="text-slate-400 text-xs flex items-start gap-1.5">
                        <span className="text-red-500 mt-0.5">•</span>{r}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>
          )}

          {/* News */}
          <section>
            <h3 className="text-slate-300 font-semibold text-sm mb-3 flex items-center gap-2">
              <Newspaper size={13} className="text-indigo-400" />
              Latest News
            </h3>
            <div className="space-y-3">
              {news.map(article => (
                <div key={article.id} className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-4">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h4 className="text-slate-200 text-sm font-medium leading-snug">{article.title}</h4>
                    <span className={clsx('shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded',
                      article.sentiment === 'positive' ? 'bg-emerald-500/15 text-emerald-400'
                        : article.sentiment === 'negative' ? 'bg-red-500/15 text-red-400'
                        : 'bg-slate-500/15 text-slate-400'
                    )}>{article.sentiment}</span>
                  </div>
                  <p className="text-slate-500 text-xs leading-relaxed">{article.summary}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-slate-600 text-xs">{article.source}</span>
                    <span className="text-slate-700 text-xs">
                      {new Date(article.publishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </span>
                    <div className="flex gap-1">
                      {article.tags.slice(0, 2).map(t => (
                        <span key={t} className="text-[10px] text-slate-600 bg-white/[0.03] px-1.5 py-0.5 rounded">#{t}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Geopolitical Events */}
          {geoEvents.length > 0 && (
            <section>
              <h3 className="text-slate-300 font-semibold text-sm mb-3 flex items-center gap-2">
                <Globe size={13} className="text-indigo-400" />
                Geopolitical & Macro Events
              </h3>
              <div className="space-y-3">
                {geoEvents.map(event => (
                  <div key={event.id} className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-4">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <h4 className="text-slate-200 text-sm font-medium leading-snug">{event.title}</h4>
                      <span className={clsx('shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase',
                        event.impact === 'high' ? 'bg-red-500/15 text-red-400'
                          : event.impact === 'medium' ? 'bg-amber-500/15 text-amber-400'
                          : 'bg-slate-500/15 text-slate-400'
                      )}>{event.impact}</span>
                    </div>
                    <p className="text-slate-500 text-xs leading-relaxed">{event.description}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-slate-600 text-xs flex items-center gap-1">
                        <Globe size={10} />{event.region}
                      </span>
                      <span className="text-slate-700 text-xs">
                        {new Date(event.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

// Lucide doesn't export BarChart2Icon as that name, so alias:
const BarChart2Icon = ({ size, className }: { size: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /><line x1="2" y1="20" x2="22" y2="20" />
  </svg>
);

// ── MAIN STOCK DETAIL ─────────────────────────────────────────────────────
export default function StockDetail({ stock }: { stock: StockData }) {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<Period>('1M');
  const [showTrade, setShowTrade] = useState(false);
  const [showResearch, setShowResearch] = useState(false);

  const { holdings } = usePortfolioStore();
  const holding = holdings.find(h => h.companyId === stock.id);
  const sectorColor = SECTOR_COLORS[stock.sector] ?? '#6366F1';

  const perfByPeriod: Record<Period, number> = {
    '1W': stock.weekPerf,
    '1M': stock.monthPerf,
    '3M': stock.threeMonthPerf,
    '6M': stock.sixMonthPerf,
    '1Y': stock.annualPerf,
  };
  const currentPerf = perfByPeriod[period];

  return (
    <>
      <div className="p-4 sm:p-6 space-y-6">
        {/* Back button */}
        <button onClick={() => navigate('/market')}
          className="flex items-center gap-2 text-slate-400 hover:text-slate-200 text-sm transition-colors">
          <ArrowLeft size={14} /> Back to FTSE 100
        </button>

        {/* Stock header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold text-white shrink-0"
              style={{ backgroundColor: `${sectorColor}20`, border: `1px solid ${sectorColor}30` }}>
              {stock.symbol.slice(0, 2)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-white text-2xl font-bold">{stock.name}</h1>
                <span className="text-slate-400 font-mono text-lg">{stock.symbol}</span>
                <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ backgroundColor: `${sectorColor}15`, color: sectorColor }}>
                  {stock.sector}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-2 flex-wrap">
                <span className="text-white font-mono text-3xl font-bold">{formatPrice(stock.currentPrice)}</span>
                <div className={clsx('flex items-center gap-1.5 text-sm font-semibold px-2.5 py-1 rounded-lg', perfBg(stock.dayPerf))}>
                  {stock.dayPerf >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                  {formatPerf(stock.dayPerf)} today
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:shrink-0">
            <button
              onClick={() => setShowResearch(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0F172A] border border-white/[0.08] hover:border-indigo-500/30 text-slate-300 hover:text-indigo-300 rounded-xl text-sm font-semibold transition-all"
            >
              <BookOpen size={14} /> Research
            </button>
            <button
              onClick={() => setShowTrade(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl text-sm font-semibold transition-all"
            >
              <ShoppingCart size={14} /> Shadow Trade
            </button>
          </div>
        </div>

        {/* If in portfolio, show holding summary */}
        {holding && (
          <div className="bg-indigo-500/[0.07] border border-indigo-500/20 rounded-xl px-4 py-3 flex items-center gap-6 text-sm">
            <span className="text-indigo-300 font-semibold">📂 In Portfolio</span>
            <span className="text-slate-300">{holding.shares.toLocaleString()} shares</span>
            <span className="text-slate-300">Avg: {formatPrice(holding.avgBuyPrice)}</span>
            <span className="text-slate-300">Value: £{((holding.shares * stock.currentPrice) / 100).toFixed(2)}</span>
            {(() => {
              const pnl = ((stock.currentPrice - holding.avgBuyPrice) / holding.avgBuyPrice) * 100;
              return <span className={clsx('font-semibold', perfColor(pnl))}>{formatPerf(pnl)}</span>;
            })()}
          </div>
        )}

        {/* Key stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3">
          <StatCard label="Market Cap" value={formatMarketCap(stock.marketCap)} />
          <StatCard label="52W High" value={formatPrice(stock.high52w)} />
          <StatCard label="52W Low" value={formatPrice(stock.low52w)} />
          <StatCard label="Volume" value={formatVolume(stock.volume)} sub="daily avg" />
          <StatCard label="P/E Ratio" value={stock.peRatio != null ? stock.peRatio.toFixed(1) : 'N/A'} />
          <StatCard label="Div. Yield" value={stock.dividendYield != null ? `${stock.dividendYield.toFixed(1)}%` : 'N/A'} />
        </div>

        {/* Price chart */}
        <div className="bg-[#0F172A] border border-white/[0.06] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-slate-200 font-semibold text-sm">{stock.symbol} Price Chart</h2>
              <span className={clsx('text-sm font-semibold', perfColor(currentPerf))}>
                {formatPerf(currentPerf)}
              </span>
            </div>
            <div className="flex items-center gap-1">
              {PERIODS.map(p => (
                <PeriodBtn key={p} label={p} active={period === p} onClick={() => setPeriod(p)} />
              ))}
            </div>
          </div>
          <PerformanceChart stock={stock} period={period} />
        </div>

        {/* Performance comparison */}
        <div className="bg-[#0F172A] border border-white/[0.06] rounded-xl p-5">
          <h2 className="text-slate-200 font-semibold text-sm mb-4">Performance by Period</h2>
          <PerfCompareChart stock={stock} />
        </div>

        {/* Performance badges */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          {[
            { label: 'Today', v: stock.dayPerf },
            { label: '1 Week', v: stock.weekPerf },
            { label: '1 Month', v: stock.monthPerf },
            { label: '3 Months', v: stock.threeMonthPerf },
            { label: '6 Months', v: stock.sixMonthPerf },
            { label: '1 Year', v: stock.annualPerf },
          ].map(({ label, v }) => (
            <div key={label} className="bg-[#0F172A] border border-white/[0.06] rounded-xl p-3 text-center">
              <p className="text-slate-500 text-xs mb-1">{label}</p>
              <p className={clsx('text-lg font-bold font-mono', perfColor(v))}>{formatPerf(v)}</p>
            </div>
          ))}
        </div>
      </div>

      {showTrade && <TradeModal stock={stock} onClose={() => setShowTrade(false)} />}
      {showResearch && <ResearchPanel stock={stock} onClose={() => setShowResearch(false)} />}
    </>
  );
}
