// Router root for the FAST Insights app.
//
// Routes:
//   /        → Landing (tool picker)
//   /ar      → AR Reconciliation tool (the original single-page app)
//   *        → redirect to landing
//
// Future tools (Revenue Recognition, Cashflow) will mount here as additional
// routes, sharing the same domain, deploy pipeline, and auth surface.

import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import Landing from './pages/Landing';
import ARTool from './pages/ARTool';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/ar" element={<ARTool />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {/* Privacy-first, cookieless page analytics (Vercel Web Analytics). Enable it in the
          Vercel project dashboard (Analytics tab) for data to start flowing. */}
      <Analytics />
    </BrowserRouter>
  );
}
