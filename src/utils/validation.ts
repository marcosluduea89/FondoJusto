// Valida la clave mensual usada por toda la app: cuatro digitos de anio y dos de mes.
export function isValidMonthKey(month: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(month);
}

// Valida fechas simples de formulario. No interpreta zona horaria.
export function isValidISODate(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;

  const [year, month, day] = date.split("-").map(Number);
  const parsedDate = new Date(year, month - 1, day);

  return (
    parsedDate.getFullYear() === year &&
    parsedDate.getMonth() === month - 1 &&
    parsedDate.getDate() === day
  );
}

// Evita cierres imposibles donde los porcentajes consumen mas que todo el ingreso.
export function validateMonthlyPercentages(
  investmentPercentage: number,
  goalsPercentage: number,
  personalPercentageMarcos: number,
  personalPercentageWife: number
): string | null {
  const percentages = [investmentPercentage, goalsPercentage, personalPercentageMarcos, personalPercentageWife];
  const total = percentages.reduce((sum, percentage) => sum + percentage, 0);

  if (percentages.some((percentage) => !Number.isFinite(percentage))) {
    return "Ingresa solo numeros validos en las asignaciones.";
  }

  if (percentages.some((percentage) => percentage < 0)) {
    return "Los porcentajes no pueden ser negativos.";
  }

  if (total > 100) {
    return `La suma de inversion, objetivos y dinero personal es ${total}% y no puede superar el 100%.`;
  }

  return null;
}

export function validateGoalAllocationPercentages(
  goalsPercentage: number,
  goalAllocations: number[]
): string | null {
  if (goalAllocations.some((percentage) => !Number.isFinite(percentage))) {
    return "Ingresa solo numeros validos en la distribucion de objetivos.";
  }

  if (goalAllocations.some((percentage) => percentage < 0)) {
    return "Los porcentajes de objetivos no pueden ser negativos.";
  }

  if (goalsPercentage <= 0) {
    return null;
  }

  if (!goalAllocations.length) {
    return "Carga al menos un objetivo activo si vas a destinar porcentaje a objetivos.";
  }

  const total = goalAllocations.reduce((sum, percentage) => sum + percentage, 0);

  if (Math.abs(total - 100) > 0.01) {
    return `La distribucion entre objetivos activos suma ${total}% y debe ser exactamente 100%.`;
  }

  return null;
}
