# MTHS Financial Markets Clubs

React / Vinext (Next.js-compatible), Tailwind, Shadcn, and Lucide.

## Content
- `app/page.tsx`: site views and `PUBLISHED_SHEET_URL`. Set this to the public Holdings CSV URL for all visitors.
- `lib/club-data.ts`: approved leadership details and research library. All current materials are clearly labeled examples; no leadership identities are invented.
- `lib/portfolio.ts`: CSV parsing, validation and portfolio calculations.
- `public/reports`: downloadable educational sample PDFs; replace alongside report data when club research is published.

## Portfolio
Required CSV columns: Ticker, Company Name, Sector, Shares, Cost Basis, Current Price. Cost Basis is per share. Non-negative long-only holdings are supported; zero shares are omitted. Optional Cash Balance in the first populated data row overrides the default cash calculation. It is needed after sells, dividends, or fees. The starting balance is $10,000. Performance assumes no external cash flows.

Prices are supplied by the sheet, not a market API. Refresh occurs every 60 seconds and on demand. Bad input preserves previous data and displays an error. The Connect Sheet dialog saves only a browser-local preview setting; it does not change the shared site configuration.

## Local development / VS Code
Open this repository in VS Code. Install the project's declared pnpm version and run `pnpm install`. Run the Sites configure-execution-profile script when using the Sites plugin in a different environment, then `pnpm dev`. Keep the existing lockfile. The Codex IDE extension can edit this local checkout. This hosted chat does not directly write into a separate local VS Code checkout; use an authenticated Git remote and pull/push, or run Codex directly in your local project. Do not embed authentication tokens in Git URLs or committed files.
