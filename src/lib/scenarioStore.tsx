// Scenario state lives in its own React context so the dashboard,
// exceptions view, and customer drill-down can all read and mutate the
// same filters / what-if values.
//
// Not persisted — scenarios are intentionally session-scoped. The JSON
// snapshot export (milestone 10) includes the active scenario for archival.

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import {
  DEFAULT_FILTERS,
  DEFAULT_SCENARIO,
  DEFAULT_WHAT_IF,
  DemoState,
  ScenarioFilters,
  ScenarioState,
  WhatIfState,
} from '../types/scenario';

interface ScenarioStoreValue {
  scenario: ScenarioState;
  setFilters: (next: ScenarioFilters) => void;
  toggleFilter: (key: keyof ScenarioFilters, value: string) => void;
  clearFilters: () => void;
  setWhatIf: (next: Partial<WhatIfState>) => void;
  resetWhatIf: () => void;
  setDemoState: (next: DemoState) => void;
  setPresentation: (next: boolean) => void;
  togglePresentation: () => void;
  resetAll: () => void;
}

const ScenarioContext = createContext<ScenarioStoreValue | null>(null);

export function ScenarioProvider({ children }: { children: ReactNode }) {
  const [scenario, setScenario] = useState<ScenarioState>(DEFAULT_SCENARIO);

  const setFilters = useCallback((next: ScenarioFilters) => {
    setScenario((prev) => ({ ...prev, filters: next }));
  }, []);

  const toggleFilter = useCallback((key: keyof ScenarioFilters, value: string) => {
    setScenario((prev) => {
      const current = prev.filters[key];
      const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
      return { ...prev, filters: { ...prev.filters, [key]: next } };
    });
  }, []);

  const clearFilters = useCallback(() => {
    setScenario((prev) => ({ ...prev, filters: { ...DEFAULT_FILTERS } }));
  }, []);

  const setWhatIf = useCallback((next: Partial<WhatIfState>) => {
    setScenario((prev) => ({
      ...prev,
      whatIf: { ...prev.whatIf, ...next },
      // touching a what-if slider drops out of "cleaned" — slider state is
      // ignored when demoState='cleaned', so pretending otherwise is confusing
      demoState: prev.demoState === 'cleaned' ? 'as-is' : prev.demoState,
    }));
  }, []);

  const resetWhatIf = useCallback(() => {
    setScenario((prev) => ({ ...prev, whatIf: { ...DEFAULT_WHAT_IF } }));
  }, []);

  const setDemoState = useCallback((next: DemoState) => {
    setScenario((prev) => ({ ...prev, demoState: next }));
  }, []);

  const setPresentation = useCallback((next: boolean) => {
    setScenario((prev) => ({ ...prev, presentation: next }));
  }, []);

  const togglePresentation = useCallback(() => {
    setScenario((prev) => ({ ...prev, presentation: !prev.presentation }));
  }, []);

  const resetAll = useCallback(() => setScenario({ ...DEFAULT_SCENARIO }), []);

  const value = useMemo<ScenarioStoreValue>(
    () => ({
      scenario,
      setFilters,
      toggleFilter,
      clearFilters,
      setWhatIf,
      resetWhatIf,
      setDemoState,
      setPresentation,
      togglePresentation,
      resetAll,
    }),
    [scenario, setFilters, toggleFilter, clearFilters, setWhatIf, resetWhatIf, setDemoState, setPresentation, togglePresentation, resetAll],
  );

  return <ScenarioContext.Provider value={value}>{children}</ScenarioContext.Provider>;
}

export function useScenario(): ScenarioStoreValue {
  const ctx = useContext(ScenarioContext);
  if (!ctx) throw new Error('useScenario must be used within a ScenarioProvider');
  return ctx;
}
