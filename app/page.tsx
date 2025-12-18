'use client';

import { useState, useEffect } from 'react';
import { SystemState, PlannerProposal } from '@/lib/types';
import { loadState, saveState, getInitialState } from '@/lib/storage';
import { PlannerAgent } from '@/lib/agents/planner';
import { AuditorAgent } from '@/lib/agents/auditor';
import { EnforcerAgent } from '@/lib/agents/enforcer';
import PlannerPanel from '@/components/PlannerPanel';
import AuditorPanel from '@/components/AuditorPanel';
import EnforcerPanel from '@/components/EnforcerPanel';
import Dashboard from '@/components/Dashboard';

export default function Home() {
  const [state, setState] = useState<SystemState>(getInitialState());
  const [activeTab, setActiveTab] = useState<'dashboard' | 'planner' | 'auditor' | 'enforcer'>('dashboard');
  const [planner] = useState(() => new PlannerAgent());
  const [auditor] = useState(() => new AuditorAgent());
  const [enforcer] = useState(() => new EnforcerAgent());

  useEffect(() => {
    const loaded = loadState();
    setState(loaded);
  }, []);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const updateState = (newState: SystemState) => {
    setState(newState);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <header className="bg-gray-900 border-b border-red-900/50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-red-500">
            Multi-Agent Productivity Enforcer
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Autonomous system for goal enforcement and performance accountability
          </p>
        </div>
      </header>

      <nav className="bg-gray-900/50 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-1">
            {(['dashboard', 'planner', 'auditor', 'enforcer'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 text-sm font-medium capitalize transition-colors ${
                  activeTab === tab
                    ? 'bg-gray-800 text-red-400 border-b-2 border-red-500'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'dashboard' && (
          <Dashboard state={state} auditor={auditor} />
        )}
        {activeTab === 'planner' && (
          <PlannerPanel
            state={state}
            planner={planner}
            onUpdateState={updateState}
          />
        )}
        {activeTab === 'auditor' && (
          <AuditorPanel
            state={state}
            auditor={auditor}
            onUpdateState={updateState}
          />
        )}
        {activeTab === 'enforcer' && (
          <EnforcerPanel
            state={state}
            enforcer={enforcer}
            onUpdateState={updateState}
          />
        )}
      </main>

      <footer className="mt-16 border-t border-gray-800 bg-gray-900/30">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-sm text-gray-500">
          <p>System Status: <span className="text-green-500">ACTIVE</span></p>
          <p className="mt-1">Enforcement Mode: <span className="text-red-500">ENABLED</span></p>
        </div>
      </footer>
    </div>
  );
}
