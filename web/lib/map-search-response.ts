import type { SearchResponse, SearchState } from './types';
import { getFailedSupplierLabels } from './api';

export function mapSearchResponseToState(
  response: SearchResponse,
): SearchState {
  const failedSuppliers = getFailedSupplierLabels(response.meta.suppliers);

  if (response.meta.partial) {
    if (response.results.length === 0) {
      return {
        status: 'error',
        message:
          'Nenhum fornecedor respondeu. Tente novamente em alguns instantes.',
      };
    }

    return {
      status: 'success',
      results: response.results,
      partial: true,
      failedSuppliers,
    };
  }

  if (response.results.length === 0) {
    return {
      status: 'error',
      message: 'Nenhuma cotação encontrada para esta rota.',
    };
  }

  return {
    status: 'success',
    results: response.results,
    partial: false,
  };
}
