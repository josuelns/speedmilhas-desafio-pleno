import {
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';

import { SearchRequestDto } from './dto/search.dto';
import {
  buildSearchCacheKey,
  getCachedSearch,
  setCachedSearch,
} from './search-cache';
import {
  resetSupplierBCircuitBreaker,
  supplierBCircuitBreaker,
} from '../suppliers/circuit-breaker';
import { fetchSupplierA } from '../suppliers/supplier-a';
import { fetchSupplierB } from '../suppliers/supplier-b';
import { fetchSupplierC } from '../suppliers/supplier-c';
import { SUPPLIER_IDS } from '../suppliers/supplier-ids';
import { getSupplierTimeoutMs, withTimeout } from '../suppliers/timeout';
import type {
  NormalizedQuote,
  SearchParams,
  SearchPagination,
  SearchResponse,
  SupplierFailureReason,
  SupplierFetchResult,
  SupplierId,
  SupplierStatus,
} from '../suppliers/types';

interface SupplierCall {
  id: SupplierId;
  fetch: () => Promise<SupplierFetchResult>;
}

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 5;

@Injectable()
export class SearchService {
  private readonly suppliersBaseUrl = process.env.SUPPLIERS_BASE_URL;

  async search(body: SearchRequestDto): Promise<SearchResponse> {
    const params: SearchParams = {
      origin: body.origin,
      destination: body.destination,
      date: body.date,
    };
    const page = body.page ?? DEFAULT_PAGE;
    const pageSize = body.pageSize ?? DEFAULT_PAGE_SIZE;
    const cacheKey = buildSearchCacheKey(params);
    const cached = getCachedSearch(cacheKey);

    if (cached) {
      return this.buildResponse({
        quotes: cached.quotes,
        suppliers: cached.suppliers,
        partial: cached.partial,
        cached: true,
        page,
        pageSize,
      });
    }

    const aggregated = await this.fetchFromSuppliers(params);

    setCachedSearch(cacheKey, {
      quotes: aggregated.quotes,
      suppliers: aggregated.suppliers,
      partial: aggregated.partial,
    });

    return this.buildResponse({
      quotes: aggregated.quotes,
      suppliers: aggregated.suppliers,
      partial: aggregated.partial,
      cached: false,
      page,
      pageSize,
    });
  }

  private async fetchFromSuppliers(params: SearchParams): Promise<{
    quotes: NormalizedQuote[];
    suppliers: Record<SupplierId, SupplierStatus>;
    partial: boolean;
  }> {
    const baseUrl = this.getSuppliersBaseUrl();

    const supplierCalls: SupplierCall[] = [
      {
        id: SUPPLIER_IDS.A,
        fetch: () =>
          this.fetchWithTimeout(SUPPLIER_IDS.A, () =>
            fetchSupplierA(baseUrl, params),
          ),
      },
      {
        id: SUPPLIER_IDS.B,
        fetch: () => this.fetchSupplierBWithBreaker(baseUrl, params),
      },
      {
        id: SUPPLIER_IDS.C,
        fetch: () =>
          this.fetchWithTimeout(SUPPLIER_IDS.C, () =>
            fetchSupplierC(baseUrl, params),
          ),
      },
    ];

    const settled = await Promise.allSettled(
      supplierCalls.map(({ fetch }) => fetch()),
    );

    const { suppliers, quotes } = this.aggregateSupplierResults(
      settled,
      supplierCalls,
    );

    return {
      quotes: quotes.sort((left, right) => left.miles - right.miles),
      suppliers,
      partial: Object.values(suppliers).some((status) => !status.ok),
    };
  }

  private buildResponse(input: {
    quotes: NormalizedQuote[];
    suppliers: Record<SupplierId, SupplierStatus>;
    partial: boolean;
    cached: boolean;
    page: number;
    pageSize: number;
  }): SearchResponse {
    const pagination = this.paginate(input.quotes, input.page, input.pageSize);

    return {
      results: pagination.results,
      meta: {
        partial: input.partial,
        cached: input.cached,
        suppliers: input.suppliers,
        pagination,
      },
    };
  }

  private paginate(
    quotes: NormalizedQuote[],
    page: number,
    pageSize: number,
  ): SearchPagination & { results: NormalizedQuote[] } {
    const total = quotes.length;
    const start = (page - 1) * pageSize;
    const results = quotes.slice(start, start + pageSize);

    return {
      results,
      page,
      pageSize,
      total,
      hasMore: start + pageSize < total,
    };
  }

  private getSuppliersBaseUrl(): string {
    if (!this.suppliersBaseUrl) {
      throw new InternalServerErrorException(
        'SUPPLIERS_BASE_URL não configurada',
      );
    }

    return this.suppliersBaseUrl;
  }

  private async fetchSupplierBWithBreaker(
    baseUrl: string,
    params: SearchParams,
  ): Promise<SupplierFetchResult> {
    if (!supplierBCircuitBreaker.canExecute()) {
      return {
        quotes: [],
        status: { ok: false, reason: 'circuit_open' },
      };
    }

    const result = await this.fetchWithTimeout(SUPPLIER_IDS.B, () =>
      fetchSupplierB(baseUrl, params),
    );

    if (result.status.ok) {
      supplierBCircuitBreaker.recordSuccess();
    } else {
      supplierBCircuitBreaker.recordFailure();
    }

    return result;
  }

  private async fetchWithTimeout(
    supplier: SupplierId,
    fetcher: () => Promise<NormalizedQuote[]>,
  ): Promise<SupplierFetchResult> {
    const timeoutMs = getSupplierTimeoutMs();

    try {
      const quotes = await withTimeout(fetcher(), timeoutMs);
      return { quotes, status: { ok: true } };
    } catch (error: unknown) {
      const reason = this.mapFailureReason(error);
      console.warn(
        JSON.stringify({
          supplier,
          reason,
          message: error instanceof Error ? error.message : 'unknown_error',
        }),
      );
      return { quotes: [], status: { ok: false, reason } };
    }
  }

  private aggregateSupplierResults(
    settled: PromiseSettledResult<SupplierFetchResult>[],
    supplierCalls: SupplierCall[],
  ): { suppliers: Record<SupplierId, SupplierStatus>; quotes: NormalizedQuote[] } {
    const suppliers = {} as Record<SupplierId, SupplierStatus>;
    const quotes: NormalizedQuote[] = [];

    settled.forEach((result, index) => {
      const supplierId = supplierCalls[index].id;

      if (result.status === 'fulfilled') {
        suppliers[supplierId] = result.value.status;
        quotes.push(...result.value.quotes);
        return;
      }

      suppliers[supplierId] = { ok: false, reason: 'network_error' };
    });

    return { suppliers, quotes };
  }

  private mapFailureReason(error: unknown): SupplierFailureReason {
    if (error instanceof Error) {
      if (error.message === 'timeout') {
        return 'timeout';
      }

      if (error.message.startsWith('supplier_')) {
        return 'http_error';
      }
    }

    return 'network_error';
  }
}

export { clearSearchCache } from './search-cache';
export { resetSupplierBCircuitBreaker };
