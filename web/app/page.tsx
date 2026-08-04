'use client';

import { useRef, useState } from 'react';

import { PartialBanner } from '@/app/components/PartialBanner';
import { QuoteList } from '@/app/components/QuoteList';
import { QuoteSkeleton } from '@/app/components/QuoteSkeleton';
import { SearchForm } from '@/app/components/SearchForm';
import { searchQuotes } from '@/lib/api';
import { mapSearchResponseToState } from '@/lib/map-search-response';
import type { SearchFormValues, SearchState } from '@/lib/types';

const defaultFormValues: SearchFormValues = {
  origin: 'GRU',
  destination: 'GIG',
  date: '2026-08-15',
};

const PAGE_SIZE = 5;

export default function Home() {
  const [formValues, setFormValues] = useState<SearchFormValues>(defaultFormValues);
  const [searchState, setSearchState] = useState<SearchState>({ status: 'idle' });
  const isSearchingRef = useRef(false);
  const isLoadingMoreRef = useRef(false);

  const isSearching = searchState.status === 'loading';

  async function handleSearch() {
    if (isSearchingRef.current) {
      return;
    }

    isSearchingRef.current = true;
    setSearchState({ status: 'loading' });

    try {
      const response = await searchQuotes(formValues, {
        page: 1,
        pageSize: PAGE_SIZE,
      });
      const nextState = mapSearchResponseToState(response, { query: formValues });

      if (nextState.status === 'error') {
        setSearchState(nextState);
        return;
      }

      setSearchState(nextState);
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

  async function handleLoadMore() {
    if (
      searchState.status !== 'success' ||
      !searchState.hasMore ||
      searchState.isLoadingMore ||
      isLoadingMoreRef.current
    ) {
      return;
    }

    isLoadingMoreRef.current = true;
    setSearchState({ ...searchState, isLoadingMore: true });

    try {
      const response = await searchQuotes(searchState.query, {
        page: searchState.page + 1,
        pageSize: PAGE_SIZE,
      });
      const nextState = mapSearchResponseToState(response, {
        appendTo: searchState,
        query: searchState.query,
      });

      if (nextState.status === 'error') {
        setSearchState({
          ...searchState,
          isLoadingMore: false,
        });
        return;
      }

      setSearchState({ ...nextState, isLoadingMore: false });
    } catch {
      setSearchState({
        ...searchState,
        isLoadingMore: false,
      });
    } finally {
      isLoadingMoreRef.current = false;
    }
  }

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:py-10">
        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">
            Speed Milhas
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Buscar passagens com milhas
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-600">
            Compare cotações de vários fornecedores em uma única busca. As
            milhas aparecem em destaque para facilitar a comparação.
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
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white/80 px-6 py-10 text-center shadow-sm">
              <p className="text-base font-medium text-slate-800">
                Pronto para comparar milhas
              </p>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-500">
                Escolha origem, destino e data. Mostramos as melhores opções por
                milhas, com aviso claro se algum fornecedor não responder.
              </p>
            </div>
          )}

          {searchState.status === 'loading' && <QuoteSkeleton />}

          {searchState.status === 'error' && (
            <div
              role="alert"
              className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-900 shadow-sm"
            >
              <p className="font-semibold">Não foi possível concluir a busca</p>
              <p className="mt-1 leading-relaxed">{searchState.message}</p>
            </div>
          )}

          {searchState.status === 'success' && searchState.partial && (
            <PartialBanner failedSuppliers={searchState.failedSuppliers ?? []} />
          )}

          {searchState.status === 'success' && (
            <>
              {searchState.cached && (
                <p className="inline-flex w-fit items-center rounded-full bg-brand-soft px-3 py-1 text-xs font-medium text-brand">
                  Resultado recente desta rota (cache)
                </p>
              )}
              <QuoteList
                results={searchState.results}
                origin={searchState.query.origin}
                destination={searchState.query.destination}
                date={searchState.query.date}
                total={searchState.total}
                hasMore={searchState.hasMore}
              />
              {searchState.hasMore && (
                <button
                  type="button"
                  onClick={() => void handleLoadMore()}
                  disabled={searchState.isLoadingMore}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {searchState.isLoadingMore
                    ? 'Carregando mais opções…'
                    : 'Carregar mais opções'}
                </button>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}
