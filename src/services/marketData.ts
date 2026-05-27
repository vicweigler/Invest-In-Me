interface YahooQuoteResult {
  symbol: string;
  regularMarketPrice?: number;
  regularMarketChangePercent?: number;
  marketCap?: number;
  trailingPE?: number;
  trailingAnnualDividendYield?: number;
  currency?: string;
}

export interface RealQuote {
  symbol: string;        // original symbol (without .L)
  currentPrice: number;  // pence
  dayPerf: number;       // % change
  marketCap?: number;    // billions GBP
  peRatio?: number | null;
  dividendYield?: number | null;
}

// Symbols that need a custom Yahoo Finance suffix (not .L)
const SYMBOL_OVERRIDES: Record<string, string> = {
  // No overrides needed for standard LSE listings
};

function toYahooSymbol(symbol: string): string {
  return SYMBOL_OVERRIDES[symbol] ?? `${symbol}.L`;
}

// Yahoo Finance direct endpoint — works when CORS is not blocked (production fallback)
const YF_DIRECT = 'https://query1.finance.yahoo.com/v7/finance/quote';
const YF_FIELDS = 'regularMarketPrice,regularMarketChangePercent,marketCap,trailingPE,trailingAnnualDividendYield,currency';

async function fetchBatch(symbols: string[]): Promise<RealQuote[]> {
  const yahooSymbols = symbols.map(toYahooSymbol);
  const query = yahooSymbols.join(',');

  // Try sources in order. The Vite dev proxy works locally; Yahoo Finance direct
  // is attempted as a production fallback (succeeds when CORS headers are permissive).
  const sources = [
    `/api/quotes?symbols=${encodeURIComponent(query)}`,
    `${YF_DIRECT}?symbols=${encodeURIComponent(query)}&fields=${YF_FIELDS}&formatted=false&corsDomain=finance.yahoo.com`,
  ];

  let results: YahooQuoteResult[] = [];

  for (const url of sources) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const data = await res.json(); // throws SyntaxError if response is HTML (Firebase catch-all)
      const r: YahooQuoteResult[] = data?.quoteResponse?.result ?? [];
      if (r.length > 0) { results = r; break; }
    } catch {
      // Network error, CORS block, or JSON parse failure — try next source
    }
  }

  return results
    .filter((q) => q.regularMarketPrice != null)
    .map((q) => {
      const originalSymbol = q.symbol.replace(/\.L$/i, '');

      // yahoo-finance2 returns LSE stocks in GBp (pence).
      // If currency is "GBP" (rare), convert to pence.
      let price = q.regularMarketPrice!;
      if (q.currency === 'GBP') price = price * 100;

      return {
        symbol: originalSymbol,
        currentPrice: Math.round(price * 100) / 100,
        dayPerf: q.regularMarketChangePercent ?? 0,
        marketCap: q.marketCap ? q.marketCap / 1e9 : undefined,
        peRatio: q.trailingPE ?? null,
        dividendYield: q.trailingAnnualDividendYield != null
          ? q.trailingAnnualDividendYield * 100
          : null,
      };
    });
}

export async function fetchRealQuotes(symbols: string[]): Promise<Map<string, RealQuote>> {
  const BATCH_SIZE = 25;
  const map = new Map<string, RealQuote>();

  for (let i = 0; i < symbols.length; i += BATCH_SIZE) {
    const batch = symbols.slice(i, i + BATCH_SIZE);
    try {
      const quotes = await fetchBatch(batch);
      for (const q of quotes) {
        map.set(q.symbol, q);
      }
    } catch (err) {
      console.warn('[marketData] Failed to fetch batch', batch, err);
    }
  }

  return map;
}
