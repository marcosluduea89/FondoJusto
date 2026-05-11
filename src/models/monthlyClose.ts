// Resultado congelado del cierre mensual. Sirve como historial auditable.
export interface MonthlyClose {
  id: string;
  month: string;
  totalIncome: number;
  totalCommonExpenses: number;
  investmentPercentage: number;
  investmentAmount: number;
  investmentUsed: number;
  availableInvestmentAmount: number;
  personalPercentageMarcos: number;
  personalAmountMarcos: number;
  personalPercentageWife: number;
  personalAmountWife: number;
  personalCarryoverMarcos: number;
  personalCarryoverWife: number;
  reimbursementsAppliedMarcos: number;
  reimbursementsAppliedWife: number;
  finalPersonalAmountMarcos: number;
  finalPersonalAmountWife: number;
  personalExpensesMarcos: number;
  personalExpensesWife: number;
  availablePersonalAmountMarcos: number;
  availablePersonalAmountWife: number;
  remainingCommonFund: number;
}
