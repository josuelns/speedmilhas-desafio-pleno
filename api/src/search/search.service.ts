import {
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';

import { SearchRequestDto } from './dto/search.dto';
import { fetchSupplierA } from '../suppliers/supplier-a';
import { fetchSupplierB } from '../suppliers/supplier-b';
import { fetchSupplierC } from '../suppliers/supplier-c';
import { SUPPLIER_IDS } from '../suppliers/supplier-ids';
import { getSupplierTimeoutMs, withTimeout } from '../suppliers/timeout';
import type {
  NormalizedQuote,
  SearchParams,
  SearchResponse,
  SupplierFailureReason,
  SupplierFetchResult,
  SupplierId,
  SupplierStatus,
} from '../suppliers/types';

interface SupplierCall {
  id: SupplierId;
  fetch: () => Promise<NormalizedQuote[]>;
}

@Injectable()
export class SearchService {
  private readonly suppliersBaseUrl = process.env.SUPPLIERS_BASE_URL;

  async search(body: SearchRequestDto): Promise<SearchResponse> {
    const params: SearchParams = {
      origin: body.origin,
      destination: body.destination,
      date: body.date,
    };
    const baseUrl = this.getSuppliersBaseUrl();
    const timeoutMs = getSupplierTimeoutMs();

    const supplierCalls: SupplierCall[] = [
      { id: SUPPLIER_IDS.A, fetch: () => fetchSupplierA(baseUrl, params) },
      { id: SUPPLIER_IDS.B, fetch: () => fetchSupplierB(baseUrl, params) },
      { id: SUPPLIER_IDS.C, fetch: () => fetchSupplierC(baseUrl, params) },
    ];

    const settled = await Promise.allSettled(
      supplierCalls.map(({ id, fetch }) =>
        this.fetchWithTimeout(id, fetch, timeoutMs),
      ),
    );

    const { suppliers, quotes } = this.aggregateSupplierResults(
      settled,
      supplierCalls,
    );

    return {
      results: quotes.sort((left, right) => left.miles - right.miles),
      meta: {
        partial: Object.values(suppliers).some((status) => !status.ok),
        suppliers,
      },
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

  private async fetchWithTimeout(
    supplier: SupplierId,
    fetcher: () => Promise<NormalizedQuote[]>,
    timeoutMs: number,
  ): Promise<SupplierFetchResult> {
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
