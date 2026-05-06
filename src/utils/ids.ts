// Generador simple de ids locales. Luego puede reemplazarse por ids de Sheets/Drive.
export function createId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}
