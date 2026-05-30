import { create } from 'zustand';
import { useAuthStore } from './authStore';
import { saveSettings } from '../lib/firestoreSync';

export type FeeType = 'fixed' | 'percentage';
export type TaxBracket = 'basic' | 'higher' | 'additional';

export interface TradingCosts {
  buyFeeType: FeeType;
  buyFeeAmount: number; // £ or %
  sellFeeType: FeeType;
  sellFeeAmount: number; // £ or %
}

interface SettingsState {
  tradingCosts: TradingCosts;
  taxBracket: TaxBracket;
  cgtAllowance: number; // Annual CGT exempt amount (£3,000 for 2024/25)
  lightMode: boolean;
  /** Called by firestoreSync — loads remote data without triggering a write-back. */
  _loadState: (data: Partial<Omit<SettingsState, '_loadState' | 'updateTradingCosts' | 'updateTaxBracket' | 'updateCgtAllowance' | 'toggleLightMode' | 'reset'>>) => void;
  updateTradingCosts: (costs: Partial<TradingCosts>) => void;
  updateTaxBracket: (bracket: TaxBracket) => void;
  updateCgtAllowance: (amount: number) => void;
  toggleLightMode: () => void;
  reset: () => void;
}

// UK Capital Gains Tax rates for shares (post Oct 2024 Budget)
export const CGT_RATES: Record<TaxBracket, number> = {
  basic: 0.18,      // 18%
  higher: 0.24,     // 24%
  additional: 0.24, // 24%
};

export const TAX_BRACKET_LABELS: Record<TaxBracket, string> = {
  basic: 'Basic Rate (20% income tax)',
  higher: 'Higher Rate (40% income tax)',
  additional: 'Additional Rate (45% income tax)',
};

export const CGT_RATE_LABELS: Record<TaxBracket, string> = {
  basic: '18% on gains',
  higher: '24% on gains',
  additional: '24% on gains',
};

// Current UK CGT annual exempt amount (2024/25)
export const DEFAULT_CGT_ALLOWANCE = 3000;

/** Calculate trading fee for a single trade */
export function calcTradeFee(feeType: FeeType, feeAmount: number, tradeValueGBP: number): number {
  if (feeType === 'percentage') {
    return tradeValueGBP * (feeAmount / 100);
  }
  return feeAmount; // fixed
}

/** Calculate CGT liability on a net gain */
export function calcCGT(
  netGainGBP: number,
  cgtAllowance: number,
  taxBracket: TaxBracket
): number {
  const taxableGain = Math.max(0, netGainGBP - cgtAllowance);
  return taxableGain * CGT_RATES[taxBracket];
}

export const useSettingsStore = create<SettingsState>()((set, get) => {
  function persistSettings() {
    const uid = useAuthStore.getState().user?.uid;
    if (uid) {
      const { tradingCosts, taxBracket, cgtAllowance, lightMode } = get();
      saveSettings(uid, { tradingCosts, taxBracket, cgtAllowance, lightMode }).catch(console.error);
    }
  }

  return {
    tradingCosts: {
      buyFeeType: 'fixed',
      buyFeeAmount: 9.95,
      sellFeeType: 'fixed',
      sellFeeAmount: 9.95,
    },
    taxBracket: 'basic' as TaxBracket,
    cgtAllowance: DEFAULT_CGT_ALLOWANCE,
    lightMode: false,

    _loadState: (data) => {
      set(data as any);
      if (data.lightMode !== undefined) {
        try { localStorage.setItem('ii-theme', data.lightMode ? 'light' : 'dark'); } catch {}
      }
    },

    updateTradingCosts: (costs) => {
      set(s => ({ tradingCosts: { ...s.tradingCosts, ...costs } }));
      persistSettings();
    },

    updateTaxBracket: (bracket) => {
      set({ taxBracket: bracket });
      persistSettings();
    },

    updateCgtAllowance: (amount) => {
      set({ cgtAllowance: amount });
      persistSettings();
    },

    toggleLightMode: () => {
      const newVal = !get().lightMode;
      set({ lightMode: newVal });
      try { localStorage.setItem('ii-theme', newVal ? 'light' : 'dark'); } catch {}
      persistSettings();
    },

    reset: () => set({
      tradingCosts: { buyFeeType: 'fixed', buyFeeAmount: 9.95, sellFeeType: 'fixed', sellFeeAmount: 9.95 },
      taxBracket: 'basic',
      cgtAllowance: DEFAULT_CGT_ALLOWANCE,
      lightMode: false,
    }),
  };
});
