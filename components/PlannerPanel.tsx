import { useState } from 'react';
import { SystemState, PlannerProposal } from '@/lib/types';
import { PlannerAgent } from '@/lib/agents/planner';

interface PlannerPanelProps {
  state: SystemState;
  planner: PlannerAgent;
  onUpdateState: (state: SystemState) => void;
}

export default function PlannerPanel({ state, planner, onUpdateState }: PlannerPanelProps) {
  const [goals, setGoals] = useState<string[]>(['']);
  const [dailyTime, setDailyTime] = useState(60);
  const [weeklyTime, setWeeklyTime] = useState(420);
  const [monthlyIncome, setMonthlyIncome] = useState(5000);
  const [financialPriorities, setFinancialPriorities] = useState<string[]>(['']);

  const addGoal = () => setGoals([...goals, '']);
  const updateGoal = (index: number, value: string) => {
    const updated = [...goals];
    updated[index] = value;
    setGoals(updated);
  };
  const removeGoal = (index: number) => {
    setGoals(goals.filter((_, i) => i !== index));
  };

  const addPriority = () => setFinancialPriorities([...financialPriorities, '']);
  const updatePriority = (index: number, value: string) => {
    const updated = [...financialPriorities];
    updated[index] = value;
    setFinancialPriorities(updated);
  };
  const removePriority = (index: number) => {
    setFinancialPriorities(financialPriorities.filter((_, i) => i !== index));
  };

  const handleCreateProposal = () => {
    const filteredGoals = goals.filter((g) => g.trim().length > 0);
    const filteredPriorities = financialPriorities.filter((p) => p.trim().length > 0);

    if (filteredGoals.length === 0) {
      alert('Please enter at least one goal');
      return;
    }

    const proposal = planner.createProposal(
      filteredGoals,
      { daily: dailyTime, weekly: weeklyTime },
      filteredPriorities,
      monthlyIncome
    );

    const updatedState = {
      ...state,
      plannerProposals: [...state.plannerProposals, { ...proposal, status: 'submitted' as const }],
    };

    onUpdateState(updatedState);
    alert('Proposal submitted! Go to Enforcer tab to approve or reject.');
  };

  return (
    <div className="space-y-6">
      <div className="bg-gray-900 rounded-lg border border-blue-900/50 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-blue-400">Planner Agent</h2>
          <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full border border-blue-500/50">
            PROPOSE ONLY
          </span>
        </div>
        <p className="text-sm text-gray-400">
          The Planner generates measurable goals, routines, and budgets. It can only propose—never
          approve or enforce.
        </p>
      </div>

      <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Define Your Goals</h3>
        <div className="space-y-3">
          {goals.map((goal, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={goal}
                onChange={(e) => updateGoal(index, e.target.value)}
                placeholder={`Goal ${index + 1} (e.g., Learn React, Build SaaS product)`}
                className="flex-1 bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
              {goals.length > 1 && (
                <button
                  onClick={() => removeGoal(index)}
                  className="px-3 py-2 bg-red-900/50 text-red-400 rounded hover:bg-red-900 transition-colors"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button
            onClick={addGoal}
            className="px-4 py-2 bg-blue-900/50 text-blue-400 rounded hover:bg-blue-900 transition-colors"
          >
            + Add Goal
          </button>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Time Availability</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Daily Time (minutes)</label>
            <input
              type="number"
              value={dailyTime}
              onChange={(e) => setDailyTime(Number(e.target.value))}
              className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Weekly Time (minutes)</label>
            <input
              type="number"
              value={weeklyTime}
              onChange={(e) => setWeeklyTime(Number(e.target.value))}
              className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Financial Planning</h3>
        <div className="mb-4">
          <label className="block text-sm text-gray-400 mb-2">Monthly Income ($)</label>
          <input
            type="number"
            value={monthlyIncome}
            onChange={(e) => setMonthlyIncome(Number(e.target.value))}
            className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="space-y-3">
          <label className="block text-sm text-gray-400">Financial Priorities</label>
          {financialPriorities.map((priority, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={priority}
                onChange={(e) => updatePriority(index, e.target.value)}
                placeholder={`Priority ${index + 1} (e.g., Education, Equipment)`}
                className="flex-1 bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
              {financialPriorities.length > 1 && (
                <button
                  onClick={() => removePriority(index)}
                  className="px-3 py-2 bg-red-900/50 text-red-400 rounded hover:bg-red-900 transition-colors"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button
            onClick={addPriority}
            className="px-4 py-2 bg-blue-900/50 text-blue-400 rounded hover:bg-blue-900 transition-colors"
          >
            + Add Priority
          </button>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleCreateProposal}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
        >
          Generate Proposal
        </button>
      </div>

      {state.plannerProposals.length > 0 && (
        <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Proposals</h3>
          <div className="space-y-4">
            {state.plannerProposals.slice(-3).reverse().map((proposal, index) => (
              <div key={index} className="bg-gray-800/50 border border-gray-700 rounded p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">
                    {new Date(proposal.createdAt).toLocaleString()}
                  </span>
                  <span
                    className={`px-2 py-1 text-xs rounded ${
                      proposal.status === 'approved'
                        ? 'bg-green-500/20 text-green-400'
                        : proposal.status === 'rejected'
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}
                  >
                    {proposal.status}
                  </span>
                </div>
                <div className="text-sm text-white">
                  {proposal.goals.length} goals, {proposal.routines.length} routines,{' '}
                  {proposal.budget.length} budget items
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
