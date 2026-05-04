// Soft user-role toggle pinned next to the operator badge in the top bar.
// "User" cannot unlock a closed period; "Admin" can. There's no auth in
// this local-only tool, but every action is still timestamped to the
// operator name in the audit trail.

import { ShieldCheck, UserRound } from 'lucide-react';
import { useDataStore } from '../../lib/dataStore';

export function RoleBadge() {
  const { userRole, setUserRole, operator } = useDataStore();
  const isAdmin = userRole === 'admin';

  const onClick = () => {
    if (isAdmin) {
      setUserRole('user');
      return;
    }
    if (typeof window !== 'undefined') {
      const ok = window.confirm(
        'Switch to admin role?\n\nAdmins can unlock closed periods. Every unlock is logged with your operator name and timestamp.\n\n' +
          (operator ? `Acting as ${operator}.` : 'No operator name set — please set one before unlocking a period.'),
      );
      if (!ok) return;
    }
    setUserRole('admin');
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isAdmin}
      title={isAdmin ? 'Switch back to user role' : 'Switch to admin role (can unlock closed periods)'}
      className="row gap-1"
      style={{
        alignItems: 'center',
        background: isAdmin ? 'var(--accent)' : 'var(--bg-elevated)',
        border: `1px solid ${isAdmin ? 'var(--accent)' : 'var(--border)'}`,
        borderRadius: 999,
        padding: '4px 10px',
        color: isAdmin ? 'var(--accent-contrast)' : 'var(--text-tertiary)',
        fontSize: 11,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: 0.06,
        cursor: 'pointer',
      }}
    >
      {isAdmin ? <ShieldCheck size={11} /> : <UserRound size={11} />}
      {isAdmin ? 'Admin' : 'User'}
    </button>
  );
}

export default RoleBadge;
