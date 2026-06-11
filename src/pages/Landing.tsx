// Landing page for the FAST Insights app.
//
// Lives at "/" — a simple tool picker that lists the available finance tools.
// Designed to scale as more tools come online (Revenue Recognition, Cashflow).
// Uses the existing glass design system so the visual language stays unified
// with the AR Tool dashboard.

import { Link } from 'react-router-dom';
import { ArrowRight, BarChart3, Building2, Calculator, Landmark, Sparkles, TrendingUp, Wallet } from 'lucide-react';
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
