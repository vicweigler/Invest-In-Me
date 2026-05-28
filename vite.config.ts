import { defineConfig, Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import type { IncomingMessage, ServerResponse } from 'http'

function yahooFinancePlugin(): Plugin {
  return {
    name: 'yahoo-finance-proxy',
    configureServer(server) {
      // ── /api/quotes ────────────────────────────────────────────────────────
      server.middlewares.use(
        '/api/quotes',
        async (req: IncomingMessage, res: ServerResponse) => {
          try {
            // yahoo-finance2 v3: default export is a class that must be instantiated
            const YahooFinance = (await import('yahoo-finance2')).default
            const yf = new YahooFinance()
            const url = new URL(req.url ?? '/', 'http://localhost')
            const symbolsParam = url.searchParams.get('symbols') ?? ''
            const symbols = symbolsParam.split(',').filter(Boolean)

            if (symbols.length === 0) {
              res.statusCode = 400
              res.end(JSON.stringify({ error: 'No symbols provided' }))
              return
            }

            const quotes = await yf.quote(symbols, {
              fields: [
                'regularMarketPrice',
                'regularMarketChangePercent',
                'marketCap',
                'trailingPE',
                'trailingAnnualDividendYield',
                'currency',
              ],
            })

            const result = Array.isArray(quotes) ? quotes : [quotes]
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ quoteResponse: { result } }))
          } catch (err) {
            console.error('[yahoo-finance-proxy]', err)
            res.statusCode = 500
            res.end(JSON.stringify({ error: String(err) }))
          }
        },
      )

      // ── /api/fundamentals ─────────────────────────────────────────────────
      server.middlewares.use(
        '/api/fundamentals',
        async (req: IncomingMessage, res: ServerResponse) => {
          try {
            const YahooFinance = (await import('yahoo-finance2')).default
            const yf = new YahooFinance()
            const url = new URL(req.url ?? '/', 'http://localhost')
            const symbolsParam = url.searchParams.get('symbols') ?? ''
            const symbols = symbolsParam.split(',').filter(Boolean)

            if (symbols.length === 0) {
              res.statusCode = 400
              res.end(JSON.stringify({ error: 'No symbols provided' }))
              return
            }

            const BATCH = 5
            const results: object[] = []

            for (let i = 0; i < symbols.length; i += BATCH) {
              const chunk = symbols.slice(i, i + BATCH)
              const settled = await Promise.allSettled(
                chunk.map(sym =>
                  yf.quoteSummary(sym, { modules: ['financialData', 'defaultKeyStatistics'] })
                    .then(data => ({ symbol: sym, ...data }))
                )
              )
              for (let j = 0; j < chunk.length; j++) {
                const r = settled[j]
                results.push(
                  r.status === 'fulfilled'
                    ? r.value
                    : { symbol: chunk[j], error: true }
                )
              }
            }

            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ results }))
          } catch (err) {
            console.error('[fundamentals-proxy]', err)
            res.statusCode = 500
            res.end(JSON.stringify({ error: String(err) }))
          }
        },
      )
    },
  }
}

export default defineConfig({
  plugins: [react(), yahooFinancePlugin()],
})
