import type { AirportCode } from './airports';
import { AIRPORT_LABELS } from './airports';

export function formatRouteLabel(
  origin: AirportCode,
  destination: AirportCode,
): string {
  return `${origin} → ${destination}`;
}

export function formatRouteDescription(
  origin: AirportCode,
  destination: AirportCode,
): string {
  return `${AIRPORT_LABELS[origin]} para ${AIRPORT_LABELS[destination]}`;
}

export function formatDisplayDate(value: string): string {
  const [year, month, day] = value.split('-').map(Number);

  if (!year || !month || !day) {
    return value;
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(year, month - 1, day));
}

export function formatMiles(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value);
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}
