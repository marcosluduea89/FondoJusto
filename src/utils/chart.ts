// Formatea valores grandes de graficas para que el eje Y sea legible en pantallas chicas.
function formatCompactAmount(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(value >= 10000000 ? 0 : 1)}M`;
  }

  if (value >= 1000) {
    return `$${Math.round(value / 1000)}k`;
  }

  return `$${Math.round(value)}`;
}

// Genera etiquetas desde cero hasta el maximo visible y evita referencias negativas automaticas.
export function buildYAxisLabels(maxValue: number, sections: number): string[] {
  const safeSections = Math.max(1, sections);
  const safeMaxValue = Math.max(0, maxValue);

  return Array.from({ length: safeSections + 1 }, (_, index) =>
    formatCompactAmount((safeMaxValue / safeSections) * index)
  );
}
