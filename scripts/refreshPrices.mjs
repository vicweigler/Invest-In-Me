/**
 * Fetches live prices for all 100 FTSE companies via yahoo-finance2 and
 * patches the currentPrice values in src/data/companies.ts in-place.
 *
 * Usage: node scripts/refreshPrices.mjs
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const COMPANIES_PATH = join(__dirname, '../src/data/companies.ts');

// All 100 FTSE symbols in order
const SYMBOLS = [
  'AZN','GSK','HLN','SN','HIK',
  'SHEL','BP',
  'RIO','BHP','AAL','GLEN','ANTO','MNDI','FRES','SMDS',
  'HSBA','BARC','LLOY','NWG','STAN','LSEG','III','PRU','AV','LGEN',
  'PHNX','ADM','HSX','BEZ','ICP','EMG','SDR','ABDN','HL','DLG',
  'BA','RR','CPG','FERG','REL','EXPN','HLMA','SPX','BNZL','IMI',
  'ITRK','SMIN','RTO','WEIR','MRO','IAG','EZJ','DCC',
  'ULVR','DGE','RKT','IMB','BATS','TSCO','SBRY','ABF','CCH',
  'NXT','MKS','JD','IHG','FLTR','WTB','BRBY','ENT','BME','KGF','FRAS',
  'SGE','AUTO','RMV','OCDO','PSON',
  'SGRO','LAND','BLND','UTG','BKG','BDEV','PSN','TW','BBOX','PHP','HMSO',
  'NG','SSE','SVT','UU','CNA','PNN',
  'VOD','BT','WPP','ITV',
  'EDV',
];

function toYahooSymbol(symbol) {
  return `${symbol}.L`;
}

// Initialise once (v3+ requires class instantiation)
const YahooFinance = (await import('yahoo-finance2')).default;
const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

// Fetch GBP/USD exchange rate so we can convert USD-priced LSE stocks to pence
async function getGbpUsdRate() {
  try {
    const q = await yf.quote('GBPUSD=X');
    return q?.regularMarketPrice ?? 1.27;
  } catch {
    return 1.27; // sensible fallback
  }
}

async function fetchBatch(symbols) {
  const yahooSymbols = symbols.map(toYahooSymbol);
  try {
    const results = await yf.quote(yahooSymbols);
    return Array.isArray(results) ? results : [results];
  } catch (err) {
    console.warn(`  Batch error: ${err.message}`);
    return [];
  }
}

async function main() {
  console.log('Fetching live prices for all 100 FTSE companies...\n');

  const BATCH_SIZE = 25;
  const priceMap = new Map(); // symbol → price in pence

  const gbpUsd = await getGbpUsdRate();
  console.log(`  GBP/USD rate: ${gbpUsd.toFixed(4)}\n`);

  for (let i = 0; i < SYMBOLS.length; i += BATCH_SIZE) {
    const batch = SYMBOLS.slice(i, i + BATCH_SIZE);
    console.log(`  Fetching batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.join(', ')}`);
    const results = await fetchBatch(batch);

    for (const q of results) {
      if (q?.regularMarketPrice == null) continue;
      const symbol = q.symbol.replace(/\.L$/i, '');
      let price = q.regularMarketPrice;
      // GBp  → already in pence (most LSE stocks)
      // GBP  → pounds, multiply by 100
      // USD  → convert to pence via GBP/USD rate
      if (q.currency === 'GBP') price = price * 100;
      else if (q.currency === 'USD') price = (price / gbpUsd) * 100;
      priceMap.set(symbol, Math.round(price));
    }

    // Small delay between batches to be polite
    if (i + BATCH_SIZE < SYMBOLS.length) {
      await new Promise(r => setTimeout(r, 300));
    }
  }

  console.log(`\nFetched ${priceMap.size} / ${SYMBOLS.length} prices.\n`);

  // Read companies.ts and patch currentPrice values
  let content = readFileSync(COMPANIES_PATH, 'utf-8');
  let updated = 0;
  let skipped = 0;

  for (const [symbol, newPrice] of priceMap.entries()) {
    // Match: symbol:'LLOY', name:'...', sector:'...', currentPrice:58
    // All properties are on a single line so this is safe without 's' flag
    const regex = new RegExp(
      `(symbol:'${symbol}',[^\\n]*?currentPrice:)(\\d+)`,
      'g'
    );
    const before = content;
    content = content.replace(regex, (_, prefix, oldPrice) => {
      const old = parseInt(oldPrice, 10);
      if (old !== newPrice) {
        console.log(`  ${symbol.padEnd(6)} ${old}p → ${newPrice}p`);
        updated++;
      } else {
        skipped++;
      }
      return `${prefix}${newPrice}`;
    });

    if (content === before && !priceMap.has(symbol)) {
      console.warn(`  ${symbol}: no match found in companies.ts`);
    }
  }

  writeFileSync(COMPANIES_PATH, content, 'utf-8');
  console.log(`\nDone. Updated ${updated} prices, ${skipped} already correct.`);
  console.log('Run "npm run build && firebase deploy --only hosting" to publish.');
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
