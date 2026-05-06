// Resultado congelado del cierre mensual. Sirve como historial auditable.
export interface MonthlyClose {
  id: string;
  month: string;
  totalIncome: number;
  totalCommonExpenses: number;
  investmentPercentage: number;
  investmentAmount: number;
  personalPercentageMarcos: number;
  personalAmountMarcos: number;
  personalPercentageWife: number;
  personalAmountWife: number;
  reimbursementsAppliedMarcos: number;
  reimbursementsAppliedWife: number;
  finalPersonalAmountMarcos: number;
  finalPersonalAmountWife: number;
  remainingCommonFund: number;
}
