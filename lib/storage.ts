import { SystemState } from './types';

const STORAGE_KEY = 'productivity_enforcer_state';

export const getInitialState = (): SystemState => ({
  goals: [],
  routines: [],
  budget: [],
  expenses: [],
  executionLogs: [],
  auditReports: [],
  violations: [],
  enforcementActions: [],
  plannerProposals: [],
});

export const loadState = (): SystemState => {
  if (typeof window === 'undefined') return getInitialState();

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return getInitialState();
    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to load state:', error);
    return getInitialState();
  }
};

export const saveState = (state: SystemState): void => {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save state:', error);
  }
};
