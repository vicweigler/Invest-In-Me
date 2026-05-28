/**
 * Firestore sync helpers.
 *
 * Manages two real-time subscriptions per signed-in user:
 *   portfolios/{uid}  – cash, holdings, transactions, snapshots
 *   settings/{uid}    – trading fees, tax bracket, CGT allowance
 *
 * Circular-import note: this module imports the Zustand stores and the
 * stores import this module.  Because all cross-module calls happen inside
 * function bodies (never at module-evaluation time) the circular reference
 * is safe in every bundler / runtime.
 */

import { doc, setDoc, onSnapshot, Unsubscribe, collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';

// ── Default shapes (used when a user's doc doesn't exist yet) ────────────
const DEFAULT_PORTFOLIO = {
  cashBalance: 0,
  initialBalance: 0,
  holdings: [],
  transactions: [],
  snapshots: [],
  isInitialised: false,
};

const DEFAULT_SETTINGS = {
  tradingCosts: {
    buyFeeType: 'fixed',
    buyFeeAmount: 9.95,
    sellFeeType: 'fixed',
    sellFeeAmount: 9.95,
  },
  taxBracket: 'basic',
  cgtAllowance: 3000,
};

// ── Active subscription handles ──────────────────────────────────────────
let portfolioUnsub: Unsubscribe | null = null;
let settingsUnsub: Unsubscribe | null = null;

/**
 * Start real-time Firestore listeners for the signed-in user.
 * Each snapshot update pushes data into the respective Zustand store via
 * its `_loadState` action (which does NOT trigger a Firestore write-back,
 * avoiding infinite loops).
 *
 * We skip snapshots that have `hasPendingWrites = true` because those
 * reflect the local optimistic write we just made — the store is already
 * up-to-date from the mutation that triggered the write.
 */
export function subscribeUserData(userId: string) {
  // Lazy-import the stores to break the circular dependency at evaluation time
  import('../store/portfolioStore').then(({ usePortfolioStore }) => {
    portfolioUnsub = onSnapshot(
      doc(db, 'portfolios', userId),
      (snap) => {
        if (snap.metadata.hasPendingWrites) return; // own write – already in store
        const data = snap.exists() ? snap.data() : DEFAULT_PORTFOLIO;
        usePortfolioStore.getState()._loadState(data as any);
      }
    );
  });

  import('../store/settingsStore').then(({ useSettingsStore }) => {
    settingsUnsub = onSnapshot(
      doc(db, 'settings', userId),
      (snap) => {
        if (snap.metadata.hasPendingWrites) return;
        const data = snap.exists() ? snap.data() : DEFAULT_SETTINGS;
        useSettingsStore.getState()._loadState(data as any);
      }
    );
  });
}

/** Stop all Firestore listeners (called on sign-out). */
export function unsubscribeUserData() {
  portfolioUnsub?.();
  settingsUnsub?.();
  portfolioUnsub = null;
  settingsUnsub = null;
}

// ── Write helpers ────────────────────────────────────────────────────────

export async function savePortfolio(userId: string, data: object): Promise<void> {
  await setDoc(doc(db, 'portfolios', userId), data);
}

export async function saveSettings(userId: string, data: object): Promise<void> {
  await setDoc(doc(db, 'settings', userId), data);
}

// ── Public leaderboard ────────────────────────────────────────────────────

/** Writes a sanitised public summary of a user's portfolio to Firestore.
 *  This document is readable by all authenticated users for the leaderboard. */
export async function savePublicProfile(userId: string, data: object): Promise<void> {
  await setDoc(doc(db, 'public_portfolios', userId), data);
}

export interface PublicHolding {
  companyId: string;
  symbol: string;
  companyName: string;
  sector: string;
  shares: number;
  avgBuyPrice: number; // pence
}

export interface PublicProfile {
  uid: string;
  displayName: string;
  initialBalance: number; // GBP
  cashBalance: number;    // GBP
  holdings: PublicHolding[];
  updatedAt: string;
}

/** Fetch all public portfolio documents for the leaderboard. */
export async function fetchLeaderboard(): Promise<PublicProfile[]> {
  const snap = await getDocs(collection(db, 'public_portfolios'));
  return snap.docs.map(d => ({ uid: d.id, ...d.data() } as PublicProfile));
}
