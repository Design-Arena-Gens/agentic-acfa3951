import { useState } from 'react';
import { SystemState } from '@/lib/types';
import { EnforcerAgent } from '@/lib/agents/enforcer';

interface EnforcerPanelProps {
  state: SystemState;
  enforcer: EnforcerAgent;
  onUpdateState: (state: SystemState) => void;
}

export default function EnforcerPanel({ state, enforcer, onUpdateState }: EnforcerPanelProps) {
  const [selectedProposalIndex, setSelectedProposalIndex] = useState<number | null>(null);

  const pendingProposals = state.plannerProposals.filter(
    (p) => p.status === 'submitted'
  );

  const unenforcedViolations = state.violations.filter(
    (v) => !state.enforcementActions.some((a) => a.violationId === v.id)
  );

  const handleApproveProposal = (index: number) => {
    const actualIndex = state.plannerProposals.findIndex(
      (p) => p === pendingProposals[index]
    );
    const updatedState = enforcer.approveProposal(state, actualIndex);
    onUpdateState(updatedState);
    alert('Proposal approved and activated!');
  };

  const handleRejectProposal = (index: number) => {
    const actualIndex = state.plannerProposals.findIndex(
      (p) => p === pendingProposals[index]
    );
    const updatedState = enforcer.rejectProposal(state, actualIndex, 'Manual rejection');
    onUpdateState(updatedState);
    alert('Proposal rejected.');
  };

  const handleEnforceViolation = (violation: typeof unenforcedViolations[0]) => {
    const { action, updatedState } = enforcer.applyEnforcement(state, violation);
    onUpdateState(updatedState);
    alert(`Enforcement applied: ${action.description}`);
  };

  const handleRevokeGoal = (goalId: string) => {
    if (!confirm('Are you sure you want to revoke this goal?')) return;
    const reason = prompt('Enter revocation reason:');
    if (!reason) return;

    const updatedState = enforcer.revokeGoal(state, goalId, reason);
    onUpdateState(updatedState);
    alert('Goal revoked.');
  };

  const handleCleanupExpired = () => {
    const updatedState = enforcer.cleanupExpiredActions(state);
    onUpdateState(updatedState);
    alert('Expired enforcement actions cleaned up.');
  };

  return (
    <div className="space-y-6">
      <div className="bg-gray-900 rounded-lg border border-red-900/50 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-red-400">Enforcer Agent</h2>
          <span className="px-3 py-1 bg-red-500/20 text-red-400 text-xs rounded-full border border-red-500/50">
            HIGHEST AUTHORITY
          </span>
        </div>
        <p className="text-sm text-gray-400">
          The Enforcer has full authority to approve proposals, apply consequences, revoke goals,
          and enforce restrictions. All modifications to live state happen here.
        </p>
      </div>

      {pendingProposals.length > 0 && (
        <div className="bg-gray-900 rounded-lg border border-yellow-900/50 p-6">
          <h3 className="text-lg font-semibold text-yellow-400 mb-4">
            Pending Proposals ({pendingProposals.length})
          </h3>
          <div className="space-y-4">
            {pendingProposals.map((proposal, index) => (
              <div key={index} className="bg-gray-800/50 border border-gray-700 rounded p-4">
                <div className="mb-4">
                  <div className="text-sm text-gray-400 mb-2">
                    Submitted: {new Date(proposal.createdAt).toLocaleString()}
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="bg-gray-900/50 p-3 rounded">
                      <div className="text-xs text-gray-400">Goals</div>
                      <div className="text-xl font-bold text-white">{proposal.goals.length}</div>
                    </div>
                    <div className="bg-gray-900/50 p-3 rounded">
                      <div className="text-xs text-gray-400">Routines</div>
                      <div className="text-xl font-bold text-white">{proposal.routines.length}</div>
                    </div>
                    <div className="bg-gray-900/50 p-3 rounded">
                      <div className="text-xs text-gray-400">Budget Items</div>
                      <div className="text-xl font-bold text-white">{proposal.budget.length}</div>
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      setSelectedProposalIndex(selectedProposalIndex === index ? null : index)
                    }
                    className="text-sm text-blue-400 hover:text-blue-300 mb-2"
                  >
                    {selectedProposalIndex === index ? 'Hide Details' : 'Show Details'}
                  </button>

                  {selectedProposalIndex === index && (
                    <div className="space-y-4 mt-4 bg-gray-900/70 p-4 rounded">
                      <div>
                        <div className="text-sm font-semibold text-white mb-2">Goals:</div>
                        {proposal.goals.map((goal) => (
                          <div key={goal.id} className="text-xs text-gray-300 mb-2 pl-2">
                            • {goal.description}
                            <div className="text-gray-500 pl-2">
                              Measurable: {goal.measurable}
                            </div>
                            <div className="text-gray-500 pl-2">
                              Deadline: {new Date(goal.deadline).toLocaleDateString()}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div>
                        <div className="text-sm font-semibold text-white mb-2">Routines:</div>
                        {proposal.routines.map((routine) => (
                          <div key={routine.id} className="text-xs text-gray-300 mb-2 pl-2">
                            • {routine.name} ({routine.frequency}, {routine.duration}min at{' '}
                            {routine.timeBlock})
                          </div>
                        ))}
                      </div>

                      <div>
                        <div className="text-sm font-semibold text-white mb-2">Budget:</div>
                        {proposal.budget.map((item) => (
                          <div key={item.id} className="text-xs text-gray-300 mb-2 pl-2">
                            • {item.category}: ${item.amount} / {item.frequency}
                          </div>
                        ))}
                      </div>

                      <div>
                        <div className="text-sm font-semibold text-white mb-2">Assumptions:</div>
                        {proposal.assumptions.map((assumption, idx) => (
                          <div key={idx} className="text-xs text-gray-300 mb-1 pl-2">
                            • {assumption}
                          </div>
                        ))}
                      </div>

                      <div>
                        <div className="text-sm font-semibold text-white mb-2">Risks:</div>
                        {proposal.risks.map((risk, idx) => (
                          <div key={idx} className="text-xs text-orange-400 mb-1 pl-2">
                            ⚠ {risk}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleApproveProposal(index)}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                  >
                    Approve & Activate
                  </button>
                  <button
                    onClick={() => handleRejectProposal(index)}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {unenforcedViolations.length > 0 && (
        <div className="bg-gray-900 rounded-lg border border-red-900/50 p-6">
          <h3 className="text-lg font-semibold text-red-400 mb-4">
            Unenforced Violations ({unenforcedViolations.length})
          </h3>
          <div className="space-y-3">
            {unenforcedViolations.map((violation) => (
              <div key={violation.id} className="bg-red-950/30 border border-red-900/50 rounded p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-red-400 uppercase mb-1">
                      {violation.type.replace(/_/g, ' ')}
                    </div>
                    <div className="text-sm text-gray-300">{violation.description}</div>
                    <div className="text-xs text-gray-500 mt-2">
                      Detected: {new Date(violation.detectedAt).toLocaleString()}
                    </div>
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
                <button
                  onClick={() => handleEnforceViolation(violation)}
                  className="w-full mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                >
                  Apply Enforcement
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Active Goals Management</h3>
        {state.goals.filter((g) => g.status === 'active').length === 0 ? (
          <p className="text-sm text-gray-400">No active goals</p>
        ) : (
          <div className="space-y-3">
            {state.goals
              .filter((g) => g.status === 'active')
              .map((goal) => (
                <div key={goal.id} className="bg-gray-800/50 border border-gray-700 rounded p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-semibold text-white">{goal.description}</div>
                      <div className="text-sm text-gray-400 mt-1">{goal.measurable}</div>
                      <div className="text-xs text-gray-500 mt-2">
                        Deadline: {new Date(goal.deadline).toLocaleDateString()}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRevokeGoal(goal.id)}
                      className="ml-4 px-3 py-1 bg-red-900/50 text-red-400 rounded hover:bg-red-900 transition-colors text-sm"
                    >
                      Revoke
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">System Maintenance</h3>
        <button
          onClick={handleCleanupExpired}
          className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
        >
          Cleanup Expired Enforcements
        </button>
      </div>

      <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Active Enforcement Actions</h3>
        {state.enforcementActions.filter((a) => a.active).length === 0 ? (
          <p className="text-sm text-gray-400">No active enforcement actions</p>
        ) : (
          <div className="space-y-3">
            {state.enforcementActions
              .filter((a) => a.active)
              .map((action) => (
                <div key={action.id} className="bg-orange-950/30 border border-orange-900/50 rounded p-4">
                  <div className="text-xs font-semibold text-orange-400 uppercase mb-1">
                    {action.action}
                  </div>
                  <div className="text-sm text-gray-300">{action.description}</div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="text-xs text-gray-500">
                      Applied: {new Date(action.appliedAt).toLocaleString()}
                    </div>
                    {action.expiresAt && (
                      <div className="text-xs text-orange-400">
                        Expires: {new Date(action.expiresAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
