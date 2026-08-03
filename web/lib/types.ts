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

export interface Quote {
  quoteId: string;
  miles: number;
  taxesBrl: number;
  airline: string;
  supplier: 'A' | 'B' | 'C';
}

export type SupplierStatus =
  | { ok: true }
  | { ok: false; reason: string };

export interface SearchResponse {
  results: Quote[];
  meta: {
    partial: boolean;
    suppliers: Record<'A' | 'B' | 'C', SupplierStatus>;
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
