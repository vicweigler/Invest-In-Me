import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  AreaChart, Area, PieChart, Pie, Cell, Tooltip, XAxis, YAxis,
  ResponsiveContainer, CartesianGrid, BarChart, Bar,
} from 'recharts';
import { Briefcase, TrendingUp, TrendingDown, DollarSign, ArrowUpRight, ArrowDownRight, RefreshCw, ChevronDown, ChevronUp, Receipt, Landmark, CalendarRange, Settings, AlertTriangle, Users, Trophy, ArrowLeft, X, Medal } from 'lucide-react';
import { usePortfolioStore, computePortfolioStats, EnrichedHolding } from '../../store/portfolioStore';
import { useSettingsStore, CGT_RATES, TAX_BRACKET_LABELS, calcTradeFee } from '../../store/settingsStore';
import { useAuthStore } from '../../store/authStore';
import { Holding } from '../../types';
import { useMarketStore, selectBySymbol } from '../../store/marketStore';
import { formatPrice, formatPerf, perfColor, perfBg } from '../../data/generator';
import { SECTOR_COLORS } from '../../data/companies';
import { fetchLeaderboard, PublicProfile } from '../../lib/firestoreSync';
import clsx from 'clsx';

// ── COMPARE MODAL ─────────────────────────────────────────────────────────
interface RankedProfile extends PublicProfile {
  liveValue: number;
  pnl: number;
  pnlPct: number;
  rank: number;
}

function medalColor(rank: number) {
  if (rank === 1) return 'text-yellow-400';
  if (rank === 2) return 'text-slate-300';
  if (rank === 3) return 'text-amber-600';
  return 'text-slate-600';
}

function CompareModal({
  currentUid, currentDisplayName, currentValue, currentInitial, currentCash, currentHoldings, stocks, onClose,
}: {
  currentUid: string;
  currentDisplayName: string;
  currentValue: number;
  currentInitial: number;
  currentCash: number;
  currentHoldings: EnrichedHolding[];
  stocks: ReturnType<typeof useMarketStore.getState>['stocks'];
  onClose: () => void;
}) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [profiles, setProfiles] = useState<PublicProfile[]>([]);
  const [rival, setRival] = useState<RankedProfile | null>(null);
  const [rivalHoldingsOpen, setRivalHoldingsOpen] = useState(true);
  const [myHoldingsOpen, setMyHoldingsOpen] = useState(false);

  useEffect(() => {
    fetchLeaderboard()
      .then(data => { setProfiles(data); setStatus('loaded'); })
      .catch(() => setStatus('error'));
  }, []);

  /** Compute live total portfolio value for a public profile using current market prices. */
  function liveValue(profile: PublicProfile): number {
    const hv = profile.holdings.reduce((sum, h) => {
      const stock = stocks.find(s => s.id === h.companyId);
      return sum + (stock ? (h.shares * stock.currentPrice) / 100 : 0);
    }, 0);
    return profile.cashBalance + hv;
  }

  const ranked: RankedProfile[] = useMemo(() => {
    // Include all fetched profiles + inject current user if not in list
    const map = new Map<string, PublicProfile>(profiles.map(p => [p.uid, p]));
    if (!map.has(currentUid)) {
      map.set(currentUid, {
        uid: currentUid,
        displayName: currentDisplayName,
        initialBalance: currentInitial,
        cashBalance: currentCash,
        holdings: currentHoldings.map(h => ({
          companyId: h.companyId,
          symbol: h.symbol,
          companyName: h.companyName,
          sector: h.sector,
          shares: h.shares,
          avgBuyPrice: h.avgBuyPrice,
        })),
        updatedAt: new Date().toISOString(),
      });
    }
    const list = Array.from(map.values())
      .map(p => {
        const v = p.uid === currentUid ? currentValue : liveValue(p);
        const pnl = v - p.initialBalance;
        const pnlPct = p.initialBalance > 0 ? (pnl / p.initialBalance) * 100 : 0;
        return { ...p, liveValue: v, pnl, pnlPct, rank: 0 };
      })
      .sort((a, b) => b.pnlPct - a.pnlPct);
    list.forEach((p, i) => { p.rank = i + 1; });
    return list;
  }, [profiles, stocks, currentValue]);

  const me = ranked.find(p => p.uid === currentUid);
  const maxAbsPct = Math.max(0.01, ...ranked.map(p => Math.abs(p.pnlPct)));

  // ── Leaderboard view ────────────────────────────────────────────────────
  const LeaderboardView = () => (
    <>
      <div className="flex items-center justify-between p-5 border-b border-white/[0.06] shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-violet-500/15 border border-violet-500/20 flex items-center justify-center">
            <Trophy size={16} className="text-violet-400" />
          </div>
          <div>
            <h2 className="text-white font-bold text-sm">Leaderboard</h2>
            <p className="text-slate-500 text-xs">
              {status === 'loaded' ? `${ranked.length} player${ranked.length !== 1 ? 's' : ''} · ranked by return %` : 'Loading…'}
            </p>
          </div>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-slate-300 p-1.5 rounded-lg hover:bg-white/[0.04] transition-all">
          <X size={16} />
        </button>
      </div>

      <div className="overflow-y-auto p-3 space-y-1">
        {status === 'loading' && (
          <div className="flex items-center justify-center py-10">
            <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {status === 'error' && (
          <p className="text-red-400 text-sm text-center py-8">Failed to load leaderboard. Please try again.</p>
        )}
        {status === 'loaded' && ranked.map(p => {
          const isMe = p.uid === currentUid;
          const avatarColor = ['#6366F1', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6'][
            p.displayName.charCodeAt(0) % 6
          ];
          return (
            <button
              key={p.uid}
              disabled={isMe}
              onClick={() => { if (!isMe) setRival(p); }}
              className={clsx(
                'w-full p-3 rounded-xl transition-all text-left flex items-center gap-3 relative overflow-hidden',
                isMe
                  ? 'bg-white/[0.04] border border-white/[0.08] cursor-default'
                  : p.rank === 1
                    ? 'border border-yellow-500/[0.15] bg-yellow-500/[0.04] hover:bg-yellow-500/[0.07] cursor-pointer group'
                    : p.rank === 2
                      ? 'border border-slate-400/[0.12] bg-slate-400/[0.03] hover:bg-slate-400/[0.06] cursor-pointer group'
                      : p.rank === 3
                        ? 'border border-amber-600/[0.12] bg-amber-600/[0.03] hover:bg-amber-600/[0.06] cursor-pointer group'
                        : 'hover:bg-white/[0.04] cursor-pointer group',
              )}
            >
              {/* Rank */}
              <span className={clsx('w-6 text-center text-sm font-bold shrink-0', medalColor(p.rank))}>
                {p.rank <= 3 ? <Medal size={16} className={clsx('mx-auto', medalColor(p.rank))} /> : p.rank}
              </span>
              {/* Avatar */}
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                style={{ backgroundColor: `${avatarColor}30`, border: `1px solid ${avatarColor}50` }}>
                {p.displayName.charAt(0).toUpperCase()}
              </div>
              {/* Name + stats */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-white text-sm font-semibold truncate">{p.displayName}</span>
                  {isMe && <span className="text-[10px] bg-violet-500/20 text-violet-400 px-1.5 py-0.5 rounded font-semibold shrink-0">You</span>}
                </div>
                <p className="text-slate-500 text-xs font-mono">
                  £{p.liveValue.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              {/* P&L */}
              <div className="text-right shrink-0">
                <p className={clsx('font-mono text-sm font-bold', p.pnl >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                  {p.pnl >= 0 ? '+' : ''}{p.pnlPct.toFixed(2)}%
                </p>
                <p className={clsx('font-mono text-xs', p.pnl >= 0 ? 'text-emerald-600' : 'text-red-600')}>
                  {p.pnl >= 0 ? '+' : ''}£{Math.abs(p.pnl).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              {!isMe && <ArrowUpRight size={14} className="text-slate-600 group-hover:text-violet-400 shrink-0 transition-colors" />}
              {/* Return % progress bar */}
              <div className="absolute bottom-0 left-0 h-[2px] w-full bg-white/[0.03]">
                <div
                  className={clsx('h-full transition-all', p.pnlPct >= 0 ? 'bg-emerald-500/50' : 'bg-red-500/50')}
                  style={{ width: `${(Math.abs(p.pnlPct) / maxAbsPct) * 100}%` }}
                />
              </div>
            </button>
          );
        })}
      </div>

      <div className="px-5 py-3 border-t border-white/[0.06] shrink-0">
        <p className="text-slate-600 text-[10px]">Click any player to see a side-by-side comparison. Your portfolio is published automatically when you trade.</p>
      </div>
    </>
  );

  // ── Compare view ────────────────────────────────────────────────────────
  const CompareView = () => {
    if (!rival || !me) return null;

    const rivalHoldings = rival.holdings.map(h => {
      const stock = stocks.find(s => s.id === h.companyId);
      const currentPrice = stock?.currentPrice ?? h.avgBuyPrice;
      const value = (h.shares * currentPrice) / 100;
      const costBasis = (h.shares * h.avgBuyPrice) / 100;
      const pnl = value - costBasis;
      return { ...h, currentPrice, value, costBasis, pnl };
    }).sort((a, b) => b.value - a.value);

    const BAR_H = 90;
    const barMetrics = [
      { key: 'value',  label: 'Total Value', myVal: me.liveValue, theirVal: rival.liveValue, fmt: (v: number) => `£${(v / 1000).toFixed(0)}k` },
      { key: 'return', label: 'Return %',     myVal: me.pnlPct,    theirVal: rival.pnlPct,   fmt: (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(1)}%` },
      { key: 'pnl',    label: 'Total P&L',   myVal: me.pnl,       theirVal: rival.pnl,      fmt: (v: number) => `${v >= 0 ? '+' : '-'}£${(Math.abs(v) / 1000).toFixed(1)}k` },
    ];

    const winner = me.pnlPct >= rival.pnlPct ? me : rival;
    const iAmWinning = me.pnlPct >= rival.pnlPct;
    const minPct = Math.min(me.pnlPct, rival.pnlPct);
    const myPctAdj = me.pnlPct - Math.min(0, minPct);
    const theirPctAdj = rival.pnlPct - Math.min(0, minPct);
    const splitTotal = myPctAdj + theirPctAdj;
    const myHeadShare = splitTotal > 0 ? Math.max(5, Math.min(95, (myPctAdj / splitTotal) * 100)) : 50;
    const pnlGap = Math.abs(me.pnlPct - rival.pnlPct);

    return (
      <>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06] shrink-0">
          <div className="flex items-center gap-2.5">
            <button onClick={() => setRival(null)}
              className="text-slate-500 hover:text-slate-300 p-1 rounded-lg hover:bg-white/[0.04] transition-all">
              <ArrowLeft size={16} />
            </button>
            <div>
              <h2 className="text-white font-bold text-sm">{me.displayName} vs {rival.displayName}</h2>
              <p className={clsx('text-xs font-semibold', iAmWinning ? 'text-emerald-400' : 'text-amber-400')}>
                {iAmWinning ? '🏆 You are winning' : `🏆 ${rival.displayName} is winning`}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 p-1.5 rounded-lg hover:bg-white/[0.04] transition-all">
            <X size={16} />
          </button>
        </div>

        <div className="overflow-y-auto p-4 space-y-4">
          {/* P&L% banner */}
          <div className="grid grid-cols-2 gap-3">
            {[me, rival].map((p, i) => {
              const isWinner = p.uid === winner.uid;
              return (
                <div key={i} className={clsx(
                  'rounded-xl p-4 text-center border',
                  isWinner ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-white/[0.03] border-white/[0.06]'
                )}>
                  <p className="text-slate-500 text-[10px] uppercase tracking-wider mb-1">
                    {p.uid === currentUid ? 'You' : p.displayName}
                    {isWinner && ' 🏆'}
                  </p>
                  <p className={clsx('font-mono font-bold text-2xl', p.pnl >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                    {p.pnlPct >= 0 ? '+' : ''}{p.pnlPct.toFixed(2)}%
                  </p>
                  <p className={clsx('font-mono text-xs mt-0.5', p.pnl >= 0 ? 'text-emerald-600' : 'text-red-600')}>
                    {p.pnl >= 0 ? '+' : ''}£{Math.abs(p.pnl).toFixed(2)} return
                  </p>
                </div>
              );
            })}
          </div>

          {/* VS Bar Charts */}
          <div className="flex gap-3">
            {[true, false].map(pIsMe => {
              const player = pIsMe ? me : rival;
              const isWinner = player.uid === winner.uid;
              return (
                <div key={player.uid} className={clsx(
                  'flex-1 rounded-xl p-4 border',
                  pIsMe ? 'bg-white/[0.06] border-white/[0.10]' : 'bg-emerald-500/10 border-emerald-500/20',
                )}>
                  <p className={clsx('text-center text-xs font-bold mb-4', pIsMe ? 'text-slate-300' : 'text-emerald-400')}>
                    {pIsMe ? 'You' : player.displayName.split(' ')[0]}{isWinner ? ' 👑' : ''}
                  </p>
                  <div className="flex items-end justify-around gap-2" style={{ height: `${BAR_H}px` }}>
                    {barMetrics.map(m => {
                      const val = pIsMe ? m.myVal : m.theirVal;
                      const maxAbs = Math.max(Math.abs(m.myVal), Math.abs(m.theirVal), 0.01);
                      const barH = Math.max(6, (Math.abs(val) / maxAbs) * BAR_H * 0.80);
                      const isBetterHere = pIsMe ? m.myVal >= m.theirVal : m.theirVal >= m.myVal;
                      const isNeg = val < 0;
                      return (
                        <div key={m.key} className="flex-1 flex flex-col items-center justify-end gap-1 h-full">
                          <p className={clsx('text-[9px] font-mono font-bold text-center', isNeg ? 'text-red-400' : isBetterHere ? 'text-emerald-400' : 'text-slate-400')}>
                            {m.fmt(val)}
                          </p>
                          <div
                            className={clsx('w-full rounded-t transition-all', isNeg ? 'bg-red-500/80' : isBetterHere ? 'bg-emerald-500' : 'bg-slate-600/70')}
                            style={{ height: `${barH}px` }}
                          />
                          <p className="text-[8px] text-slate-600 text-center leading-tight">{m.label}</p>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-4 pt-3 border-t border-white/[0.06] grid grid-cols-2 gap-2 text-center">
                    <div>
                      <p className="text-[9px] text-slate-500 uppercase tracking-wider mb-0.5">Started With</p>
                      <p className="font-mono font-bold text-xs text-slate-200">£{(pIsMe ? me : rival).initialBalance.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-500 uppercase tracking-wider mb-0.5">Holdings</p>
                      <p className="font-mono font-bold text-xs text-slate-200">{pIsMe ? currentHoldings.length : rival.holdings.length}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Rival's holdings */}
          <div className="bg-[#0A0F1E] border border-white/[0.06] rounded-xl overflow-hidden">
            <button
              className="w-full flex items-center justify-between px-4 py-3 text-slate-200 font-semibold text-sm"
              onClick={() => setRivalHoldingsOpen(o => !o)}
            >
              <span>{rival.displayName}'s Holdings ({rivalHoldings.length})</span>
              {rivalHoldingsOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            {rivalHoldingsOpen && (
              rivalHoldings.length === 0
                ? <p className="text-slate-600 text-sm text-center py-5 border-t border-white/[0.06]">No holdings yet.</p>
                : (
                  <div className="overflow-x-auto border-t border-white/[0.06]">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                          {['Stock', 'Shares', 'Value', 'P&L'].map(h => (
                            <th key={h} className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.04]">
                        {rivalHoldings.map(h => (
                          <tr key={h.companyId}>
                            <td className="px-3 py-2.5">
                              <p className="text-white text-xs font-bold">{h.symbol}</p>
                              <p className="text-slate-600 text-[10px] truncate max-w-[100px]">{h.companyName}</p>
                            </td>
                            <td className="px-3 py-2.5 text-slate-400 font-mono text-xs">{h.shares.toLocaleString()}</td>
                            <td className="px-3 py-2.5 text-white font-mono text-xs">£{h.value.toFixed(2)}</td>
                            <td className="px-3 py-2.5">
                              <span className={clsx('font-mono text-xs font-semibold', h.pnl >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                                {h.pnl >= 0 ? '+' : ''}£{h.pnl.toFixed(2)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
            )}
          </div>

          {/* Your holdings */}
          <div className="bg-[#0A0F1E] border border-white/[0.06] rounded-xl overflow-hidden">
            <button
              className="w-full flex items-center justify-between px-4 py-3 text-slate-200 font-semibold text-sm"
              onClick={() => setMyHoldingsOpen(o => !o)}
            >
              <span>Your Holdings ({currentHoldings.length})</span>
              {myHoldingsOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            {myHoldingsOpen && (
              currentHoldings.length === 0
                ? <p className="text-slate-600 text-sm text-center py-5 border-t border-white/[0.06]">No holdings yet.</p>
                : (
                  <div className="overflow-x-auto border-t border-white/[0.06]">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                          {['Stock', 'Shares', 'Value', 'Net P&L'].map(h => (
                            <th key={h} className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.04]">
                        {[...currentHoldings].sort((a, b) => b.value - a.value).map(h => (
                          <tr key={h.companyId}>
                            <td className="px-3 py-2.5">
                              <p className="text-white text-xs font-bold">{h.symbol}</p>
                              <p className="text-slate-600 text-[10px] truncate max-w-[100px]">{h.companyName}</p>
                            </td>
                            <td className="px-3 py-2.5 text-slate-400 font-mono text-xs">{h.shares.toLocaleString()}</td>
                            <td className="px-3 py-2.5 text-white font-mono text-xs">£{h.value.toFixed(2)}</td>
                            <td className="px-3 py-2.5">
                              <span className={clsx('font-mono text-xs font-semibold', h.netPnl >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                                {h.netPnl >= 0 ? '+' : ''}£{h.netPnl.toFixed(2)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
            )}
          </div>
        </div>

        <div className="px-5 py-3 border-t border-white/[0.06] shrink-0">
          <p className="text-slate-600 text-[10px]">Holdings shown are the last published state. Values update with live market prices. Use each other's picks for inspiration.</p>
        </div>
      </>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#0D1424] border border-white/[0.08] rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[88vh]"
        onClick={e => e.stopPropagation()}>
        {rival ? <CompareView /> : <LeaderboardView />}
      </div>
    </div>
  );
}

// ── SET BALANCE SCREEN ────────────────────────────────────────────────────
function SetBalanceScreen() {
  const { setInitialBalance } = usePortfolioStore();
  const { tradingCosts } = useSettingsStore();
  const [value, setValue] = useState('');

  const buyFeeDesc = tradingCosts.buyFeeType === 'fixed'
    ? `£${tradingCosts.buyFeeAmount.toFixed(2)} flat`
    : `${tradingCosts.buyFeeAmount}%`;

  function handleSet() {
    const amt = parseFloat(value);
    if (amt > 0) setInitialBalance(amt);
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-6">
      <div className="bg-[#0F172A] border border-white/[0.08] rounded-2xl p-8 max-w-md w-full text-center">
        <div className="w-14 h-14 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Briefcase size={24} className="text-indigo-400" />
        </div>
        <h2 className="text-white text-xl font-bold mb-2">Start Shadow Trading</h2>
        <p className="text-slate-400 text-sm leading-relaxed mb-6">
          Enter a starting balance to begin building your virtual portfolio. Trades use real FTSE 100 prices with a {buyFeeDesc} buy commission per trade.{' '}
          <Link to="/settings" className="text-indigo-400 hover:text-indigo-300 underline-offset-2">Adjust in Settings</Link>.
        </p>
        <div className="relative mb-4">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 font-semibold text-lg">£</span>
          <input
            type="number" value={value} onChange={e => setValue(e.target.value)}
            placeholder="10,000"
            onKeyDown={e => e.key === 'Enter' && handleSet()}
            className="w-full bg-[#1E293B] border border-white/[0.08] rounded-xl pl-9 pr-4 py-3 text-white text-lg font-mono font-semibold text-center focus:outline-none focus:border-indigo-500/50"
          />
        </div>
        <div className="flex gap-2 mb-4">
          {[1000, 5000, 10000, 25000].map(amt => (
            <button key={amt}
              onClick={() => setValue(String(amt))}
              className="flex-1 py-1.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] rounded-lg text-slate-400 text-xs font-semibold transition-all"
            >£{(amt / 1000).toFixed(0)}k</button>
          ))}
        </div>
        <button onClick={handleSet}
          className="w-full bg-indigo-500 hover:bg-indigo-400 text-white font-semibold py-3 rounded-xl transition-all">
          Start with £{parseFloat(value) > 0 ? parseFloat(value).toLocaleString('en-GB', { minimumFractionDigits: 2 }) : '—'}
        </button>
      </div>
    </div>
  );
}

// ── PORTFOLIO CHART ────────────────────────────────────────────────────────
function PortfolioChart({ totalValue }: { totalValue: number }) {
  const { snapshots, initialBalance } = usePortfolioStore();

  const chartData = snapshots.length > 0
    ? snapshots.map(s => ({ date: s.date, value: s.totalValue }))
    : [{ date: 'Now', value: totalValue }];

  const start = snapshots.length > 0 ? snapshots[0].totalValue : initialBalance;
  const isPos = totalValue >= start;

  return (
    <div className="bg-[#0F172A] border border-white/[0.06] rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-slate-200 font-semibold text-sm">Portfolio Value Over Time</h3>
        <span className={clsx('text-sm font-semibold', isPos ? 'text-emerald-400' : 'text-red-400')}>
          {isPos ? '+' : ''}£{(totalValue - start).toFixed(2)} total
        </span>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="pf-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={isPos ? '#10B981' : '#F43F5E'} stopOpacity={0.2} />
              <stop offset="95%" stopColor={isPos ? '#10B981' : '#F43F5E'} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis dataKey="date" tick={{ fill: '#475569', fontSize: 10 }} />
          <YAxis tick={{ fill: '#475569', fontSize: 10 }} tickFormatter={v => `£${(v / 1000).toFixed(0)}k`} domain={['auto', 'auto']} />
          <Tooltip
            contentStyle={{ background: '#1E293B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
            formatter={(v: number) => [`£${v.toFixed(2)}`, 'Portfolio Value']}
          />
          <Area type="monotone" dataKey="value" stroke={isPos ? '#10B981' : '#F43F5E'} strokeWidth={2}
            fill="url(#pf-grad)" dot={false} activeDot={{ r: 4 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── ALLOCATION PIE ─────────────────────────────────────────────────────────
function AllocationPie({ holdings, getPrice }: { holdings: Holding[]; getPrice: (id: string) => number }) {
  type Slice = { name: string; value: number; color: string; };
  const slices: Slice[] = holdings.map(h => {
    const price = getPrice(h.companyId);
    const val = (h.shares * price) / 100;
    const sector = h.sector;
    return { name: h.symbol, value: val, color: SECTOR_COLORS[sector] ?? '#6366F1' };
  });

  if (!slices.length) return null;

  const total = slices.reduce((s, x) => s + x.value, 0);

  return (
    <div className="bg-[#0F172A] border border-white/[0.06] rounded-xl p-5">
      <h3 className="text-slate-200 font-semibold text-sm mb-4">Allocation</h3>
      <div className="flex items-center gap-4">
        <ResponsiveContainer width={160} height={160}>
          <PieChart>
            <Pie data={slices} cx="50%" cy="50%" innerRadius={45} outerRadius={75}
              dataKey="value" paddingAngle={2}>
              {slices.map((s, i) => <Cell key={i} fill={s.color} />)}
            </Pie>
            <Tooltip
              contentStyle={{ background: '#1E293B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
              formatter={(v: number) => [`£${v.toFixed(2)} (${((v / total) * 100).toFixed(1)}%)`, '']}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex-1 space-y-1.5 min-w-0">
          {slices.sort((a, b) => b.value - a.value).slice(0, 8).map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
              <span className="text-slate-400 text-xs font-mono flex-1 truncate">{s.name}</span>
              <span className="text-slate-300 text-xs font-mono shrink-0">{((s.value / total) * 100).toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── HOLDINGS TABLE ─────────────────────────────────────────────────────────
function HoldingsTable({ enrichedHoldings, getPrice }: { enrichedHoldings: EnrichedHolding[]; getPrice: (id: string) => number }) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(true);

  if (!enrichedHoldings.length) return (
    <div className="bg-[#0F172A] border border-white/[0.06] rounded-xl p-8 text-center">
      <Briefcase size={32} className="text-slate-700 mx-auto mb-3" />
      <p className="text-slate-500 text-sm">No holdings yet. Visit the <span className="text-indigo-400 cursor-pointer" onClick={() => navigate('/market')}>FTSE 100</span> to shadow buy stocks.</p>
    </div>
  );

  return (
    <div className="bg-[#0F172A] border border-white/[0.06] rounded-xl overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-5 py-4 text-slate-200 font-semibold text-sm"
        onClick={() => setExpanded(e => !e)}
      >
        <span>Holdings ({enrichedHoldings.length})</span>
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {expanded && (
        <div className="overflow-x-auto border-t border-white/[0.06]">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                {['Stock', 'Shares', 'Avg Buy', 'Current', 'Value', 'Gross P&L', 'Fees', 'Net P&L', ''].map(h => (
                  <th key={h} className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {enrichedHoldings.map(h => {
                const sectorColor = SECTOR_COLORS[h.sector] ?? '#6366F1';
                return (
                  <tr key={h.companyId} className="hover:bg-white/[0.02] cursor-pointer transition-colors"
                    onClick={() => navigate(`/stock/${h.symbol}`)}>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold text-white"
                          style={{ backgroundColor: `${sectorColor}20`, border: `1px solid ${sectorColor}30` }}>
                          {h.symbol.slice(0, 2)}
                        </div>
                        <div>
                          <p className="text-white text-sm font-semibold">{h.symbol}</p>
                          <p className="text-slate-500 text-[10px] truncate max-w-[120px]">{h.companyName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-slate-300 font-mono text-sm">{h.shares.toLocaleString()}</td>
                    <td className="px-3 py-3 text-slate-400 font-mono text-sm">{formatPrice(h.avgBuyPrice)}</td>
                    <td className="px-3 py-3 text-white font-mono text-sm font-semibold">{formatPrice(h.currentPrice)}</td>
                    <td className="px-3 py-3 text-slate-200 font-mono text-sm">£{h.value.toFixed(2)}</td>
                    <td className="px-3 py-3">
                      <span className={clsx('font-mono text-sm font-semibold', h.grossPnl >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                        {h.grossPnl >= 0 ? '+' : ''}£{h.grossPnl.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-amber-500/70 font-mono text-sm">
                      -£{h.totalFees.toFixed(2)}
                    </td>
                    <td className="px-3 py-3">
                      <span className={clsx('font-mono text-sm font-semibold', h.netPnl >= 0 ? 'text-emerald-300' : 'text-red-300')}>
                        {h.netPnl >= 0 ? '+' : ''}£{h.netPnl.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      {h.netPnl >= 0 ? <ArrowUpRight size={14} className="text-emerald-500" /> : <ArrowDownRight size={14} className="text-red-500" />}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── TRANSACTION HISTORY ────────────────────────────────────────────────────
function TransactionHistory() {
  const { transactions } = usePortfolioStore();
  const [expanded, setExpanded] = useState(false);

  if (!transactions.length) return null;

  const sorted = [...transactions].sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  return (
    <div className="bg-[#0F172A] border border-white/[0.06] rounded-xl overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-5 py-4 text-slate-200 font-semibold text-sm"
        onClick={() => setExpanded(e => !e)}
      >
        <span>Transaction History ({transactions.length})</span>
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {expanded && (
        <div className="overflow-x-auto border-t border-white/[0.06]">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                {['Date', 'Type', 'Stock', 'Shares', 'Price', 'Total', 'Fee'].map(h => (
                  <th key={h} className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {sorted.map(tx => (
                <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-3 py-2.5 text-slate-500 text-xs font-mono">
                    {new Date(tx.timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={clsx('text-[10px] font-bold px-2 py-0.5 rounded uppercase',
                      tx.type === 'BUY' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
                    )}>{tx.type}</span>
                  </td>
                  <td className="px-3 py-2.5 text-slate-200 font-mono text-sm font-semibold">{tx.symbol}</td>
                  <td className="px-3 py-2.5 text-slate-400 font-mono text-sm">{tx.shares.toLocaleString()}</td>
                  <td className="px-3 py-2.5 text-slate-400 font-mono text-sm">{formatPrice(tx.pricePerShare)}</td>
                  <td className="px-3 py-2.5 text-white font-mono text-sm">£{tx.totalValue.toFixed(2)}</td>
                  <td className="px-3 py-2.5 text-slate-500 font-mono text-xs">£{tx.fees.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── P&L BREAKDOWN ──────────────────────────────────────────────────────────
function PnlBreakdown({
  grossPnl, totalFees, netPnl, cgtLiability, netAfterTax, taxBracket, cgtAllowance,
}: {
  grossPnl: number; totalFees: number; netPnl: number;
  cgtLiability: number; netAfterTax: number;
  taxBracket: import('../../store/settingsStore').TaxBracket;
  cgtAllowance: number;
}) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="bg-[#0F172A] border border-white/[0.06] rounded-xl overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-5 py-4 text-slate-200 font-semibold text-sm"
        onClick={() => setExpanded(e => !e)}
      >
        <span className="flex items-center gap-2"><Receipt size={14} className="text-slate-400" /> P&amp;L Breakdown &amp; Tax Estimate</span>
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {expanded && (
        <div className="border-t border-white/[0.06] p-5">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
            <div>
              <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Gross P&amp;L</p>
              <p className={clsx('font-mono font-bold text-xl', grossPnl >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                {grossPnl >= 0 ? '+' : ''}£{grossPnl.toFixed(2)}
              </p>
              <p className="text-slate-600 text-[10px] mt-0.5">Before trading costs</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Trading Fees</p>
              <p className="font-mono font-bold text-xl text-amber-400">-£{totalFees.toFixed(2)}</p>
              <p className="text-slate-600 text-[10px] mt-0.5">All buy &amp; sell commissions</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Net P&amp;L</p>
              <p className={clsx('font-mono font-bold text-xl', netPnl >= 0 ? 'text-emerald-300' : 'text-red-300')}>
                {netPnl >= 0 ? '+' : ''}£{netPnl.toFixed(2)}
              </p>
              <p className="text-slate-600 text-[10px] mt-0.5">After all fees</p>
            </div>
            <div className="md:col-start-2">
              <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Est. CGT Liability</p>
              <p className="font-mono font-bold text-xl text-orange-400">-£{cgtLiability.toFixed(2)}</p>
              <p className="text-slate-600 text-[10px] mt-0.5">
                {(CGT_RATES[taxBracket] * 100).toFixed(0)}% on gains above £{cgtAllowance.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Net After Tax</p>
              <p className={clsx('font-mono font-bold text-xl', netAfterTax >= 0 ? 'text-emerald-200' : 'text-red-300')}>
                {netAfterTax >= 0 ? '+' : ''}£{netAfterTax.toFixed(2)}
              </p>
              <p className="text-slate-600 text-[10px] mt-0.5">Net P&amp;L minus CGT</p>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-3 border-t border-white/[0.06]">
            <AlertTriangle size={12} className="text-amber-500/60 shrink-0" />
            <p className="text-slate-600 text-[10px]">
              CGT estimate assumes all unrealised gains are realised today in this tax year. Tax bracket: {TAX_BRACKET_LABELS[taxBracket]}.{' '}
              <Link to="/settings" className="text-indigo-500 hover:text-indigo-400">Change in Settings</Link>.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── 1-YEAR PROJECTION ──────────────────────────────────────────────────────
function YearProjection({ enrichedHoldings }: { enrichedHoldings: EnrichedHolding[] }) {
  const { stocks } = useMarketStore();
  const { taxBracket, cgtAllowance, tradingCosts } = useSettingsStore();
  const [expanded, setExpanded] = useState(false);

  if (!enrichedHoldings.length) return null;

  const projections = enrichedHoldings.map(h => {
    const stock = stocks.find(s => s.id === h.companyId);
    const annualPerf = stock?.annualPerf ?? 0;
    const predictedValue = h.value * (1 + annualPerf / 100);
    const projectedGain = predictedValue - h.value;
    return { ...h, annualPerf, predictedValue, projectedGain };
  });

  const currentTotal = projections.reduce((s, p) => s + p.value, 0);
  const predictedTotal = projections.reduce((s, p) => s + p.predictedValue, 0);
  const grossGain = predictedTotal - currentTotal;

  // Estimate sell fees if all positions sold
  const sellFeeTotal = projections.reduce((s, p) => {
    return s + calcTradeFee(tradingCosts.sellFeeType, tradingCosts.sellFeeAmount, p.predictedValue);
  }, 0);

  // CGT on the projected gross gains (from today's value)
  const totalGrossNetPnl = projections.reduce((s, p) => s + p.netPnl, 0);
  const projectedNetPnl = totalGrossNetPnl + grossGain - sellFeeTotal;
  const taxableGain = Math.max(0, projectedNetPnl - cgtAllowance);
  const projectedCGT = taxableGain * CGT_RATES[taxBracket];
  const projectedNetAfterTax = projectedNetPnl - projectedCGT;

  // Chart data: monthly progression
  const chartData = Array.from({ length: 13 }, (_, i) => {
    const fraction = i / 12;
    return {
      month: i === 0 ? 'Now' : i === 12 ? '1yr' : `M${i}`,
      value: projections.reduce((s, p) => s + p.value * Math.pow(1 + p.annualPerf / 100, fraction), 0),
    };
  });

  return (
    <div className="bg-[#0F172A] border border-white/[0.06] rounded-xl overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-5 py-4 text-slate-200 font-semibold text-sm"
        onClick={() => setExpanded(e => !e)}
      >
        <span className="flex items-center gap-2"><CalendarRange size={14} className="text-slate-400" /> 1-Year Portfolio Projection</span>
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {expanded && (
        <div className="border-t border-white/[0.06] p-5 space-y-5">
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white/[0.03] rounded-lg p-3">
              <p className="text-slate-500 text-xs mb-1">Current Value</p>
              <p className="text-white font-mono font-bold">£{currentTotal.toFixed(2)}</p>
            </div>
            <div className="bg-white/[0.03] rounded-lg p-3">
              <p className="text-slate-500 text-xs mb-1">Projected Value</p>
              <p className={clsx('font-mono font-bold', predictedTotal >= currentTotal ? 'text-emerald-400' : 'text-red-400')}>
                £{predictedTotal.toFixed(2)}
              </p>
            </div>
            <div className="bg-white/[0.03] rounded-lg p-3">
              <p className="text-slate-500 text-xs mb-1">Proj. Gross Gain</p>
              <p className={clsx('font-mono font-bold', grossGain >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                {grossGain >= 0 ? '+' : ''}£{grossGain.toFixed(2)}
              </p>
            </div>
            <div className="bg-white/[0.03] rounded-lg p-3">
              <p className="text-slate-500 text-xs mb-1">Proj. Net After Tax</p>
              <p className={clsx('font-mono font-bold', projectedNetAfterTax >= 0 ? 'text-emerald-300' : 'text-red-300')}>
                {projectedNetAfterTax >= 0 ? '+' : ''}£{projectedNetAfterTax.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Chart */}
          <div>
            <p className="text-slate-500 text-xs mb-3 uppercase tracking-wider">Projected portfolio value over 12 months</p>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="projGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="month" tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false}
                  tickFormatter={v => `£${(v / 1000).toFixed(1)}k`} width={52} />
                <Tooltip
                  contentStyle={{ background: '#1E293B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
                  formatter={(v: number) => [`£${v.toFixed(2)}`, 'Portfolio Value']}
                />
                <Area type="monotone" dataKey="value" stroke="#6366F1" strokeWidth={2}
                  fill="url(#projGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Per-holding breakdown */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {['Stock', 'Annual Trend', 'Current Value', 'Predicted Value', 'Proj. Gain'].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {projections.sort((a, b) => b.projectedGain - a.projectedGain).map(p => (
                  <tr key={p.companyId} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-3 py-2.5">
                      <p className="text-white font-semibold text-xs">{p.symbol}</p>
                      <p className="text-slate-500 text-[10px] truncate max-w-[100px]">{p.companyName}</p>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={clsx('text-xs font-semibold font-mono', p.annualPerf >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                        {p.annualPerf >= 0 ? '+' : ''}{p.annualPerf.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-slate-300 font-mono text-xs">£{p.value.toFixed(2)}</td>
                    <td className="px-3 py-2.5 text-white font-mono text-xs font-semibold">£{p.predictedValue.toFixed(2)}</td>
                    <td className="px-3 py-2.5">
                      <span className={clsx('font-mono text-xs font-semibold', p.projectedGain >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                        {p.projectedGain >= 0 ? '+' : ''}£{p.projectedGain.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/[0.06]">
            <div>
              <p className="text-slate-500 text-xs mb-0.5">Est. Sell Fees (if all sold)</p>
              <p className="text-amber-400 font-mono text-sm font-semibold">-£{sellFeeTotal.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs mb-0.5">Est. CGT on Proj. Gains</p>
              <p className="text-orange-400 font-mono text-sm font-semibold">-£{projectedCGT.toFixed(2)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-white/[0.06]">
            <AlertTriangle size={12} className="text-amber-500/60 shrink-0" />
            <p className="text-slate-600 text-[10px]">
              Projections use each stock's historical annual performance and are not a guarantee of future returns. For illustrative purposes only.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── MAIN PORTFOLIO ─────────────────────────────────────────────────────────
export default function Portfolio() {
  const { holdings, cashBalance, isInitialised, initialBalance, snapshots, recordSnapshot, reset } = usePortfolioStore();
  const { stocks } = useMarketStore();
  const { taxBracket, cgtAllowance } = useSettingsStore();
  const { user } = useAuthStore();
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showCompare, setShowCompare] = useState(false);

  function getPrice(companyId: string): number {
    const stock = stocks.find(s => s.id === companyId);
    return stock?.currentPrice ?? 0;
  }

  const stats = computePortfolioStats(holdings, cashBalance, getPrice, { taxBracket, cgtAllowance });
  const totalReturn = stats.totalValue - initialBalance;
  const totalReturnPct = initialBalance > 0 ? (totalReturn / initialBalance) * 100 : 0;

  // Record a snapshot once per render if initialised
  React.useEffect(() => {
    if (isInitialised && holdings.length > 0) {
      recordSnapshot(stats.totalValue);
    }
  }, [isInitialised]);

  if (!isInitialised) return <SetBalanceScreen />;

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-xl font-bold">My Portfolio</h1>
          <p className="text-slate-500 text-sm mt-0.5">Shadow investing — real prices, virtual money</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCompare(true)}
            className="flex items-center justify-center gap-1.5 w-9 h-9 sm:w-auto sm:h-auto sm:px-3 sm:py-2 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-slate-400 hover:text-slate-200 rounded-lg text-xs font-medium transition-all"
          >
            <Users size={14} /><span className="hidden sm:inline">Compare</span>
          </button>
          <button
            onClick={() => setShowResetConfirm(true)}
            className="flex items-center justify-center gap-1.5 w-9 h-9 sm:w-auto sm:h-auto sm:px-3 sm:py-2 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-slate-400 hover:text-slate-200 rounded-lg text-xs font-medium transition-all"
          >
            <RefreshCw size={14} /><span className="hidden sm:inline">Reset Portfolio</span>
          </button>
        </div>
      </div>

      {/* Compare modal */}
      {showCompare && (
        <CompareModal
          currentUid={user?.uid ?? ''}
          currentDisplayName={user?.displayName || user?.email?.split('@')[0] || 'You'}
          currentValue={stats.totalValue}
          currentInitial={initialBalance}
          currentCash={cashBalance}
          currentHoldings={stats.enrichedHoldings}
          stocks={stocks}
          onClose={() => setShowCompare(false)}
        />
      )}

      {/* Reset confirm */}
      {showResetConfirm && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 flex items-center justify-between">
          <p className="text-red-400 text-sm">Are you sure? This will wipe all holdings and transactions.</p>
          <div className="flex gap-2">
            <button onClick={() => setShowResetConfirm(false)} className="text-slate-400 text-sm hover:text-slate-200 px-3 py-1 rounded-lg">Cancel</button>
            <button onClick={() => { reset(); setShowResetConfirm(false); }} className="bg-red-500 hover:bg-red-400 text-white text-sm px-3 py-1 rounded-lg font-semibold">Reset</button>
          </div>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-[#0F172A] border border-white/[0.06] rounded-xl p-4">
          <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Total Value</p>
          <p className="text-white font-mono font-bold text-2xl">£{stats.totalValue.toFixed(2)}</p>
        </div>
        <div className="bg-[#0F172A] border border-white/[0.06] rounded-xl p-4">
          <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Cash Balance</p>
          <p className="text-white font-mono font-bold text-2xl">£{cashBalance.toFixed(2)}</p>
        </div>
        <div className="bg-[#0F172A] border border-white/[0.06] rounded-xl p-4">
          <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Invested</p>
          <p className="text-white font-mono font-bold text-2xl">£{stats.totalCostBasis.toFixed(2)}</p>
        </div>
        <div className={clsx('border rounded-xl p-4', totalReturn >= 0 ? 'bg-emerald-500/[0.05] border-emerald-500/20' : 'bg-red-500/[0.05] border-red-500/20')}>
          <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Total Return</p>
          <p className={clsx('font-mono font-bold text-2xl', totalReturn >= 0 ? 'text-emerald-400' : 'text-red-400')}>
            {totalReturn >= 0 ? '+' : ''}£{totalReturn.toFixed(2)}
          </p>
          <p className={clsx('text-xs font-semibold mt-0.5', totalReturn >= 0 ? 'text-emerald-500' : 'text-red-500')}>
            {formatPerf(totalReturnPct)} since start
          </p>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid md:grid-cols-2 gap-5">
        <PortfolioChart totalValue={stats.totalValue} />
        {holdings.length > 0 && <AllocationPie holdings={holdings} getPrice={getPrice} />}
      </div>

      {/* P&L Breakdown */}
      {holdings.length > 0 && (
        <PnlBreakdown
          grossPnl={stats.portfolioGrossPnl}
          totalFees={stats.totalFeesPaid}
          netPnl={stats.portfolioNetPnl}
          cgtLiability={stats.cgtLiability}
          netAfterTax={stats.netAfterTax}
          taxBracket={taxBracket}
          cgtAllowance={cgtAllowance}
        />
      )}

      {/* Holdings */}
      <HoldingsTable enrichedHoldings={stats.enrichedHoldings} getPrice={getPrice} />

      {/* 1-Year Projection */}
      <YearProjection enrichedHoldings={stats.enrichedHoldings} />

      {/* Transaction history */}
      <TransactionHistory />
    </div>
  );
}
