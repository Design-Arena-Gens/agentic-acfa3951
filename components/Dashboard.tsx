import { SystemState } from '@/lib/types';
import { AuditorAgent } from '@/lib/agents/auditor';

interface DashboardProps {
  state: SystemState;
  auditor: AuditorAgent;
}

export default function Dashboard({ state, auditor }: DashboardProps) {
  const diagnostics = auditor.generateDiagnostics(state);
  const activeGoals = state.goals.filter((g) => g.status === 'active');
  const activeRoutines = state.routines.filter((r) => r.status === 'active');
  const activeBudget = state.budget.filter((b) => b.status === 'active');
  const activeViolations = state.violations.filter(
    (v) => !state.enforcementActions.some((a) => a.violationId === v.id && a.active)
  );
  const activeEnforcements = state.enforcementActions.filter((a) => a.active);

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    if (score >= 40) return 'text-orange-500';
    return 'text-red-500';
  };

  const getHealthBg = (score: number) => {
    if (score >= 80) return 'bg-green-500/20 border-green-500/50';
    if (score >= 60) return 'bg-yellow-500/20 border-yellow-500/50';
    if (score >= 40) return 'bg-orange-500/20 border-orange-500/50';
    return 'bg-red-500/20 border-red-500/50';
  };

  return (
    <div className="space-y-6">
      <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
        <h2 className="text-xl font-bold text-red-400 mb-4">System Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <div className="text-sm text-gray-400">Active Goals</div>
            <div className="text-3xl font-bold text-white mt-1">{activeGoals.length}</div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <div className="text-sm text-gray-400">Active Routines</div>
            <div className="text-3xl font-bold text-white mt-1">{activeRoutines.length}</div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <div className="text-sm text-gray-400">Budget Items</div>
            <div className="text-3xl font-bold text-white mt-1">{activeBudget.length}</div>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
        <h2 className="text-xl font-bold text-red-400 mb-4">Health Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className={`rounded-lg p-4 border ${getHealthBg(diagnostics.routineHealth)}`}>
            <div className="text-sm text-gray-300">Routine Health</div>
            <div className={`text-3xl font-bold mt-1 ${getHealthColor(diagnostics.routineHealth)}`}>
              {Math.round(diagnostics.routineHealth)}%
            </div>
          </div>
          <div className={`rounded-lg p-4 border ${getHealthBg(diagnostics.budgetHealth)}`}>
            <div className="text-sm text-gray-300">Budget Health</div>
            <div className={`text-3xl font-bold mt-1 ${getHealthColor(diagnostics.budgetHealth)}`}>
              {Math.round(diagnostics.budgetHealth)}%
            </div>
          </div>
          <div className={`rounded-lg p-4 border ${getHealthBg(diagnostics.goalHealth)}`}>
            <div className="text-sm text-gray-300">Goal Health</div>
            <div className={`text-3xl font-bold mt-1 ${getHealthColor(diagnostics.goalHealth)}`}>
              {Math.round(diagnostics.goalHealth)}%
            </div>
          </div>
          <div className={`rounded-lg p-4 border ${getHealthBg(diagnostics.overallScore)}`}>
            <div className="text-sm text-gray-300">Overall Score</div>
            <div className={`text-3xl font-bold mt-1 ${getHealthColor(diagnostics.overallScore)}`}>
              {Math.round(diagnostics.overallScore)}%
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-900 rounded-lg border border-red-900/50 p-6">
          <h2 className="text-lg font-bold text-red-400 mb-4 flex items-center">
            <span className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></span>
            Active Violations
          </h2>
          {activeViolations.length === 0 ? (
            <p className="text-gray-400 text-sm">No active violations</p>
          ) : (
            <div className="space-y-2">
              {activeViolations.slice(0, 5).map((violation) => (
                <div
                  key={violation.id}
                  className="bg-red-950/30 border border-red-900/50 rounded p-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="text-xs font-semibold text-red-400 uppercase">
                        {violation.type.replace(/_/g, ' ')}
                      </div>
                      <div className="text-sm text-gray-300 mt-1">{violation.description}</div>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs rounded ${
                        violation.severity === 'critical'
                          ? 'bg-red-500/20 text-red-400'
                          : violation.severity === 'high'
                          ? 'bg-orange-500/20 text-orange-400'
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}
                    >
                      {violation.severity}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-gray-900 rounded-lg border border-orange-900/50 p-6">
          <h2 className="text-lg font-bold text-orange-400 mb-4">Active Enforcements</h2>
          {activeEnforcements.length === 0 ? (
            <p className="text-gray-400 text-sm">No active enforcement actions</p>
          ) : (
            <div className="space-y-2">
              {activeEnforcements.slice(0, 5).map((action) => (
                <div
                  key={action.id}
                  className="bg-orange-950/30 border border-orange-900/50 rounded p-3"
                >
                  <div className="text-xs font-semibold text-orange-400 uppercase">
                    {action.action}
                  </div>
                  <div className="text-sm text-gray-300 mt-1">{action.description}</div>
                  {action.expiresAt && (
                    <div className="text-xs text-gray-500 mt-2">
                      Expires: {new Date(action.expiresAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
        <h2 className="text-lg font-bold text-blue-400 mb-4">Active Goals</h2>
        {activeGoals.length === 0 ? (
          <p className="text-gray-400 text-sm">No active goals. Use Planner to create goals.</p>
        ) : (
          <div className="space-y-3">
            {activeGoals.map((goal) => (
              <div key={goal.id} className="bg-gray-800/50 border border-gray-700 rounded p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-semibold text-white">{goal.description}</div>
                    <div className="text-sm text-gray-400 mt-1">{goal.measurable}</div>
                    <div className="text-xs text-gray-500 mt-2">
                      Deadline: {new Date(goal.deadline).toLocaleDateString()}
                    </div>
                  </div>
                  <span className="px-2 py-1 text-xs rounded bg-green-500/20 text-green-400">
                    {goal.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
