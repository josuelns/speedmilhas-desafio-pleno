import { randomUUID } from 'crypto';

import { resolveAirlineFromName } from './airlines';
import { parseFiniteNumber } from './parse';
import { SUPPLIER_IDS } from './supplier-ids';
import type { NormalizedQuote, SearchParams } from './types';

interface SupplierARawItem {
  miles?: unknown;
  taxes_brl?: unknown;
  carrier?: unknown;
}

interface SupplierAResponse {
  results?: SupplierARawItem[];
}

export function normalizeA(items: SupplierARawItem[]): NormalizedQuote[] {
  const quotes: NormalizedQuote[] = [];

  for (const item of items) {
    const miles = parseFiniteNumber(item.miles);
    const taxesBrl = parseFiniteNumber(item.taxes_brl);
    const carrier =
      typeof item.carrier === 'string' ? item.carrier.trim() : '';

    if (miles === null || taxesBrl === null || !carrier) {
      console.warn(
        JSON.stringify({
          supplier: SUPPLIER_IDS.A,
          reason: 'invalid_item',
          raw: item,
        }),
      );
      continue;
    }

    const airline = resolveAirlineFromName(carrier);
    if (!airline) {
      console.warn(
        JSON.stringify({
          supplier: SUPPLIER_IDS.A,
          reason: 'unknown_carrier',
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
      supplier: SUPPLIER_IDS.A,
    });
  }

  return quotes;
}

export async function fetchSupplierA(
  baseUrl: string,
  params: SearchParams,
): Promise<NormalizedQuote[]> {
  const url = new URL('/supplier-a/quotes', baseUrl);
  url.searchParams.set('origin', params.origin);
  url.searchParams.set('destination', params.destination);
  url.searchParams.set('date', params.date);

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`supplier_a_http_${response.status}`);
  }

  const payload = (await response.json()) as SupplierAResponse;
  return normalizeA(payload.results ?? []);
}
