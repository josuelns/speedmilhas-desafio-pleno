'use client';

import { useRef, useState } from 'react';

import { PartialBanner } from '@/app/components/PartialBanner';
import { QuoteList } from '@/app/components/QuoteList';
import { QuoteSkeleton } from '@/app/components/QuoteSkeleton';
import { SearchForm } from '@/app/components/SearchForm';
import { getFailedSupplierLabels, searchQuotes } from '@/lib/api';
import { mapSearchResponseToState } from '@/lib/map-search-response';
import type { SearchFormValues, SearchState } from '@/lib/types';

const defaultFormValues: SearchFormValues = {
  origin: 'GRU',
  destination: 'GIG',
  date: '2026-08-15',
};

export default function Home() {
  const [formValues, setFormValues] = useState<SearchFormValues>(defaultFormValues);
  const [searchState, setSearchState] = useState<SearchState>({ status: 'idle' });
  const isSearchingRef = useRef(false);

  const isSearching = searchState.status === 'loading';

  async function handleSearch() {
    if (isSearchingRef.current) {
      return;
    }

    isSearchingRef.current = true;
    setSearchState({ status: 'loading' });

    try {
      const response = await searchQuotes(formValues);
      setSearchState(mapSearchResponseToState(response));
    } catch (error: unknown) {
      setSearchState({
        status: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'Não foi possível buscar cotações.',
      });
    } finally {
      isSearchingRef.current = false;
    }
  }

  return (
    <main className="min-h-screen bg-surface">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <header className="mb-8">
          <p className="text-sm font-medium uppercase tracking-wide text-brand">
            Speed Milhas
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            Buscar passagens com milhas
          </h1>
          <p className="mt-2 text-slate-600">
            Compare cotações agregadas de múltiplos fornecedores em uma única
            busca.
          </p>
        </header>

        <SearchForm
          values={formValues}
          loading={isSearching}
          onChange={setFormValues}
          onSubmit={handleSearch}
        />

        <section className="mt-8 grid gap-4">
          {searchState.status === 'idle' && (
            <p className="rounded-xl border border-dashed border-slate-300 bg-white/70 p-6 text-center text-slate-500">
              Informe origem, destino e data para ver as melhores opções.
            </p>
          )}

          {searchState.status === 'loading' && <QuoteSkeleton />}

          {searchState.status === 'error' && (
            <div
              role="alert"
              className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900"
            >
              <p className="font-medium">Não foi possível concluir a busca</p>
              <p className="mt-1">{searchState.message}</p>
            </div>
          )}

          {searchState.status === 'success' && searchState.partial && (
            <PartialBanner failedSuppliers={searchState.failedSuppliers} />
          )}

          {searchState.status === 'success' && (
            <QuoteList results={searchState.results} />
          )}
        </section>
      </div>
    </main>
  );
}
