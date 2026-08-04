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
  | 'parse_error'
  | 'circuit_open';

export type SupplierStatus =
  | { ok: true }
  | { ok: false; reason: SupplierFailureReason };

export interface SupplierFetchResult {
  quotes: NormalizedQuote[];
  status: SupplierStatus;
}

export interface SearchPagination {
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
}

export interface SearchResponse {
  results: NormalizedQuote[];
  meta: {
    partial: boolean;
    cached: boolean;
    suppliers: Record<SupplierId, SupplierStatus>;
    pagination: SearchPagination;
  };
}
