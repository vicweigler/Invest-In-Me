export type Sector =
  | 'Energy'
  | 'Materials'
  | 'Financials'
  | 'Healthcare'
  | 'Consumer Staples'
  | 'Consumer Discretionary'
  | 'Industrials'
  | 'Technology'
  | 'Real Estate'
  | 'Utilities'
  | 'Communication Services';

export interface CompanyDefinition {
  id: string;
  symbol: string;
  name: string;
  sector: Sector;
  currentPrice: number; // in pence
  marketCap: number;    // billions GBP
  peRatio: number | null;
  dividendYield: number | null; // percentage
  description: string;
  founded: number;
  employees: number;
  headquarters: string;
  ftseRank: number;
  dayPerf: number;   // % change today
  weekPerf: number;  // % change this week
  monthPerf: number; // % change this month
  annualPerf: number; // % change this year
  volume: number;    // millions of shares/day
}

export interface PricePoint {
  date: string;       // YYYY-MM-DD
  price: number;      // pence
  open: number;
  high: number;
  low: number;
  volume: number;     // millions
}

export interface StockData extends CompanyDefinition {
  yearlyData: PricePoint[];
  sixMonthData: PricePoint[];
  threeMonthData: PricePoint[];
  monthlyData: PricePoint[];
  weeklyData: PricePoint[];
  high52w: number;
  low52w: number;
  threeMonthPerf: number;
  sixMonthPerf: number;
  // Generated fundamental metrics (seeded simulation)
  eps: number | null;
  revenueGrowth: number;
  debtToEquity: number;
  operatingCashFlowMargin: number;
  netProfitMargin: number;
  returnOnAssets: number;
  moatScore: number;
}

export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  source: string;
  publishedAt: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  category: 'company' | 'sector' | 'market';
  tags: string[];
}

export interface GeopoliticalEvent {
  id: string;
  title: string;
  description: string;
  region: string;
  impact: 'high' | 'medium' | 'low';
  affectedSectors: Sector[];
  date: string;
  sentiment: 'positive' | 'negative' | 'neutral';
}

export interface SectorAnalysis {
  sector: Sector;
  summary: string;
  outlook: 'Bullish' | 'Bearish' | 'Neutral';
  keyDrivers: string[];
  risks: string[];
}

// Portfolio
export interface Holding {
  companyId: string;
  symbol: string;
  companyName: string;
  sector: Sector;
  shares: number;
  avgBuyPrice: number; // pence
  transactions: Transaction[];
}

export interface Transaction {
  id: string;
  companyId: string;
  symbol: string;
  companyName: string;
  type: 'BUY' | 'SELL';
  shares: number;
  pricePerShare: number; // pence
  totalValue: number;    // GBP
  timestamp: string;
  fees: number;          // GBP
}

export interface PortfolioSnapshot {
  date: string;
  totalValue: number; // GBP
}
