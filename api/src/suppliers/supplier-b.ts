import { randomUUID } from 'crypto';

import { resolveAirlineFromName } from './airlines';
import { parseFiniteNumber } from './parse';
import { SUPPLIER_IDS } from './supplier-ids';
import type { NormalizedQuote, SearchParams } from './types';

interface SupplierBRawItem {
  pontos?: unknown;
  taxa?: { valor?: unknown; moeda?: unknown };
  cia?: unknown;
}

interface SupplierBResponse {
  dados?: SupplierBRawItem[];
}

export function normalizeB(items: SupplierBRawItem[]): NormalizedQuote[] {
  const quotes: NormalizedQuote[] = [];

  for (const item of items) {
    const miles = parseFiniteNumber(item.pontos);
    const taxesBrl = parseFiniteNumber(item.taxa?.valor);
    const moeda =
      typeof item.taxa?.moeda === 'string'
        ? item.taxa.moeda.trim().toUpperCase()
        : '';
    const cia = typeof item.cia === 'string' ? item.cia.trim() : '';

    if (miles === null || taxesBrl === null || !cia) {
      console.warn(
        JSON.stringify({
          supplier: SUPPLIER_IDS.B,
          reason: 'invalid_item',
          raw: item,
        }),
      );
      continue;
    }

    if (moeda && moeda !== 'BRL') {
      console.warn(
        JSON.stringify({
          supplier: SUPPLIER_IDS.B,
          reason: 'unsupported_currency',
          raw: item,
        }),
      );
      continue;
    }

    const airline = resolveAirlineFromName(cia);
    if (!airline) {
      console.warn(
        JSON.stringify({
          supplier: SUPPLIER_IDS.B,
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
      supplier: SUPPLIER_IDS.B,
    });
  }

  return quotes;
}

export async function fetchSupplierB(
  baseUrl: string,
  params: SearchParams,
): Promise<NormalizedQuote[]> {
  const url = new URL('/supplier-b/search', baseUrl);
  url.searchParams.set('from', params.origin);
  url.searchParams.set('to', params.destination);
  url.searchParams.set('day', params.date);

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`supplier_b_http_${response.status}`);
  }

  const payload = (await response.json()) as SupplierBResponse;
  return normalizeB(payload.dados ?? []);
}
