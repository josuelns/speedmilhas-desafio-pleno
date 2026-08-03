import type { SearchFormValues, SearchResponse } from './types';

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
    } catch {
      // Mantém mensagem padrão.
    }

    throw new Error(message);
  }

  return (await response.json()) as SearchResponse;
}

export function getFailedSupplierLabels(
  suppliers: SearchResponse['meta']['suppliers'],
): string[] {
  return (Object.entries(suppliers) as Array<
    ['A' | 'B' | 'C', SearchResponse['meta']['suppliers']['A']]
  >)
    .filter(([, status]) => !status.ok)
    .map(([supplier]) => `Fornecedor ${supplier}`);
}
