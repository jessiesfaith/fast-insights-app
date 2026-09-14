// Router root for the FAST Insights app.
//
// Routes:
//   /                  → Landing (tool picker)
//   /ar                → AR Reconciliation tool (the original single-page app)
//   /market-scenarios  → Market Scenarios (macro scenario teaching model)
//   /corporate-finance → Corporate Finance Lab (capital allocation · customer
//                        credit underwriting · treasury & hedging playbook)
//   /financial-model   → Financial Model Lab (learn SQL + Python by building an
//                        ML capital-allocation pipeline, with BI/Excel reports)
//   /revenue-schedule  → Revenue Schedule / Sub Rev Sch (invoice-to-amortization
//                        schedules with accrual-vs-tax deferred revenue)
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
import FinancialModelLab from './pages/FinancialModelLab';
import RevenueSchedule from './pages/RevenueSchedule';
import PulseBot from './components/PulseBot';
import PulseInbox from './pages/PulseInbox';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/ar" element={<ARTool />} />
        <Route path="/market-scenarios" element={<MarketScenarios />} />
        <Route path="/corporate-finance" element={<CorporateFinanceLab />} />
        <Route path="/financial-model" element={<FinancialModelLab />} />
        <Route path="/revenue-schedule" element={<RevenueSchedule />} />
        {/* Owner/demo view of collected Pulse feedback (device-local until
            Supabase is configured). Deliberately not on the Landing grid. */}
        <Route path="/pulse-inbox" element={<PulseInbox />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {/* Pulse — floating feedback survey + suggestion widget, on every page.
          Completed surveys land in Supabase pulse_feedback (local fallback). */}
      <PulseBot />
      {/* Privacy-first, cookieless page analytics (Vercel Web Analytics). Enable it in the
          Vercel project dashboard (Analytics tab) for data to start flowing. */}
      <Analytics />
    </BrowserRouter>
  );
}
