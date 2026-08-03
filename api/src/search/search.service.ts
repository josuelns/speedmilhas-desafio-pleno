import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';

import { AIRPORTS } from './constants';
import type { SearchRequestDto } from './dto/search.dto';
import { fetchSupplierA } from '../suppliers/supplier-a';
import { fetchSupplierB } from '../suppliers/supplier-b';
import { fetchSupplierC } from '../suppliers/supplier-c';
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
    const params = this.validateSearchParams(body);
    const baseUrl = this.getSuppliersBaseUrl();
    const timeoutMs = getSupplierTimeoutMs();

    const [resultA, resultB, resultC] = await Promise.allSettled([
      this.fetchWithTimeout('A', () => fetchSupplierA(baseUrl, params), timeoutMs),
      this.fetchWithTimeout('B', () => fetchSupplierB(baseUrl, params), timeoutMs),
      this.fetchWithTimeout('C', () => fetchSupplierC(baseUrl, params), timeoutMs),
    ]);

    const suppliers: Record<SupplierId, SupplierStatus> = {
      A: this.unwrapSupplierStatus(resultA),
      B: this.unwrapSupplierStatus(resultB),
      C: this.unwrapSupplierStatus(resultC),
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

  private validateSearchParams(body: SearchRequestDto): SearchParams {
    const origin = body.origin?.trim().toUpperCase();
    const destination = body.destination?.trim().toUpperCase();
    const date = body.date?.trim();

    if (!origin || !destination || !date) {
      throw new BadRequestException(
        'origin, destination e date são obrigatórios',
      );
    }

    if (!AIRPORTS.includes(origin as (typeof AIRPORTS)[number])) {
      throw new BadRequestException(
        `aeroporto de origem inválido. Disponíveis: ${AIRPORTS.join(', ')}`,
      );
    }

    if (!AIRPORTS.includes(destination as (typeof AIRPORTS)[number])) {
      throw new BadRequestException(
        `aeroporto de destino inválido. Disponíveis: ${AIRPORTS.join(', ')}`,
      );
    }

    if (origin === destination) {
      throw new BadRequestException(
        'origin e destination devem ser diferentes',
      );
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new BadRequestException('date deve estar no formato YYYY-MM-DD');
    }

    return { origin, destination, date };
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
