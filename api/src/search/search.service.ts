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

    const [resultA, resultB, resultC] = await Promise.allSettled([
      this.fetchWithTimeout(SUPPLIER_IDS.A, () => fetchSupplierA(baseUrl, params), timeoutMs),
      this.fetchWithTimeout(SUPPLIER_IDS.B, () => fetchSupplierB(baseUrl, params), timeoutMs),
      this.fetchWithTimeout(SUPPLIER_IDS.C, () => fetchSupplierC(baseUrl, params), timeoutMs),
    ]);

    const suppliers: Record<SupplierId, SupplierStatus> = {
      [SUPPLIER_IDS.A]: this.unwrapSupplierStatus(resultA),
      [SUPPLIER_IDS.B]: this.unwrapSupplierStatus(resultB),
      [SUPPLIER_IDS.C]: this.unwrapSupplierStatus(resultC),
    };

    const quotes: NormalizedQuote[] = [
      ...this.unwrapSupplierQuotes(resultA),
      ...this.unwrapSupplierQuotes(resultB),
      ...this.unwrapSupplierQuotes(resultC),
    ].sort((left, right) => left.miles - right.miles);

    const partial = Object.values(suppliers).some((status) => !status.ok);

    return {
      results: quotes,
      meta: {
        partial,
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

  private unwrapSupplierStatus(
    result: PromiseSettledResult<SupplierFetchResult>,
  ): SupplierStatus {
    if (result.status === 'fulfilled') {
      return result.value.status;
    }

    return { ok: false, reason: 'network_error' };
  }

  private unwrapSupplierQuotes(
    result: PromiseSettledResult<SupplierFetchResult>,
  ): NormalizedQuote[] {
    if (result.status === 'fulfilled') {
      return result.value.quotes;
    }

    return [];
  }
}
