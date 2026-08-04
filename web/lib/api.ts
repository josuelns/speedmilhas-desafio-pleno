import type {
  CreateOrderPayload,
  OrderResponse,
  SearchFormValues,
  SearchResponse,
  SupplierId,
} from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

const DEFAULT_PAGE_SIZE = 5;

export interface SearchQuotesOptions {
  page?: number;
  pageSize?: number;
}

export async function searchQuotes(
  values: SearchFormValues,
  options: SearchQuotesOptions = {},
): Promise<SearchResponse> {
  const response = await fetch(`${API_URL}/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...values,
      page: options.page ?? 1,
      pageSize: options.pageSize ?? DEFAULT_PAGE_SIZE,
    }),
  });

  if (!response.ok) {
    let message = 'Não foi possível buscar cotações.';

    try {
      const payload = (await response.json()) as { message?: string | string[] };
      if (Array.isArray(payload.message)) {
        message = payload.message.join(', ');
      } else if (payload.message) {
        message = payload.message;
      }
    } catch (error: unknown) {
      console.warn(
        JSON.stringify({
          context: 'searchQuotes',
          reason: 'failed_to_parse_error_response',
          status: response.status,
          message: error instanceof Error ? error.message : 'unknown_error',
        }),
      );
    }

    throw new Error(message);
  }

  return (await response.json()) as SearchResponse;
}

export async function createOrder(
  payload: CreateOrderPayload,
): Promise<OrderResponse> {
  const response = await fetch(`${API_URL}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let message = 'Não foi possível concluir a reserva.';

    try {
      const body = (await response.json()) as { message?: string | string[] };
      if (Array.isArray(body.message)) {
        message = body.message.join(', ');
      } else if (body.message) {
        message = body.message;
      }
    } catch (error: unknown) {
      console.warn(
        JSON.stringify({
          context: 'createOrder',
          reason: 'failed_to_parse_error_response',
          status: response.status,
          message: error instanceof Error ? error.message : 'unknown_error',
        }),
      );
    }

    throw new Error(message);
  }

  return (await response.json()) as OrderResponse;
}

export function getFailedSupplierLabels(
  suppliers: SearchResponse['meta']['suppliers'],
): string[] {
  return (Object.entries(suppliers) as Array<
    [SupplierId, SearchResponse['meta']['suppliers'][SupplierId]]
  >)
    .filter(([, status]) => !status.ok)
    .map(([supplier]) => `Fornecedor ${supplier}`);
}
