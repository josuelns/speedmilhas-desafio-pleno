import { randomUUID } from 'crypto';

import { resolveAirlineFromIata } from './airlines';
import type { NormalizedQuote, SearchParams } from './types';

interface SupplierCRawItem {
  price_miles?: unknown;
  fee?: unknown;
  airline_code?: unknown;
}

interface SupplierCResponse {
  data?: SupplierCRawItem[];
}

function parseFiniteNumber(value: unknown): number | null {
  const num = typeof value === 'string' ? Number(value) : Number(value);
  return Number.isFinite(num) ? num : null;
}

export function normalizeC(items: SupplierCRawItem[]): NormalizedQuote[] {
  const quotes: NormalizedQuote[] = [];

  for (const item of items) {
    const miles = parseFiniteNumber(item.price_miles);
    const taxesBrl = parseFiniteNumber(item.fee);
    const airlineCode =
      typeof item.airline_code === 'string' ? item.airline_code.trim() : '';

    if (miles === null) {
      console.warn(
        JSON.stringify({
          supplier: 'C',
          reason: 'invalid_price_miles',
          raw: item,
        }),
      );
      continue;
    }

    if (taxesBrl === null) {
      console.warn(
        JSON.stringify({
          supplier: 'C',
          reason: 'invalid_fee',
          raw: item,
        }),
      );
      continue;
    }

    if (!airlineCode) {
      console.warn(
        JSON.stringify({
          supplier: 'C',
          reason: 'invalid_airline_code',
          raw: item,
        }),
      );
      continue;
    }

    const airline = resolveAirlineFromIata(airlineCode);
    if (!airline) {
      console.warn(
        JSON.stringify({
          supplier: 'C',
          reason: 'unknown_airline_code',
          raw: item,
        }),
      );
      continue;
    }

    quotes.push({
      quoteId: randomUUID(),
      miles,
      taxesBrl,
      airline,
      supplier: 'C',
    });
  }

  return quotes;
}

export async function fetchSupplierC(
  baseUrl: string,
  params: SearchParams,
): Promise<NormalizedQuote[]> {
  const url = new URL('/supplier-c/v2/quotes', baseUrl);

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      origin: params.origin,
      destination: params.destination,
      date: params.date,
    }),
  });

  if (!response.ok) {
    throw new Error(`supplier_c_http_${response.status}`);
  }

  const payload = (await response.json()) as SupplierCResponse;
  return normalizeC(payload.data ?? []);
}
