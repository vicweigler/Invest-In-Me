import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronUp, ChevronDown, Filter, TrendingUp, Briefcase } from 'lucide-react';
import { useMarketStore } from '../../store/marketStore';
import { usePortfolioStore } from '../../store/portfolioStore';
import { formatPrice, formatPerf, formatMarketCap, formatVolume, perfColor, perfBg } from '../../data/generator';
import { SECTORS, SECTOR_COLORS } from '../../data/companies';
import { StockData } from '../../types';
import clsx from 'clsx';

type SortKey = 'ftseRank' | 'name' | 'currentPrice' | 'dayPerf' | 'weekPerf' | 'monthPerf' | 'annualPerf' | 'marketCap';
type SortDir = 'asc' | 'desc';

function PerfCell({ value }: { value: number }) {
  return (
    <span className={clsx('inline-block font-mono text-xs font-semibold px-1.5 py-0.5 rounded', perfBg(value))}>
      {formatPerf(value)}
    </span>
  );
}

function SortHeader({ label, sortKey, currentKey, dir, onClick }: {
  label: string; sortKey: SortKey; currentKey: SortKey; dir: SortDir; onClick: (k: SortKey) => void;
}) {
  const active = sortKey === currentKey;
  return (
    <th className="px-3 py-3 text-left cursor-pointer select-none group" onClick={() => onClick(sortKey)}>
      <div className="flex items-center gap-1">
        <span className={clsx('text-xs font-semibold uppercase tracking-wider transition-colors',
          active ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'
        )}>{label}</span>
        {active
          ? dir === 'asc' ? <ChevronUp size={12} className="text-indigo-400" /> : <ChevronDown size={12} className="text-indigo-400" />
          : <ChevronDown size={12} className="text-slate-700" />
        }
      </div>
    </th>
  );
}

export default function StockTable() {
  const navigate = useNavigate();
  const { stocks, isLoaded, loadMarket, tickPrices } = useMarketStore();
  const { holdings } = usePortfolioStore();

  const [search, setSearch] = useState('');
  const [sector, setSector] = useState('All Sectors');
  const [sortKey, setSortKey] = useState<SortKey>('ftseRank');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [showFilter, setShowFilter] = useState(false);

  useEffect(() => { if (!isLoaded) loadMarket(); }, [isLoaded, loadMarket]);
  useEffect(() => {
    const t = setInterval(tickPrices, 8000);
    return () => clearInterval(t);
  }, [tickPrices]);

  const heldSymbols = new Set(holdings.map(h => h.symbol));

  function handleSort(key: SortKey) {
    if (key === sortKey) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir(key === 'ftseRank' ? 'asc' : 'desc'); }
  }

  const filtered = useMemo(() => {
    let list = [...stocks];
    if (sector !== 'All Sectors') list = list.filter(s => s.sector === sector);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(s => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q));
    }
    list.sort((a, b) => {
      const av = a[sortKey] as number;
      const bv = b[sortKey] as number;
      return sortDir === 'asc' ? av - bv : bv - av;
    });
    return list;
  }, [stocks, sector, search, sortKey, sortDir]);

  if (!isLoaded) return (
    <div className="flex items-center justify-center h-96">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-4 sm:p-6">
      {/* Page header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-4 sm:mb-6">
        <div>
          <h1 className="text-white text-xl font-bold">FTSE 100</h1>
          <p className="text-slate-500 text-sm mt-0.5">{filtered.length} companies{sector !== 'All Sectors' ? ` in ${sector}` : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative flex-1 sm:flex-none">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or symbol…"
              className="w-full sm:w-52 bg-[#0F172A] border border-white/[0.08] rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50"
            />
          </div>
          {/* Sector filter */}
          <div className="relative">
            <button
              onClick={() => setShowFilter(!showFilter)}
              className={clsx('flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all',
                sector !== 'All Sectors'
                  ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300'
                  : 'bg-[#0F172A] border-white/[0.08] text-slate-400 hover:text-slate-200'
              )}
            >
              <Filter size={13} />
              {sector === 'All Sectors' ? 'Sector' : sector}
            </button>
            {showFilter && (
              <div className="absolute right-0 top-full mt-1 z-50 bg-[#1E293B] border border-white/[0.1] rounded-xl p-2 shadow-2xl w-56">
                {SECTORS.map(s => (
                  <button
                    key={s}
                    onClick={() => { setSector(s); setShowFilter(false); }}
                    className={clsx('w-full text-left px-3 py-1.5 rounded-lg text-sm transition-all',
                      sector === s ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                    )}
                  >
                    <span className="flex items-center gap-2">
                      {s !== 'All Sectors' && (
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: SECTOR_COLORS[s] ?? '#6366F1' }} />
                      )}
                      {s}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#0F172A] border border-white/[0.06] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                <SortHeader label="#"      sortKey="ftseRank"    currentKey={sortKey} dir={sortDir} onClick={handleSort} />
                <SortHeader label="Company" sortKey="name"       currentKey={sortKey} dir={sortDir} onClick={handleSort} />
                <th className="px-3 py-3 text-left"><span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Sector</span></th>
                <SortHeader label="Price"   sortKey="currentPrice" currentKey={sortKey} dir={sortDir} onClick={handleSort} />
                <SortHeader label="Today"   sortKey="dayPerf"    currentKey={sortKey} dir={sortDir} onClick={handleSort} />
                <SortHeader label="1W"      sortKey="weekPerf"   currentKey={sortKey} dir={sortDir} onClick={handleSort} />
                <SortHeader label="1M"      sortKey="monthPerf"  currentKey={sortKey} dir={sortDir} onClick={handleSort} />
                <SortHeader label="1Y"      sortKey="annualPerf" currentKey={sortKey} dir={sortDir} onClick={handleSort} />
                <SortHeader label="Mkt Cap" sortKey="marketCap"  currentKey={sortKey} dir={sortDir} onClick={handleSort} />
                <th className="px-3 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filtered.map((stock, idx) => (
                <StockRow key={stock.id} stock={stock} held={heldSymbols.has(stock.symbol)} onClick={() => navigate(`/stock/${stock.symbol}`)} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StockRow({ stock, held, onClick }: { stock: StockData; held: boolean; onClick: () => void }) {
  const sectorColor = SECTOR_COLORS[stock.sector] ?? '#6366F1';
  return (
    <tr
      className="hover:bg-white/[0.03] cursor-pointer transition-colors group"
      onClick={onClick}
    >
      <td className="px-3 py-3">
        <span className="text-slate-600 text-xs font-mono">{stock.ftseRank}</span>
      </td>
      <td className="px-3 py-3">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0"
            style={{ backgroundColor: `${sectorColor}20`, border: `1px solid ${sectorColor}30` }}
          >
            {stock.symbol.slice(0, 2)}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-white text-sm font-semibold">{stock.symbol}</span>
              {held && (
                <span title="In your portfolio"><Briefcase size={10} className="text-indigo-400" /></span>
              )}
            </div>
            <p className="text-slate-500 text-xs truncate max-w-[180px]">{stock.name}</p>
          </div>
        </div>
      </td>
      <td className="px-3 py-3">
        <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: `${sectorColor}15`, color: sectorColor }}>
          {stock.sector}
        </span>
      </td>
      <td className="px-3 py-3">
        <span className="text-white font-mono text-sm font-semibold">{formatPrice(stock.currentPrice)}</span>
      </td>
      <td className="px-3 py-3"><PerfCell value={stock.dayPerf} /></td>
      <td className="px-3 py-3"><PerfCell value={stock.weekPerf} /></td>
      <td className="px-3 py-3"><PerfCell value={stock.monthPerf} /></td>
      <td className="px-3 py-3"><PerfCell value={stock.annualPerf} /></td>
      <td className="px-3 py-3">
        <span className="text-slate-400 text-xs font-mono">{formatMarketCap(stock.marketCap)}</span>
      </td>
      <td className="px-3 py-3">
        <TrendingUp size={14} className="text-slate-700 group-hover:text-indigo-400 transition-colors" />
      </td>
    </tr>
  );
}
