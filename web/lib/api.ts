import type { SearchFormValues, SearchResponse, SupplierId } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

export async function searchQuotes(
  values: SearchFormValues,
): Promise<SearchResponse> {
  const response = await fetch(`${API_URL}/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(values),
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

export function getFailedSupplierLabels(
  suppliers: SearchResponse['meta']['suppliers'],
): string[] {
  return (Object.entries(suppliers) as Array<
    [SupplierId, SearchResponse['meta']['suppliers'][SupplierId]]
  >)
    .filter(([, status]) => !status.ok)
    .map(([supplier]) => `Fornecedor ${supplier}`);
}
