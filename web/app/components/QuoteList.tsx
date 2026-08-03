import type { Quote } from '@/lib/types';

interface QuoteListProps {
  results: Quote[];
}

function formatMiles(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value);
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function QuoteList({ results }: QuoteListProps) {
  if (results.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-slate-600">
        Nenhuma cotação encontrada para esta rota.
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {results.map((quote) => (
        <article
          key={quote.quoteId}
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-3xl font-bold tracking-tight text-slate-900">
                {formatMiles(quote.miles)}
                <span className="ml-2 text-base font-semibold text-slate-500">
                  milhas
                </span>
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {quote.airline} · taxas {formatCurrency(quote.taxesBrl)}
              </p>
            </div>

            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
              Fornecedor {quote.supplier}
            </span>
          </div>
        </article>
      ))}
    </div>
  );
}
