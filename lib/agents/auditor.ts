import {
  SystemState,
  AuditReport,
  AuditFinding,
  Violation,
  ExecutionLog,
  Expense,
  Goal,
} from '../types';
import { format, startOfWeek, endOfWeek, isWithinInterval, parseISO } from 'date-fns';

export class AuditorAgent {
  // AUDITOR CAN ONLY READ AND ANALYZE - NEVER MODIFY OR ENFORCE

  auditRoutineCompliance(state: SystemState, period: 'week' | 'month'): AuditReport {
    const findings: AuditFinding[] = [];
    const activeRoutines = state.routines.filter((r) => r.status === 'active');

    activeRoutines.forEach((routine) => {
      const scheduledCount = this.getScheduledCount(routine.frequency, period);
      const completedLogs = state.executionLogs.filter(
        (log) =>
          log.routineTaskId === routine.id &&
          log.completed &&
          this.isInPeriod(log.scheduledDate, period)
      );

      const completionRate = (completedLogs.length / scheduledCount) * 100;
      const variance = completionRate - 100;

      findings.push({
        description: `Routine: ${routine.name}`,
        metric: 'Completion Rate (%)',
        target: 100,
        actual: Math.round(completionRate),
        variance: Math.round(variance),
        severity: this.calculateSeverity(variance),
      });
    });

    const overallSeverity = this.getMaxSeverity(findings);

    return {
      id: `audit-routine-${Date.now()}`,
      type: 'routine',
      period: period,
      findings,
      severity: overallSeverity,
      generatedAt: new Date().toISOString(),
      createdBy: 'auditor',
    };
  }

  auditBudgetCompliance(state: SystemState, period: 'week' | 'month'): AuditReport {
    const findings: AuditFinding[] = [];
    const activeBudget = state.budget.filter((b) => b.status === 'active');

    activeBudget.forEach((budgetItem) => {
      const periodBudget = this.normalizeToPeriod(
        budgetItem.amount,
        budgetItem.frequency,
        period
      );
      const actualSpent = state.expenses
        .filter(
          (e) =>
            e.category === budgetItem.category &&
            this.isInPeriod(e.date, period)
        )
        .reduce((sum, e) => sum + e.amount, 0);

      const variance = ((actualSpent - periodBudget) / periodBudget) * 100;

      findings.push({
        description: `Budget: ${budgetItem.category}`,
        metric: 'Spending vs Budget ($)',
        target: periodBudget,
        actual: actualSpent,
        variance: Math.round(variance),
        severity: variance > 10 ? 'high' : variance > 0 ? 'medium' : 'low',
      });
    });

    const overallSeverity = this.getMaxSeverity(findings);

    return {
      id: `audit-budget-${Date.now()}`,
      type: 'budget',
      period,
      findings,
      severity: overallSeverity,
      generatedAt: new Date().toISOString(),
      createdBy: 'auditor',
    };
  }

  auditGoalProgress(state: SystemState): AuditReport {
    const findings: AuditFinding[] = [];
    const activeGoals = state.goals.filter((g) => g.status === 'active');

    activeGoals.forEach((goal) => {
      const linkedRoutines = state.routines.filter((r) => r.linkedGoalId === goal.id);
      const totalScheduled = linkedRoutines.reduce((sum, routine) => {
        const daysActive = this.getDaysActive(goal.createdAt);
        return sum + (routine.frequency === 'daily' ? daysActive : Math.floor(daysActive / 7));
      }, 0);

      const totalCompleted = state.executionLogs.filter(
        (log) =>
          linkedRoutines.some((r) => r.id === log.routineTaskId) &&
          log.completed
      ).length;

      const completionRate = totalScheduled > 0 ? (totalCompleted / totalScheduled) * 100 : 0;
      const variance = completionRate - 100;

      const daysUntilDeadline = this.getDaysUntilDeadline(goal.deadline);
      const urgency = daysUntilDeadline < 14 ? 'high' : daysUntilDeadline < 30 ? 'medium' : 'low';

      findings.push({
        description: `Goal: ${goal.description}`,
        metric: 'Task Completion Rate (%)',
        target: 100,
        actual: Math.round(completionRate),
        variance: Math.round(variance),
        severity: completionRate < 50 ? 'critical' : this.calculateSeverity(variance),
      });
    });

    const overallSeverity = this.getMaxSeverity(findings);

    return {
      id: `audit-goal-${Date.now()}`,
      type: 'goal',
      period: 'current',
      findings,
      severity: overallSeverity,
      generatedAt: new Date().toISOString(),
      createdBy: 'auditor',
    };
  }

  detectViolations(state: SystemState, auditReport: AuditReport): Violation[] {
    const violations: Violation[] = [];

    auditReport.findings.forEach((finding) => {
      if (finding.severity === 'high' || finding.severity === 'critical') {
        let violationType: 'missed_routine' | 'budget_overrun' | 'goal_slippage';

        if (auditReport.type === 'routine') {
          violationType = 'missed_routine';
        } else if (auditReport.type === 'budget') {
          violationType = 'budget_overrun';
        } else {
          violationType = 'goal_slippage';
        }

        violations.push({
          id: `violation-${Date.now()}-${Math.random()}`,
          type: violationType,
          description: `${finding.description}: ${finding.metric} is ${finding.actual} vs target ${finding.target} (${finding.variance > 0 ? '+' : ''}${finding.variance}%)`,
          severity: finding.severity,
          detectedAt: new Date().toISOString(),
          auditReportId: auditReport.id,
        });
      }
    });

    return violations;
  }

  generateDiagnostics(state: SystemState): {
    routineHealth: number;
    budgetHealth: number;
    goalHealth: number;
    overallScore: number;
  } {
    const routineAudit = this.auditRoutineCompliance(state, 'week');
    const budgetAudit = this.auditBudgetCompliance(state, 'week');
    const goalAudit = this.auditGoalProgress(state);

    const routineHealth = this.calculateHealthScore(routineAudit);
    const budgetHealth = this.calculateHealthScore(budgetAudit);
    const goalHealth = this.calculateHealthScore(goalAudit);

    const overallScore = (routineHealth + budgetHealth + goalHealth) / 3;

    return {
      routineHealth,
      budgetHealth,
      goalHealth,
      overallScore,
    };
  }

  // Helper methods
  private getScheduledCount(frequency: 'daily' | 'weekly', period: 'week' | 'month'): number {
    if (frequency === 'daily') {
      return period === 'week' ? 7 : 30;
    } else {
      return period === 'week' ? 1 : 4;
    }
  }

  private isInPeriod(dateString: string, period: 'week' | 'month'): boolean {
    const date = parseISO(dateString);
    const now = new Date();

    if (period === 'week') {
      const weekStart = startOfWeek(now);
      const weekEnd = endOfWeek(now);
      return isWithinInterval(date, { start: weekStart, end: weekEnd });
    } else {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return isWithinInterval(date, { start: monthStart, end: monthEnd });
    }
  }

  private normalizeToPeriod(
    amount: number,
    frequency: 'monthly' | 'weekly' | 'daily',
    period: 'week' | 'month'
  ): number {
    if (period === 'week') {
      if (frequency === 'monthly') return amount / 4;
      if (frequency === 'weekly') return amount;
      if (frequency === 'daily') return amount * 7;
    } else {
      if (frequency === 'monthly') return amount;
      if (frequency === 'weekly') return amount * 4;
      if (frequency === 'daily') return amount * 30;
    }
    return amount;
  }

  private calculateSeverity(variance: number): 'low' | 'medium' | 'high' | 'critical' {
    if (variance >= -10) return 'low';
    if (variance >= -25) return 'medium';
    if (variance >= -50) return 'high';
    return 'critical';
  }

  private getMaxSeverity(findings: AuditFinding[]): 'low' | 'medium' | 'high' | 'critical' {
    const severityOrder = { low: 0, medium: 1, high: 2, critical: 3 };
    let maxSeverity: 'low' | 'medium' | 'high' | 'critical' = 'low';

    findings.forEach((finding) => {
      if (severityOrder[finding.severity] > severityOrder[maxSeverity]) {
        maxSeverity = finding.severity;
      }
    });

    return maxSeverity;
  }

  private getDaysActive(createdAt: string): number {
    const created = parseISO(createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - created.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  private getDaysUntilDeadline(deadline: string): number {
    const deadlineDate = parseISO(deadline);
    const now = new Date();
    const diffTime = deadlineDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  private calculateHealthScore(audit: AuditReport): number {
    if (audit.findings.length === 0) return 100;

    const totalVariance = audit.findings.reduce((sum, f) => sum + Math.abs(f.variance), 0);
    const avgVariance = totalVariance / audit.findings.length;

    return Math.max(0, 100 - avgVariance);
  }
}
