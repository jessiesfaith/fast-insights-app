import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../lib/theme';

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const next = theme === 'light' ? 'dark' : 'light';

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${next} mode`}
      title={`Switch to ${next} mode`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 10px',
        background: 'var(--accent-soft)',
        border: '1px solid var(--border)',
        borderRadius: 999,
        color: 'var(--text-secondary)',
        fontSize: 12,
      }}
    >
      {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
      <span style={{ textTransform: 'capitalize' }}>{theme}</span>
    </button>
  );
}

export default ThemeToggle;
