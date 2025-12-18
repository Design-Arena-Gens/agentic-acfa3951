import {
  SystemState,
  Violation,
  EnforcementAction,
  Goal,
  RoutineTask,
  BudgetItem,
} from '../types';

export class EnforcerAgent {
  // ENFORCER CAN MODIFY STATE AND APPLY CONSEQUENCES - HIGHEST AUTHORITY

  applyEnforcement(state: SystemState, violation: Violation): {
    action: EnforcementAction;
    updatedState: SystemState;
  } {
    const action = this.determineAction(violation);
    const updatedState = this.executeAction(state, action, violation);

    return { action, updatedState };
  }

  approveProposal(state: SystemState, proposalIndex: number): SystemState {
    const proposal = state.plannerProposals[proposalIndex];
    if (!proposal || proposal.status !== 'submitted') {
      return state;
    }

    const updatedState = { ...state };

    // Approve and activate goals
    proposal.goals.forEach((goal) => {
      updatedState.goals.push({ ...goal, status: 'active' });
    });

    // Approve and activate routines
    proposal.routines.forEach((routine) => {
      updatedState.routines.push({ ...routine, status: 'active' });
    });

    // Approve and activate budget
    proposal.budget.forEach((budgetItem) => {
      updatedState.budget.push({ ...budgetItem, status: 'active' });
    });

    // Update proposal status
    updatedState.plannerProposals[proposalIndex] = {
      ...proposal,
      status: 'approved',
    };

    return updatedState;
  }

  rejectProposal(state: SystemState, proposalIndex: number, reason: string): SystemState {
    const proposal = state.plannerProposals[proposalIndex];
    if (!proposal) return state;

    const updatedState = { ...state };
    updatedState.plannerProposals[proposalIndex] = {
      ...proposal,
      status: 'rejected',
    };

    return updatedState;
  }

  revokeGoal(state: SystemState, goalId: string, reason: string): SystemState {
    const updatedState = { ...state };
    const goalIndex = updatedState.goals.findIndex((g) => g.id === goalId);

    if (goalIndex !== -1) {
      updatedState.goals[goalIndex] = {
        ...updatedState.goals[goalIndex],
        status: 'failed',
      };

      // Deactivate linked routines
      updatedState.routines = updatedState.routines.map((r) =>
        r.linkedGoalId === goalId ? { ...r, status: 'proposed' as const } : r
      );

      // Create enforcement record
      updatedState.enforcementActions.push({
        id: `enforcement-revoke-${Date.now()}`,
        violationId: `manual-revoke-${goalId}`,
        action: 'goal_revision',
        description: `Goal revoked: ${reason}`,
        appliedAt: new Date().toISOString(),
        active: true,
      });
    }

    return updatedState;
  }

  enforceRestriction(
    state: SystemState,
    violationId: string,
    restrictionType: 'budget' | 'routine',
    description: string
  ): SystemState {
    const updatedState = { ...state };

    const action: EnforcementAction = {
      id: `enforcement-${Date.now()}`,
      violationId,
      action: 'restriction',
      description,
      appliedAt: new Date().toISOString(),
      active: true,
      expiresAt: this.calculateExpiry(7), // 7 days restriction
    };

    updatedState.enforcementActions.push(action);

    return updatedState;
  }

  private determineAction(violation: Violation): EnforcementAction {
    let actionType: 'warning' | 'restriction' | 'escalation' | 'goal_revision';
    let description: string;

    switch (violation.severity) {
      case 'critical':
        actionType = 'goal_revision';
        description = `CRITICAL FAILURE: ${violation.description}. Goal parameters must be revised immediately.`;
        break;
      case 'high':
        actionType = 'restriction';
        description = `HIGH SEVERITY: ${violation.description}. Restrictions applied for 7 days.`;
        break;
      case 'medium':
        actionType = 'escalation';
        description = `MEDIUM SEVERITY: ${violation.description}. Escalated for review.`;
        break;
      default:
        actionType = 'warning';
        description = `WARNING: ${violation.description}. Correction required.`;
    }

    return {
      id: `enforcement-${Date.now()}`,
      violationId: violation.id,
      action: actionType,
      description,
      appliedAt: new Date().toISOString(),
      active: true,
      expiresAt: this.calculateExpiry(actionType === 'warning' ? 3 : 7),
    };
  }

  private executeAction(
    state: SystemState,
    action: EnforcementAction,
    violation: Violation
  ): SystemState {
    const updatedState = { ...state };

    // Add enforcement action
    updatedState.enforcementActions.push(action);

    // Apply consequences based on action type
    switch (action.action) {
      case 'restriction':
        if (violation.type === 'budget_overrun') {
          // Reduce budget by 20% for violating category
          updatedState.budget = updatedState.budget.map((b) => {
            if (violation.description.includes(b.category)) {
              return { ...b, amount: b.amount * 0.8 };
            }
            return b;
          });
        }
        break;

      case 'goal_revision':
        // Mark goal as needing revision
        if (violation.type === 'goal_slippage') {
          updatedState.goals = updatedState.goals.map((g) => {
            if (violation.description.includes(g.description.substring(0, 20))) {
              return { ...g, status: 'failed' as const };
            }
            return g;
          });
        }
        break;
    }

    return updatedState;
  }

  private calculateExpiry(days: number): string {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + days);
    return expiry.toISOString();
  }

  cleanupExpiredActions(state: SystemState): SystemState {
    const now = new Date();
    const updatedState = { ...state };

    updatedState.enforcementActions = updatedState.enforcementActions.map((action) => {
      if (action.expiresAt && new Date(action.expiresAt) < now) {
        return { ...action, active: false };
      }
      return action;
    });

    return updatedState;
  }
}
