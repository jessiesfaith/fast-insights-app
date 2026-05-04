// LockedPeriodProvider — exposes the period the user is currently looking at
// so deeply-nested components (TickmarkCell, in particular) can disable
// their inputs when that period is closed without prop-drilling.
//
// The provider wraps the Dashboard and AuditPack render trees in App.tsx.

import { ReactNode, createContext, useContext } from 'react';
import { useDataStore } from './dataStore';

const LockedPeriodContext = createContext<string | null>(null);

export function LockedPeriodProvider({
  period,
  children,
}: {
  period: string | null;
  children: ReactNode;
}) {
  return <LockedPeriodContext.Provider value={period}>{children}</LockedPeriodContext.Provider>;
}

/** Returns true when the period in this subtree has been closed. */
export function useIsPeriodLocked(): boolean {
  const period = useContext(LockedPeriodContext);
  const { isPeriodClosed } = useDataStore();
  return period ? isPeriodClosed(period) : false;
}
