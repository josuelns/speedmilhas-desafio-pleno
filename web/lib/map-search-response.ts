import type { SearchFormValues, SearchResponse, SearchSuccessState } from './types';
import { getFailedSupplierLabels } from './api';

interface MapSearchOptions {
  appendTo?: SearchSuccessState;
  query: SearchFormValues;
}

export function mapSearchResponseToState(
  response: SearchResponse,
  options: MapSearchOptions,
): SearchSuccessState | { status: 'error'; message: string } {
  const failedSuppliers = getFailedSupplierLabels(response.meta.suppliers);
  const previousResults = options.appendTo?.results ?? [];
  const results =
    options.appendTo !== undefined
      ? [...previousResults, ...response.results]
      : response.results;
  const query = options.appendTo?.query ?? options.query;

  const successBase = {
    results,
    page: response.meta.pagination.page,
    hasMore: response.meta.pagination.hasMore,
    total: response.meta.pagination.total,
    cached: response.meta.cached,
    query,
  };
  if (response.meta.partial) {
    if (results.length === 0) {
      return {
        status: 'error',
        message:
          'Nenhum fornecedor respondeu. Tente novamente em alguns instantes.',
      };
    }

    return {
      status: 'success',
      ...successBase,
      partial: true,
      failedSuppliers,
    };
  }

  if (results.length === 0) {
    return {
      status: 'error',
      message: 'Nenhuma cotação encontrada para esta rota.',
    };
  }

  return {
    status: 'success',
    ...successBase,
    partial: false,
  };
}
