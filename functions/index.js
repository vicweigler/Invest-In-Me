const { onRequest } = require('firebase-functions/v2/https');
const { setGlobalOptions } = require('firebase-functions/v2');

// yahoo-finance2 v3 requires class instantiation
const YahooFinance = require('yahoo-finance2').default;
const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

setGlobalOptions({ timeoutSeconds: 120, memory: '256MiB' });

function setCors(res) {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
}

/**
 * GET /quotes?symbols=LLOY.L,AZN.L,...
 * Returns Yahoo Finance quote data in the same shape as the Vite dev proxy.
 */
exports.quotes = onRequest({ cors: true }, async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  const symbolsParam = (req.query.symbols ?? '').toString();
  const symbols = symbolsParam.split(',').filter(Boolean);

  if (symbols.length === 0) {
    res.status(400).json({ error: 'No symbols provided' });
    return;
  }

  try {
    const quotes = await yf.quote(symbols, {
      fields: [
        'regularMarketPrice',
        'regularMarketChangePercent',
        'marketCap',
        'trailingPE',
        'trailingAnnualDividendYield',
        'currency',
      ],
    });

    const result = Array.isArray(quotes) ? quotes : [quotes];
    res.json({ quoteResponse: { result } });
  } catch (err) {
    console.error('[quotes]', err);
    res.status(500).json({ error: String(err) });
  }
});

/**
 * GET /fundamentals?symbols=AZN.L,LLOY.L,...
 * Returns Yahoo Finance quoteSummary (financialData + defaultKeyStatistics)
 * for real fundamental data used by the Stock Scan scoring engine.
 */
exports.fundamentals = onRequest({ cors: true }, async (req, res) => {
    setCors(res);
    if (req.method === 'OPTIONS') { res.status(204).send(''); return; }

    const symbolsParam = (req.query.symbols ?? '').toString();
    const symbols = symbolsParam.split(',').filter(Boolean);

    if (symbols.length === 0) {
      res.status(400).json({ error: 'No symbols provided' });
      return;
    }

    // Fetch quoteSummary in parallel batches of 5 to avoid rate limits
    const BATCH = 5;
    const results = [];

    for (let i = 0; i < symbols.length; i += BATCH) {
      const chunk = symbols.slice(i, i + BATCH);
      const settled = await Promise.allSettled(
        chunk.map(sym =>
          yf.quoteSummary(sym, { modules: ['financialData', 'defaultKeyStatistics'] })
            .then(data => ({ symbol: sym, ...data }))
        )
      );
      for (let j = 0; j < chunk.length; j++) {
        const r = settled[j];
        results.push(
          r.status === 'fulfilled'
            ? r.value
            : { symbol: chunk[j], error: true, reason: String(r.reason) }
        );
      }
    }

    res.json({ results });
  });
