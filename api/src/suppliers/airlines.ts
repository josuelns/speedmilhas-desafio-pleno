const IATA_TO_AIRLINE: Record<string, string> = {
  LA: 'LATAM',
  G3: 'GOL',
  AD: 'AZUL',
};

export function resolveAirlineFromIata(code: string): string | null {
  return IATA_TO_AIRLINE[code.toUpperCase()] ?? null;
}

export function resolveAirlineFromName(name: string): string | null {
  const normalized = name.trim().toUpperCase();
  const match = Object.values(IATA_TO_AIRLINE).find(
    (airline) => airline === normalized,
  );
  return match ?? null;
}
