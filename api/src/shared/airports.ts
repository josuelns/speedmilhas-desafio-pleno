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
