// Router root for the FAST Insights app.
//
// Routes:
//   /                  → Landing (tool picker)
//   /ar                → AR Reconciliation tool (the original single-page app)
//   /market-scenarios  → Market Scenarios (macro scenario teaching model)
//   /corporate-finance → Corporate Finance Lab (capital allocation · customer
//                        credit underwriting · treasury & hedging playbook)
//   *                  → redirect to landing
//
// Future tools (Revenue Recognition, Cashflow) will mount here as additional
// routes, sharing the same domain, deploy pipeline, and auth surface.

import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import Landing from './pages/Landing';
import ARTool from './pages/ARTool';
import MarketScenarios from './pages/MarketScenarios';
import CorporateFinanceLab from './pages/CorporateFinanceLab';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/ar" element={<ARTool />} />
        <Route path="/market-scenarios" element={<MarketScenarios />} />
        <Route path="/corporate-finance" element={<CorporateFinanceLab />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {/* Privacy-first, cookieless page analytics (Vercel Web Analytics). Enable it in the
          Vercel project dashboard (Analytics tab) for data to start flowing. */}
      <Analytics />
    </BrowserRouter>
  );
}
