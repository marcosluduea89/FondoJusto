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
  personalPercentageMarcos: number,
  personalPercentageWife: number
): string | null {
  const percentages = [investmentPercentage, personalPercentageMarcos, personalPercentageWife];

  if (percentages.some((percentage) => percentage < 0)) {
    return "Los porcentajes no pueden ser negativos.";
  }

  if (percentages.reduce((total, percentage) => total + percentage, 0) > 100) {
    return "La suma de inversion y dinero personal no puede superar el 100%.";
  }

  return null;
}
