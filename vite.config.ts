import { defineConfig, Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import type { IncomingMessage, ServerResponse } from 'http'

function yahooFinancePlugin(): Plugin {
  return {
    name: 'yahoo-finance-proxy',
    configureServer(server) {
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
    },
  }
}

export default defineConfig({
  plugins: [react(), yahooFinancePlugin()],
})
