import type { AirportCode } from './airports';

export { AIRPORTS, type AirportCode } from './airports';

export type SupplierId = 'A' | 'B' | 'C';

export interface Quote {
  quoteId: string;
  miles: number;
  taxesBrl: number;
  airline: string;
  supplier: SupplierId;
}

export type SupplierStatus =
  | { ok: true }
  | { ok: false; reason: string };

export interface SearchResponse {
  results: Quote[];
  meta: {
    partial: boolean;
    suppliers: Record<SupplierId, SupplierStatus>;
  };
}

export type SearchState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; results: Quote[]; partial: false }
  | {
      status: 'success';
      results: Quote[];
      partial: true;
      failedSuppliers: string[];
    }
  | { status: 'error'; message: string };

export interface SearchFormValues {
  origin: AirportCode;
  destination: AirportCode;
  date: string;
}
