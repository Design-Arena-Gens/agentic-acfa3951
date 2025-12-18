export type AgentType = 'planner' | 'auditor' | 'enforcer';

export interface Goal {
  id: string;
  description: string;
  measurable: string;
  deadline: string;
  status: 'proposed' | 'approved' | 'active' | 'failed' | 'completed';
  createdBy: AgentType;
  createdAt: string;
}

export interface RoutineTask {
  id: string;
  name: string;
  description: string;
  frequency: 'daily' | 'weekly';
  timeBlock: string;
  duration: number; // minutes
  linkedGoalId?: string;
  status: 'proposed' | 'approved' | 'active';
  createdBy: AgentType;
}

export interface BudgetItem {
  id: string;
  category: string;
  amount: number;
  frequency: 'monthly' | 'weekly' | 'daily';
  linkedGoalId?: string;
  status: 'proposed' | 'approved' | 'active';
  createdBy: AgentType;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  budgetItemId?: string;
  approved: boolean;
}

export interface ExecutionLog {
  id: string;
  routineTaskId: string;
  scheduledDate: string;
  completed: boolean;
  completedAt?: string;
  skipped: boolean;
  skipReason?: string;
}

export interface AuditReport {
  id: string;
  type: 'routine' | 'budget' | 'goal';
  period: string;
  findings: AuditFinding[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  generatedAt: string;
  createdBy: AgentType;
}

export interface AuditFinding {
  description: string;
  metric: string;
  target: number;
  actual: number;
  variance: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface Violation {
  id: string;
  type: 'missed_routine' | 'budget_overrun' | 'goal_slippage';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  detectedAt: string;
  auditReportId?: string;
  enforcementAction?: EnforcementAction;
}

export interface EnforcementAction {
  id: string;
  violationId: string;
  action: 'warning' | 'restriction' | 'escalation' | 'goal_revision';
  description: string;
  appliedAt: string;
  active: boolean;
  expiresAt?: string;
}

export interface PlannerProposal {
  goals: Goal[];
  routines: RoutineTask[];
  budget: BudgetItem[];
  assumptions: string[];
  risks: string[];
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  createdAt: string;
}

export interface SystemState {
  goals: Goal[];
  routines: RoutineTask[];
  budget: BudgetItem[];
  expenses: Expense[];
  executionLogs: ExecutionLog[];
  auditReports: AuditReport[];
  violations: Violation[];
  enforcementActions: EnforcementAction[];
  plannerProposals: PlannerProposal[];
}
