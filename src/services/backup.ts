import { AppData } from "../models";

// Genera un JSON legible para guardar o compartir como copia de seguridad.
export function buildBackupText(data: AppData): string {
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      app: "FondoJusto",
      version: 1,
      data
    },
    null,
    2
  );
}

// Lee backups nuevos con metadata y tambien acepta un AppData plano por compatibilidad.
export function parseBackupText(text: string): AppData {
  const parsedValue = JSON.parse(text);
  const data = parsedValue?.data ?? parsedValue;

  if (!isAppDataLike(data)) {
    throw new Error("El backup no tiene el formato esperado de FondoJusto.");
  }

  return {
    people: data.people ?? [],
    incomes: data.incomes,
    expenses: data.expenses,
    reimbursements: data.reimbursements,
    monthlyConfigs: data.monthlyConfigs,
    monthlyCloses: data.monthlyCloses,
    monthStates: data.monthStates ?? []
  };
}

function isAppDataLike(value: unknown): value is AppData {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Partial<AppData>;

  return (
    Array.isArray(candidate.incomes) &&
    Array.isArray(candidate.expenses) &&
    Array.isArray(candidate.reimbursements) &&
    Array.isArray(candidate.monthlyConfigs) &&
    Array.isArray(candidate.monthlyCloses)
  );
}
