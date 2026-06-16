// Landing page for the FAST Insights app.
//
// Lives at "/" — a simple tool picker that lists the available finance tools.
// Designed to scale as more tools come online (Revenue Recognition, Cashflow).
// Uses the existing glass design system so the visual language stays unified
// with the AR Tool dashboard.

import { Link } from 'react-router-dom';
import { ArrowRight, BarChart3, Boxes, Building2, Calculator, ClipboardCheck, Factory, FileText, KeyRound, Landmark, PieChart, Sparkles, TrendingUp, Wallet } from 'lucide-react';
import GlassCard from '../components/ui/GlassCard';
import ThemeToggle from '../components/ui/ThemeToggle';

interface ToolEntry {
  id: string;
  name: string;
  tagline: string;
  href: string;
  icon: typeof BarChart3;
  status: 'live' | 'coming-soon';
}

const TOOLS: ToolEntry[] = [
  {
    id: 'ar',
    name: 'AR Reconciliation',
    tagline: 'Three-way recon, aging, exceptions, and audit pack — all in one.',
    href: '/ar',
    icon: BarChart3,
    status: 'live',
  },
  {
    id: 'revrec',
    name: 'Revenue Recognition',
    tagline: 'ASC 606 schedules, deferred revenue waterfalls, and rev-rec close support.',
    href: '/revrec',
    icon: TrendingUp,
    status: 'live',
  },
  {
    id: 'cashflow',
    name: 'Cashflow',
    tagline: 'Direct & indirect cashflow modeling, forecast vs. actual, and burn analysis.',
    href: '/cashflow',
    icon: Wallet,
    status: 'live',
  },
  {
    id: 'estimated-taxes',
    name: 'Estimated Taxes',
    tagline: 'W-2 + 1099 estimated-tax & safe-harbor analyzer — federal & California, with paystub / 1099 OCR.',
    href: '/estimated-taxes',
    icon: Calculator,
    status: 'live',
  },
  {
    id: 'property-for-stock',
    name: 'Property for Stock',
    tagline: 'Property-for-common-stock calculator — FMV/NBV deal sizing, §351 control test, journal entry, and §1245/§1250 recapture.',
    href: '/property-for-stock',
    icon: Building2,
    status: 'live',
  },
  {
    id: 'trust-strategy-builder',
    name: 'Trust Strategy Builder',
    tagline: 'Estate / trust / entity planning organizer & attorney-prep tool — assets, LLCs, sub-trusts, trustee protection, and a dynamic mind map. Planning only; not legal advice.',
    href: '/trust-strategy-builder',
    icon: Landmark,
    status: 'live',
  },
  {
    id: 'month-end-close',
    name: 'Month-End Close & Governance',
    tagline: 'Bookkeeping close checklist by workstream — segregation of duties, three-role sign-off, period lock, controls, and an exception log. Workflow only; not accounting advice.',
    href: '/month-end-close',
    icon: ClipboardCheck,
    status: 'live',
  },
  {
    id: 'inventory-reconciliation',
    name: 'Inventory Reconciliation',
    tagline: 'Full-cycle inventory recon — GL roll-forward, subledger-to-control tie-out, GR/IR & AP liability, obsolescence reserve, scrap & returns, product cost by invoice/GL, and turnover (MoM/QoQ/YTD/YoY). Workflow only; not accounting advice.',
    href: '/inventory-reconciliation',
    icon: Boxes,
    status: 'live',
  },
  {
    id: 'equity-management',
    name: 'Equity Management',
    tagline: 'Cap table + stock-based comp (ISOs, RSUs, ESPP, warrants) with Black-Scholes & ASC 718, bond and term-debt amortization, income statement with basic & diluted EPS, plus a ledger→subledger→GL reconciliation. Workflow only; not accounting, tax, or investment advice.',
    href: '/equity-management',
    icon: PieChart,
    status: 'live',
  },
  {
    id: 'financial-statements',
    name: 'Financial Statements',
    tagline: 'Consolidated I/S, B/S, OCI, retained earnings & equity rollforward, trial balance → adjusted TB, multi-currency consolidation of 3 subsidiaries with an elimination ledger, stock-based comp & pro forma, a Form 1065 tax book (Schedule K / K-1), 10-K / 10-Q, and a SOX delegation-of-authority approval matrix. Workflow only; not accounting, tax, or investment advice.',
    href: '/financial-statements',
    icon: FileText,
    status: 'live',
  },
  {
    id: 'fixed-assets-reconciliation',
    name: 'Fixed Assets Reconciliation',
    tagline: 'Full-cycle PP&E recon — dual roll-forward (gross cost + accumulated depreciation → net book value), CIP, capitalization policy, physical existence/tagging, depreciation, impairment, useful lives, disposals, ASC 842 leases, multi-currency consolidation, ARO, held-for-sale, intangibles, book-vs-tax (MACRS), and a SOX/AFE delegation-of-authority matrix. Workflow only; not accounting, tax, or audit advice.',
    href: '/fixed-assets-reconciliation',
    icon: Factory,
    status: 'live',
  },
  {
    id: 'lease-accounting',
    name: 'Lease Accounting',
    tagline: 'End-to-end ASC 842 lessee accounting — five-step finance/operating classification, ROU asset & lease liability measurement, amortization schedules, liability & ROU roll-forwards, subledger-to-GL tie-out, maturity analysis & disclosures, modifications, lessor accounting (sales-type / direct-financing / operating) and sale-leaseback, with an IFRS 16 toggle and a SOX delegation-of-authority matrix. Workflow only; not accounting, tax, or audit advice.',
    href: '/lease-accounting',
    icon: KeyRound,
    status: 'live',
  },
];

export default function Landing() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        padding: '48px 24px',
        maxWidth: 1080,
        margin: '0 auto',
        width: '100%',
      }}
    >
      <header style={{ marginBottom: 48 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            marginBottom: 12,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              color: 'var(--text-secondary)',
              fontSize: 12,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            <Sparkles size={14} />
            <span>FAST Insights</span>
          </div>
          <ThemeToggle />
        </div>
        <h1
          style={{
            fontSize: 36,
            fontWeight: 600,
            margin: 0,
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
          }}
        >
          Finance tools that close the books faster.
        </h1>
        <p
          style={{
            fontSize: 16,
            color: 'var(--text-secondary)',
            marginTop: 12,
            maxWidth: 640,
            lineHeight: 1.55,
          }}
        >
          Pick a tool below to get started. Each tool runs in your browser, supports
          CSV uploads and Supabase-backed data, and produces audit-ready outputs.
        </p>
      </header>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 20,
        }}
      >
        {TOOLS.map((tool) => {
          const Icon = tool.icon;
          const live = tool.status === 'live';
          const card = (
            <GlassCard
              variant="default"
              interactive={live}
              padding={24}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
                height: '100%',
                opacity: live ? 1 : 0.65,
                cursor: live ? 'pointer' : 'default',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'var(--surface-2)',
                    color: 'var(--accent)',
                  }}
                >
                  <Icon size={18} />
                </div>
                <h2
                  style={{
                    fontSize: 17,
                    fontWeight: 600,
                    margin: 0,
                    color: 'var(--text-primary)',
                  }}
                >
                  {tool.name}
                </h2>
              </div>
              <p
                style={{
                  fontSize: 13,
                  color: 'var(--text-secondary)',
                  margin: 0,
                  lineHeight: 1.55,
                  flex: 1,
                }}
              >
                {tool.tagline}
              </p>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: 4,
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: live ? 'var(--accent)' : 'var(--text-tertiary)',
                    fontWeight: 600,
                  }}
                >
                  {live ? 'Open' : 'Coming soon'}
                </span>
                {live && <ArrowRight size={16} color="var(--text-secondary)" />}
              </div>
            </GlassCard>
          );

          return live ? (
            <Link
              key={tool.id}
              to={tool.href}
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: 'none', color: 'inherit' }}
              aria-label={`Open ${tool.name} in a new tab`}
            >
              {card}
            </Link>
          ) : (
            <div key={tool.id} aria-disabled="true">
              {card}
            </div>
          );
        })}
      </section>

      <footer
        style={{
          marginTop: 'auto',
          paddingTop: 48,
          color: 'var(--text-tertiary)',
          fontSize: 12,
        }}
      >
        © FAST Insights — secure SOX/ICFR-aware finance tooling.
      </footer>
    </div>
  );
}
