// Router root for the FAST Insights app.
//
// Routes:
//   /login   → AuthPage (public — sign in / create account / password reset)
//   /nda     → NDAPage (public — opened from the signup form)
//   /        → Landing (tool picker; sign-in required)
//   /ar      → AR Reconciliation tool (sign-in required)
//   *        → redirect to landing
//
// Everything except /login and /nda sits behind RequireAuth — the Scout
// Quest-style localStorage guard + 20-minute idle timeout (src/lib/auth.tsx).
// The static /gantt page uses the same guard via public/fi-idle.js.

import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import Landing from './pages/Landing';
import ARTool from './pages/ARTool';
import AuthPage from './pages/AuthPage';
import NDAPage from './pages/NDAPage';
import { RequireAuth } from './lib/auth';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<AuthPage />} />
        <Route path="/nda" element={<NDAPage />} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <Landing />
            </RequireAuth>
          }
        />
        <Route
          path="/ar"
          element={
            <RequireAuth>
              <ARTool />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {/* Privacy-first, cookieless page analytics (Vercel Web Analytics). Enable it in the
          Vercel project dashboard (Analytics tab) for data to start flowing. */}
      <Analytics />
    </BrowserRouter>
  );
}
