const functions = require('firebase-functions');

// yahoo-finance2 v3 requires class instantiation
const YahooFinance = require('yahoo-finance2').default;
const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

/**
 * GET /quotes?symbols=LLOY.L,AZN.L,...
 * Returns Yahoo Finance quote data in the same shape as the Vite dev proxy.
 */
exports.quotes = functions.https.onRequest(async (req, res) => {
  // Allow browser requests from any origin (public read-only stock data)
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

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
