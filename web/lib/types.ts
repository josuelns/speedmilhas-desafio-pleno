import type { AirportCode } from './airports';

export { AIRPORTS, formatAirportOption, type AirportCode } from './airports';

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

export interface SearchPagination {
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
}

export interface SearchResponse {
  results: Quote[];
  meta: {
    partial: boolean;
    cached: boolean;
    suppliers: Record<SupplierId, SupplierStatus>;
    pagination: SearchPagination;
  };
}

export type SearchSuccessState = {
  status: 'success';
  results: Quote[];
  partial: boolean;
  failedSuppliers?: string[];
  page: number;
  hasMore: boolean;
  total: number;
  cached: boolean;
  isLoadingMore?: boolean;
  query: SearchFormValues;
};

export type SearchState =
  | { status: 'idle' }
  | { status: 'loading' }
  | SearchSuccessState
  | { status: 'error'; message: string };

export interface SearchFormValues {
  origin: AirportCode;
  destination: AirportCode;
  date: string;
}

export interface CreateOrderPayload {
  quoteId: string;
  passageiro: string;
  idempotencyKey: string;
}

export interface OrderResponse {
  id: string;
  idempotencyKey: string;
  status: string;
  payload: {
    quoteId: string;
    passageiro: string;
  };
  createdAt: string;
}

export type ReserveState =
  | { status: 'idle' }
  | { status: 'reserving' }
  | { status: 'success'; orderId: string }
  | { status: 'error'; message: string };
