export type SupplierId = 'A' | 'B' | 'C';

export interface SearchParams {
  origin: string;
  destination: string;
  date: string;
}

export interface NormalizedQuote {
  quoteId: string;
  miles: number;
  taxesBrl: number;
  airline: string;
  supplier: SupplierId;
}

export type SupplierFailureReason =
  | 'timeout'
  | 'http_error'
  | 'network_error'
  | 'parse_error';

export type SupplierStatus =
  | { ok: true }
  | { ok: false; reason: SupplierFailureReason };

export interface SupplierFetchResult {
  quotes: NormalizedQuote[];
  status: SupplierStatus;
}

export interface SearchResponse {
  results: NormalizedQuote[];
  meta: {
    partial: boolean;
    suppliers: Record<SupplierId, SupplierStatus>;
  };
}
