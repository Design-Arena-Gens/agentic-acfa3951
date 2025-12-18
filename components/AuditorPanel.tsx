import { useState } from 'react';
import { SystemState, ExecutionLog, Expense } from '@/lib/types';
import { AuditorAgent } from '@/lib/agents/auditor';

interface AuditorPanelProps {
  state: SystemState;
  auditor: AuditorAgent;
  onUpdateState: (state: SystemState) => void;
}

export default function AuditorPanel({ state, auditor, onUpdateState }: AuditorPanelProps) {
  const [selectedRoutineId, setSelectedRoutineId] = useState('');
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);
  const [completed, setCompleted] = useState(false);
  const [skipReason, setSkipReason] = useState('');

  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState(0);
  const [expenseCategory, setExpenseCategory] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);

  const activeRoutines = state.routines.filter((r) => r.status === 'active');
  const budgetCategories = [...new Set(state.budget.map((b) => b.category))];

  const handleLogExecution = () => {
    if (!selectedRoutineId) {
      alert('Please select a routine');
      return;
    }

    const log: ExecutionLog = {
      id: `log-${Date.now()}`,
      routineTaskId: selectedRoutineId,
      scheduledDate: logDate,
      completed,
      completedAt: completed ? new Date().toISOString() : undefined,
      skipped: !completed,
      skipReason: !completed ? skipReason : undefined,
    };

    onUpdateState({
      ...state,
      executionLogs: [...state.executionLogs, log],
    });

    setSelectedRoutineId('');
    setCompleted(false);
    setSkipReason('');
  };

  const handleLogExpense = () => {
    if (!expenseDesc || expenseAmount <= 0 || !expenseCategory) {
      alert('Please fill all expense fields');
      return;
    }

    const expense: Expense = {
      id: `expense-${Date.now()}`,
      description: expenseDesc,
      amount: expenseAmount,
      category: expenseCategory,
      date: expenseDate,
      approved: false,
    };

    onUpdateState({
      ...state,
      expenses: [...state.expenses, expense],
    });

    setExpenseDesc('');
    setExpenseAmount(0);
    setExpenseCategory('');
  };

  const handleRunAudit = (type: 'routine' | 'budget' | 'goal') => {
    let audit;
    if (type === 'routine') {
      audit = auditor.auditRoutineCompliance(state, 'week');
    } else if (type === 'budget') {
      audit = auditor.auditBudgetCompliance(state, 'week');
    } else {
      audit = auditor.auditGoalProgress(state);
    }

    const violations = auditor.detectViolations(state, audit);

    onUpdateState({
      ...state,
      auditReports: [...state.auditReports, audit],
      violations: [...state.violations, ...violations],
    });

    alert(`Audit complete. Found ${violations.length} violations.`);
  };

  const recentAudits = state.auditReports.slice(-5).reverse();
  const recentLogs = state.executionLogs.slice(-10).reverse();
  const recentExpenses = state.expenses.slice(-10).reverse();

  return (
    <div className="space-y-6">
      <div className="bg-gray-900 rounded-lg border border-purple-900/50 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-purple-400">Auditor Agent</h2>
          <span className="px-3 py-1 bg-purple-500/20 text-purple-400 text-xs rounded-full border border-purple-500/50">
            READ & ANALYZE ONLY
          </span>
        </div>
        <p className="text-sm text-gray-400">
          The Auditor reads execution logs, expenses, and goal progress to detect violations. It
          cannot modify data or enforce consequences.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Log Routine Execution</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Routine</label>
              <select
                value={selectedRoutineId}
                onChange={(e) => setSelectedRoutineId(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white focus:outline-none focus:border-purple-500"
              >
                <option value="">Select routine</option>
                {activeRoutines.map((routine) => (
                  <option key={routine.id} value={routine.id}>
                    {routine.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Date</label>
              <input
                type="date"
                value={logDate}
                onChange={(e) => setLogDate(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white focus:outline-none focus:border-purple-500"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={completed}
                onChange={(e) => setCompleted(e.target.checked)}
                className="mr-2"
              />
              <label className="text-sm text-gray-400">Completed</label>
            </div>
            {!completed && (
              <div>
                <label className="block text-sm text-gray-400 mb-2">Skip Reason</label>
                <input
                  type="text"
                  value={skipReason}
                  onChange={(e) => setSkipReason(e.target.value)}
                  placeholder="Why was this skipped?"
                  className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                />
              </div>
            )}
            <button
              onClick={handleLogExecution}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
            >
              Log Execution
            </button>
          </div>
        </div>

        <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Log Expense</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Description</label>
              <input
                type="text"
                value={expenseDesc}
                onChange={(e) => setExpenseDesc(e.target.value)}
                placeholder="What was purchased?"
                className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Amount ($)</label>
              <input
                type="number"
                value={expenseAmount}
                onChange={(e) => setExpenseAmount(Number(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Category</label>
              <select
                value={expenseCategory}
                onChange={(e) => setExpenseCategory(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white focus:outline-none focus:border-purple-500"
              >
                <option value="">Select category</option>
                {budgetCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Date</label>
              <input
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white focus:outline-none focus:border-purple-500"
              />
            </div>
            <button
              onClick={handleLogExpense}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
            >
              Log Expense
            </button>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Run Audits</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => handleRunAudit('routine')}
            className="px-4 py-3 bg-purple-900/50 text-purple-400 rounded hover:bg-purple-900 transition-colors border border-purple-800"
          >
            Audit Routine Compliance
          </button>
          <button
            onClick={() => handleRunAudit('budget')}
            className="px-4 py-3 bg-purple-900/50 text-purple-400 rounded hover:bg-purple-900 transition-colors border border-purple-800"
          >
            Audit Budget Compliance
          </button>
          <button
            onClick={() => handleRunAudit('goal')}
            className="px-4 py-3 bg-purple-900/50 text-purple-400 rounded hover:bg-purple-900 transition-colors border border-purple-800"
          >
            Audit Goal Progress
          </button>
        </div>
      </div>

      {recentAudits.length > 0 && (
        <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Audit Reports</h3>
          <div className="space-y-4">
            {recentAudits.map((audit) => (
              <div key={audit.id} className="bg-gray-800/50 border border-gray-700 rounded p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-white font-semibold capitalize">
                    {audit.type} Audit
                  </div>
                  <span
                    className={`px-2 py-1 text-xs rounded ${
                      audit.severity === 'critical'
                        ? 'bg-red-500/20 text-red-400'
                        : audit.severity === 'high'
                        ? 'bg-orange-500/20 text-orange-400'
                        : audit.severity === 'medium'
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-green-500/20 text-green-400'
                    }`}
                  >
                    {audit.severity}
                  </span>
                </div>
                <div className="text-xs text-gray-400 mb-3">
                  {new Date(audit.generatedAt).toLocaleString()}
                </div>
                <div className="space-y-2">
                  {audit.findings.slice(0, 3).map((finding, idx) => (
                    <div key={idx} className="text-sm text-gray-300 bg-gray-900/50 p-2 rounded">
                      <div className="font-medium">{finding.description}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        {finding.metric}: {finding.actual} / {finding.target} (
                        {finding.variance > 0 ? '+' : ''}
                        {finding.variance}%)
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
