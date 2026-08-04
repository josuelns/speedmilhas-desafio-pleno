// Mirrors api/src/shared/airports.ts for codes — keep AIRPORTS in sync with the API.
export const AIRPORTS = [
  'GRU',
  'GIG',
  'BSB',
  'SSA',
  'REC',
  'POA',
  'CNF',
  'FOR',
] as const;

export type AirportCode = (typeof AIRPORTS)[number];

export const AIRPORT_LABELS: Record<AirportCode, string> = {
  GRU: 'São Paulo (Guarulhos)',
  GIG: 'Rio de Janeiro (Galeão)',
  BSB: 'Brasília',
  SSA: 'Salvador',
  REC: 'Recife',
  POA: 'Porto Alegre',
  CNF: 'Belo Horizonte (Confins)',
  FOR: 'Fortaleza',
};

export function formatAirportOption(code: AirportCode): string {
  return `${code} — ${AIRPORT_LABELS[code]}`;
}
