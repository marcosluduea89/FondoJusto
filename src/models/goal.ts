export interface Goal {
  id: string;
  name: string;
  currentAmount: number;
  targetAmount: number;
  allocationPercentage: number;
}

export const DEFAULT_GOALS: Goal[] = [
  {
    id: "goal_1",
    name: "Fondo emergencia",
    currentAmount: 0,
    targetAmount: 0,
    allocationPercentage: 34
  },
  {
    id: "goal_2",
    name: "Vacaciones",
    currentAmount: 0,
    targetAmount: 0,
    allocationPercentage: 33
  },
  {
    id: "goal_3",
    name: "Inversion anual",
    currentAmount: 0,
    targetAmount: 0,
    allocationPercentage: 33
  }
];
