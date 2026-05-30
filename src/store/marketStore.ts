import { create } from 'zustand';
import { StockData } from '../types';
import { FTSE100_COMPANIES } from '../data/companies';
import { buildStockData, seededRng } from '../data/generator';
import { fetchRealQuotes, fetchFundamentals, FundamentalData } from '../services/marketData';

interface MarketState {
  stocks: StockData[];
  fundamentals: Record<string, FundamentalData>;
  fundamentalsStatus: 'idle' | 'loading' | 'loaded' | 'error';
  lastUpdated: Date;
  isLoaded: boolean;
  isLive: boolean;
  loadMarket: () => void;
  tickPrices: () => void;
}

export const useMarketStore = create<MarketState>((set, get) => ({
  stocks: [],
  fundamentals: {},
  fundamentalsStatus: 'idle',
  lastUpdated: new Date(),
  isLoaded: false,
  isLive: false,

  loadMarket: () => {
    // Render immediately with static data so the UI isn't blank
    const stocks = FTSE100_COMPANIES.map(c => buildStockData(c));
    set({ stocks, isLoaded: true, lastUpdated: new Date() });

    // Fetch real prices in the background and patch the store
    const symbols = FTSE100_COMPANIES.map(c => c.symbol);
    fetchRealQuotes(symbols).then(quotes => {
      if (quotes.size === 0) return;

      const updatedCompanies = FTSE100_COMPANIES.map(c => {
        const q = quotes.get(c.symbol);
        if (!q) return c;
        return {
          ...c,
          currentPrice: q.currentPrice,
          dayPerf: q.dayPerf,
          ...(q.marketCap != null && { marketCap: q.marketCap }),
          ...(q.peRatio !== undefined && { peRatio: q.peRatio }),
          ...(q.dividendYield !== undefined && { dividendYield: q.dividendYield }),
        };
      });

      const updatedStocks = updatedCompanies.map(c => buildStockData(c));
      set({ stocks: updatedStocks, isLive: true, lastUpdated: new Date() });

      // After prices are in, fetch real fundamentals for the top 30 candidates
      // so the Stock Scan modal has real data ready when the user opens it.
      set({ fundamentalsStatus: 'loading' });
      const topSymbols = [...updatedStocks]
        .sort((a, b) => b.threeMonthPerf - a.threeMonthPerf)
        .slice(0, 30)
        .map(s => `${s.symbol}.L`);

      fetchFundamentals(topSymbols)
        .then(fundamentals => set({ fundamentals, fundamentalsStatus: 'loaded' }))
        .catch(() => set({ fundamentalsStatus: 'error' }));

    }).catch(err => {
      console.warn('[marketStore] Real price fetch failed, using static data.', err);
    });
  },

  // Simulated live price tick (small random movement) — only runs during market hours
  tickPrices: () => {
    const { stocks, isLive } = get();
    // Only tick if we have real prices AND market is currently open (Mon–Fri 08:00–16:30 UK)
    const now = new Date();
    const day = now.getDay(); // 0=Sun, 6=Sat
    const h = now.getHours();
    const m = now.getMinutes();
    const minuteOfDay = h * 60 + m;
    const marketOpen = day >= 1 && day <= 5 && minuteOfDay >= 480 && minuteOfDay < 990; // 08:00–16:30

    if (!isLive || !marketOpen) return;
    // Seed per-stock per-minute so the same tick always produces the same nudge
    const minuteKey = now.getFullYear() * 100000 + (now.getMonth() + 1) * 1000 + now.getDate() * 10 + Math.floor(minuteOfDay);
    const updated = stocks.map(s => {
      const rng = seededRng(parseInt(s.id) * 7919 + minuteKey);
      const movePct = (rng() - 0.498) * 0.004;
      const newPrice = Math.max(s.currentPrice * (1 + movePct), 1);
      const newDayPerf = s.dayPerf + movePct * 100;
      return { ...s, currentPrice: Math.round(newPrice * 100) / 100, dayPerf: newDayPerf };
    });
    set({ stocks: updated, lastUpdated: new Date() });
  },
}));

// Derived selectors
export const selectTopGainers = (stocks: StockData[], n = 5) =>
  [...stocks].sort((a, b) => b.dayPerf - a.dayPerf).slice(0, n);

export const selectTopDecliners = (stocks: StockData[], n = 5) =>
  [...stocks].sort((a, b) => a.dayPerf - b.dayPerf).slice(0, n);

export const selectBySymbol = (stocks: StockData[], symbol: string) =>
  stocks.find(s => s.symbol === symbol);

export const ftse100IndexLevel = (stocks: StockData[]): number => {
  // Weighted average of day performance to derive index level
  const base = 8285;
  if (stocks.length === 0) return base;
  const avgPerf = stocks.reduce((sum, s) => sum + s.dayPerf, 0) / stocks.length;
  return Math.round((base * (1 + avgPerf / 100)) * 10) / 10;
};
