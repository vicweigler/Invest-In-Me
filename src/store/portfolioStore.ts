import { create } from 'zustand';
import { Holding, Transaction, PortfolioSnapshot } from '../types';
import { useSettingsStore, calcTradeFee, calcCGT, TaxBracket } from './settingsStore';
import { useAuthStore } from './authStore';
import { savePortfolio, savePublicProfile } from '../lib/firestoreSync';

interface PortfolioState {
  cashBalance: number;
  initialBalance: number;
  holdings: Holding[];
  transactions: Transaction[];
  snapshots: PortfolioSnapshot[];
  isInitialised: boolean;

  /** Called by firestoreSync — loads remote data without triggering a write-back. */
  _loadState: (data: Partial<Omit<PortfolioState, '_loadState' | 'setInitialBalance' | 'buyShares' | 'sellShares' | 'recordSnapshot' | 'reset'>>) => void;
  setInitialBalance: (amount: number) => void;
  buyShares: (params: {
    companyId: string; symbol: string; companyName: string; sector: string;
    shares: number; pricePerShare: number;
  }) => { success: boolean; message: string };
  sellShares: (params: {
    companyId: string; symbol: string; shares: number; pricePerShare: number;
  }) => { success: boolean; message: string };
  recordSnapshot: (totalValue: number) => void;
  reset: () => void;
}

function calcHoldingValue(holding: Holding, currentPrice: number) {
  return (holding.shares * currentPrice) / 100; // pence → GBP
}

/** Extract only the serialisable data fields for Firestore writes. */
function portfolioData(state: PortfolioState) {
  return {
    cashBalance: state.cashBalance,
    initialBalance: state.initialBalance,
    holdings: state.holdings,
    transactions: state.transactions,
    snapshots: state.snapshots,
    isInitialised: state.isInitialised,
  };
}

/** Fire-and-forget Firestore write — silently ignored if no user is signed in. */
function persist(state: PortfolioState) {
  const uid = useAuthStore.getState().user?.uid;
  if (uid) savePortfolio(uid, portfolioData(state)).catch(console.error);
}

/** Write a sanitised public profile so other users can see this person on the leaderboard. */
function persistPublic(state: PortfolioState) {
  const user = useAuthStore.getState().user;
  if (!user || !state.isInitialised) return;
  savePublicProfile(user.uid, {
    displayName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
    initialBalance: state.initialBalance,
    cashBalance: state.cashBalance,
    holdings: state.holdings.map(h => ({
      companyId: h.companyId,
      symbol: h.symbol,
      companyName: h.companyName,
      sector: h.sector,
      shares: h.shares,
      avgBuyPrice: h.avgBuyPrice,
    })),
    updatedAt: new Date().toISOString(),
  }).catch(console.error);
}

export const usePortfolioStore = create<PortfolioState>()(
    (set, get) => ({
      cashBalance: 0,
      initialBalance: 0,
      holdings: [],
      transactions: [],
      snapshots: [],
      isInitialised: false,

      _loadState: (data) => set(data as any),

      setInitialBalance: (amount: number) => {
        set({ cashBalance: amount, initialBalance: amount, isInitialised: true });
        persist(get());
        persistPublic(get());
      },

      buyShares: ({ companyId, symbol, companyName, sector, shares, pricePerShare }) => {
        const state = get();
        const { tradingCosts } = useSettingsStore.getState();
        const tradeValueGBP = (shares * pricePerShare) / 100;
        const fee = calcTradeFee(tradingCosts.buyFeeType, tradingCosts.buyFeeAmount, tradeValueGBP);
        const totalCost = tradeValueGBP + fee;

        if (totalCost > state.cashBalance) {
          return { success: false, message: `Insufficient funds. Need £${totalCost.toFixed(2)}, have £${state.cashBalance.toFixed(2)}.` };
        }
        if (shares <= 0) {
          return { success: false, message: 'Shares must be greater than 0.' };
        }

        const transaction: Transaction = {
          id: `tx-${Date.now()}`,
          companyId, symbol, companyName,
          type: 'BUY',
          shares,
          pricePerShare,
          totalValue: tradeValueGBP,
          timestamp: new Date().toISOString(),
          fees: fee,
        };

        const existingIdx = state.holdings.findIndex(h => h.companyId === companyId);
        let updatedHoldings: Holding[];

        if (existingIdx >= 0) {
          const existing = state.holdings[existingIdx];
          const totalShares = existing.shares + shares;
          const totalCostBasis = existing.avgBuyPrice * existing.shares + pricePerShare * shares;
          updatedHoldings = [...state.holdings];
          updatedHoldings[existingIdx] = {
            ...existing,
            shares: totalShares,
            avgBuyPrice: totalCostBasis / totalShares,
            transactions: [...existing.transactions, transaction],
          };
        } else {
          const newHolding: Holding = {
            companyId, symbol, companyName, sector: sector as any,
            shares, avgBuyPrice: pricePerShare,
            transactions: [transaction],
          };
          updatedHoldings = [...state.holdings, newHolding];
        }

        set({
          holdings: updatedHoldings,
          transactions: [transaction, ...state.transactions],
          cashBalance: state.cashBalance - totalCost,
        });

        persist(get());
        persistPublic(get());
        return { success: true, message: `Bought ${shares} shares of ${symbol} at ${(pricePerShare / 100).toFixed(2)}p` };
      },

      sellShares: ({ companyId, symbol, shares, pricePerShare }) => {
        const state = get();
        const existingIdx = state.holdings.findIndex(h => h.companyId === companyId);

        if (existingIdx < 0) {
          return { success: false, message: `You don't hold any shares in ${symbol}.` };
        }
        const existing = state.holdings[existingIdx];
        if (shares > existing.shares) {
          return { success: false, message: `You only hold ${existing.shares} shares of ${symbol}.` };
        }
        if (shares <= 0) {
          return { success: false, message: 'Shares must be greater than 0.' };
        }

        const { tradingCosts } = useSettingsStore.getState();
        const tradeValueGBP = (shares * pricePerShare) / 100;
        const fee = calcTradeFee(tradingCosts.sellFeeType, tradingCosts.sellFeeAmount, tradeValueGBP);
        const proceeds = tradeValueGBP - fee;

        const transaction: Transaction = {
          id: `tx-${Date.now()}`,
          companyId, symbol, companyName: existing.companyName,
          type: 'SELL',
          shares,
          pricePerShare,
          totalValue: tradeValueGBP,
          timestamp: new Date().toISOString(),
          fees: fee,
        };

        let updatedHoldings: Holding[];
        if (existing.shares === shares) {
          updatedHoldings = state.holdings.filter(h => h.companyId !== companyId);
        } else {
          updatedHoldings = [...state.holdings];
          updatedHoldings[existingIdx] = {
            ...existing,
            shares: existing.shares - shares,
            transactions: [...existing.transactions, transaction],
          };
        }

        set({
          holdings: updatedHoldings,
          transactions: [transaction, ...state.transactions],
          cashBalance: state.cashBalance + proceeds,
        });

        persist(get());
        persistPublic(get());
        return { success: true, message: `Sold ${shares} shares of ${symbol}` };
      },

      recordSnapshot: (totalValue: number) => {
        const snap: PortfolioSnapshot = {
          date: new Date().toISOString().split('T')[0],
          totalValue,
        };
        set(s => {
          // Replace if same date, otherwise append
          const existing = s.snapshots.findIndex(p => p.date === snap.date);
          const updated = [...s.snapshots];
          if (existing >= 0) updated[existing] = snap;
          else updated.push(snap);
          return { snapshots: updated.slice(-365) }; // keep max 1 year
        });
        persist(get());
      },

      reset: () => {
        set({ cashBalance: 0, initialBalance: 0, holdings: [], transactions: [], snapshots: [], isInitialised: false });
      },
    })
);

export interface EnrichedHolding extends Holding {
  currentPrice: number;
  value: number;
  costBasis: number;
  grossPnl: number;
  grossPnlPercent: number;
  totalFees: number;
  netPnl: number;
  netPnlPercent: number;
  // backward compat aliases
  pnl: number;
  pnlPercent: number;
}

// Derived calculations (call with current market prices)
export function computePortfolioStats(
  holdings: Holding[],
  cashBalance: number,
  getPrice: (companyId: string) => number,
  cgtSettings?: { taxBracket: TaxBracket; cgtAllowance: number }
) {
  let totalValue = cashBalance;
  let totalCostBasis = 0;
  let totalFeesPaid = 0;

  const enriched: EnrichedHolding[] = holdings.map(h => {
    const currentPrice = getPrice(h.companyId);
    const value = calcHoldingValue(h, currentPrice);
    const costBasis = (h.shares * h.avgBuyPrice) / 100;
    const grossPnl = value - costBasis;
    const grossPnlPercent = costBasis > 0 ? (grossPnl / costBasis) * 100 : 0;
    const holdingFees = h.transactions.reduce((sum, tx) => sum + tx.fees, 0);
    const netPnl = grossPnl - holdingFees;
    const netPnlPercent = costBasis > 0 ? (netPnl / costBasis) * 100 : 0;

    totalValue += value;
    totalCostBasis += costBasis;
    totalFeesPaid += holdingFees;

    return {
      ...h,
      currentPrice, value, costBasis,
      grossPnl, grossPnlPercent,
      totalFees: holdingFees,
      netPnl, netPnlPercent,
      pnl: grossPnl, pnlPercent: grossPnlPercent,
    };
  });

  const invested = totalCostBasis;
  const portfolioGrossPnl = totalValue - cashBalance - invested;
  const portfolioNetPnl = portfolioGrossPnl - totalFeesPaid;
  const portfolioGrossPnlPct = invested > 0 ? (portfolioGrossPnl / invested) * 100 : 0;

  let cgtLiability = 0;
  if (cgtSettings && portfolioGrossPnl > 0) {
    cgtLiability = calcCGT(portfolioGrossPnl, cgtSettings.cgtAllowance, cgtSettings.taxBracket);
  }

  const netAfterTax = portfolioNetPnl - cgtLiability;

  return {
    enrichedHoldings: enriched,
    totalValue,
    totalCostBasis,
    totalFeesPaid,
    portfolioGrossPnl,
    portfolioNetPnl,
    portfolioGrossPnlPct,
    cgtLiability,
    netAfterTax,
    // backward compat
    portfolioPnl: portfolioGrossPnl,
    portfolioPnlPct: portfolioGrossPnlPct,
  };
}
