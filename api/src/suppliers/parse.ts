export function parseFiniteNumber(value: unknown): number | null {
  const num = typeof value === 'string' ? Number(value) : Number(value);
  return Number.isFinite(num) ? num : null;
}
