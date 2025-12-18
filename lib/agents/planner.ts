import { Goal, RoutineTask, BudgetItem, PlannerProposal } from '../types';

export class PlannerAgent {
  // PLANNER CAN ONLY PROPOSE - NEVER APPROVE OR ENFORCE

  generateGoalsProposal(
    userGoals: string[],
    timeAvailable: { daily: number; weekly: number },
    financialPriorities: string[]
  ): Goal[] {
    return userGoals.map((goal, index) => ({
      id: `goal-${Date.now()}-${index}`,
      description: goal,
      measurable: this.deriveMeasurable(goal),
      deadline: this.calculateDeadline(),
      status: 'proposed' as const,
      createdBy: 'planner' as const,
      createdAt: new Date().toISOString(),
    }));
  }

  generateRoutineProposal(
    goals: Goal[],
    timeAvailable: { daily: number; weekly: number }
  ): RoutineTask[] {
    const routines: RoutineTask[] = [];

    // Daily routines
    const dailyTimePerGoal = Math.floor(timeAvailable.daily / Math.max(goals.length, 1));

    goals.forEach((goal, index) => {
      routines.push({
        id: `routine-daily-${Date.now()}-${index}`,
        name: `Daily work on: ${goal.description.substring(0, 30)}`,
        description: `Dedicated time block for ${goal.description}`,
        frequency: 'daily',
        timeBlock: this.allocateTimeBlock(index, 'daily'),
        duration: dailyTimePerGoal,
        linkedGoalId: goal.id,
        status: 'proposed',
        createdBy: 'planner',
      });
    });

    // Weekly review routine
    routines.push({
      id: `routine-weekly-review-${Date.now()}`,
      name: 'Weekly progress review',
      description: 'Review all goals and adjust plans',
      frequency: 'weekly',
      timeBlock: 'Sunday 18:00',
      duration: 60,
      status: 'proposed',
      createdBy: 'planner',
    });

    return routines;
  }

  generateBudgetProposal(
    goals: Goal[],
    financialPriorities: string[],
    monthlyIncome: number
  ): BudgetItem[] {
    const budgetItems: BudgetItem[] = [];

    // Allocate 70% to essentials, 20% to goals, 10% to savings
    const goalBudget = monthlyIncome * 0.2;
    const perGoalBudget = goalBudget / Math.max(goals.length, 1);

    goals.forEach((goal, index) => {
      budgetItems.push({
        id: `budget-${Date.now()}-${index}`,
        category: `Investment: ${goal.description.substring(0, 30)}`,
        amount: perGoalBudget,
        frequency: 'monthly',
        linkedGoalId: goal.id,
        status: 'proposed',
        createdBy: 'planner',
      });
    });

    // Essential categories
    budgetItems.push(
      {
        id: `budget-essentials-${Date.now()}`,
        category: 'Essentials (Housing, Food, Transport)',
        amount: monthlyIncome * 0.7,
        frequency: 'monthly',
        status: 'proposed',
        createdBy: 'planner',
      },
      {
        id: `budget-savings-${Date.now()}`,
        category: 'Emergency Savings',
        amount: monthlyIncome * 0.1,
        frequency: 'monthly',
        status: 'proposed',
        createdBy: 'planner',
      }
    );

    return budgetItems;
  }

  generateAssumptions(
    goals: Goal[],
    timeAvailable: { daily: number; weekly: number },
    financialPriorities: string[]
  ): string[] {
    return [
      `User can consistently allocate ${timeAvailable.daily} minutes daily`,
      `User has stable monthly income for budget allocation`,
      `Goals are independent and can be worked on in parallel`,
      `No major life disruptions expected in the planning period`,
      `User has baseline skills required for goal achievement`,
    ];
  }

  generateRisks(goals: Goal[], routines: RoutineTask[]): string[] {
    return [
      `High number of goals (${goals.length}) may lead to diluted focus`,
      `Routine overload: ${routines.length} tasks may cause fatigue`,
      `External dependencies may block progress`,
      `Motivation decay over time without early wins`,
      `Time estimates may be optimistic and need adjustment`,
    ];
  }

  createProposal(
    userGoals: string[],
    timeAvailable: { daily: number; weekly: number },
    financialPriorities: string[],
    monthlyIncome: number
  ): PlannerProposal {
    const goals = this.generateGoalsProposal(userGoals, timeAvailable, financialPriorities);
    const routines = this.generateRoutineProposal(goals, timeAvailable);
    const budget = this.generateBudgetProposal(goals, financialPriorities, monthlyIncome);
    const assumptions = this.generateAssumptions(goals, timeAvailable, financialPriorities);
    const risks = this.generateRisks(goals, routines);

    return {
      goals,
      routines,
      budget,
      assumptions,
      risks,
      status: 'draft',
      createdAt: new Date().toISOString(),
    };
  }

  // Helper methods
  private deriveMeasurable(goal: string): string {
    // Simple heuristic for measurability
    if (goal.toLowerCase().includes('learn')) {
      return 'Complete course/certification or build 3 projects';
    } else if (goal.toLowerCase().includes('fitness') || goal.toLowerCase().includes('health')) {
      return 'Achieve target weight/metrics or 30 consecutive days of activity';
    } else if (goal.toLowerCase().includes('business') || goal.toLowerCase().includes('revenue')) {
      return 'Generate $X revenue or acquire Y customers';
    } else {
      return 'Achieve defined milestone or complete 90% of planned tasks';
    }
  }

  private calculateDeadline(): string {
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 90); // Default 90-day sprint
    return deadline.toISOString().split('T')[0];
  }

  private allocateTimeBlock(index: number, frequency: 'daily' | 'weekly'): string {
    if (frequency === 'daily') {
      const hours = [6, 9, 14, 17, 20]; // Morning, mid-morning, afternoon, evening, night
      const hour = hours[index % hours.length];
      return `${hour.toString().padStart(2, '0')}:00`;
    } else {
      const days = ['Monday', 'Wednesday', 'Friday', 'Saturday', 'Sunday'];
      return `${days[index % days.length]} 10:00`;
    }
  }
}
