'use client';

import { useRef, useState } from 'react';

import { createOrder } from '@/lib/api';
import {
  formatCurrency,
  formatDisplayDate,
  formatMiles,
  formatRouteDescription,
  formatRouteLabel,
} from '@/lib/format';
import type { AirportCode, Quote, ReserveState } from '@/lib/types';

interface QuoteListProps {
  results: Quote[];
  origin: AirportCode;
  destination: AirportCode;
  date: string;
  total: number;
  hasMore: boolean;
}

const AIRLINE_STYLES: Record<string, string> = {
  LATAM: 'bg-indigo-50 text-indigo-700 ring-indigo-100',
  GOL: 'bg-orange-50 text-orange-700 ring-orange-100',
  AZUL: 'bg-sky-50 text-sky-700 ring-sky-100',
};

function shortId(value: string): string {
  return value.slice(0, 8);
}

function getAirlineStyle(airline: string): string {
  return AIRLINE_STYLES[airline] ?? 'bg-slate-100 text-slate-700 ring-slate-200';
}

export function QuoteList({
  results,
  origin,
  destination,
  date,
  total,
  hasMore,
}: QuoteListProps) {
  const [passenger, setPassenger] = useState('');
  const [reserveStates, setReserveStates] = useState<Record<string, ReserveState>>(
    {},
  );
  const reservingRef = useRef<Set<string>>(new Set());

  async function handleReserve(quote: Quote) {
    const trimmedPassenger = passenger.trim();

    if (!trimmedPassenger) {
      setReserveStates((current) => ({
        ...current,
        [quote.quoteId]: {
          status: 'error',
          message: 'Informe o nome do passageiro para reservar.',
        },
      }));
      return;
    }

    if (reservingRef.current.has(quote.quoteId)) {
      return;
    }

    reservingRef.current.add(quote.quoteId);
    setReserveStates((current) => ({
      ...current,
      [quote.quoteId]: { status: 'reserving' },
    }));

    try {
      const order = await createOrder({
        quoteId: quote.quoteId,
        passageiro: trimmedPassenger,
        idempotencyKey: crypto.randomUUID(),
      });

      setReserveStates((current) => ({
        ...current,
        [quote.quoteId]: { status: 'success', orderId: order.id },
      }));
    } catch (error: unknown) {
      setReserveStates((current) => ({
        ...current,
        [quote.quoteId]: {
          status: 'error',
          message:
            error instanceof Error
              ? error.message
              : 'Não foi possível concluir a reserva.',
        },
      }));
    } finally {
      reservingRef.current.delete(quote.quoteId);
    }
  }

  if (results.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="font-medium text-slate-900">
          Nenhuma cotação encontrada
        </p>
        <p className="mt-2 text-sm text-slate-600">
          Tente outra data ou rota para ver novas opções.
        </p>
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      <header className="border-b border-slate-100 bg-slate-50/80 px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-lg font-semibold text-slate-900">
              {formatRouteLabel(origin, destination)}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              {formatRouteDescription(origin, destination)} ·{' '}
              {formatDisplayDate(date)}
            </p>
          </div>
          <div className="rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand">
            {hasMore
              ? `Mostrando ${results.length} de ${total}+ opções`
              : `${total} ${total === 1 ? 'opção' : 'opções'}`}
          </div>
        </div>

        <label className="mt-4 grid gap-2">
          <span className="text-sm font-medium text-slate-700">
            Passageiro para reserva
          </span>
          <input
            type="text"
            value={passenger}
            onChange={(event) => setPassenger(event.target.value)}
            placeholder="Nome completo, ex.: Maria Silva"
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15"
          />
          <span className="text-xs text-slate-500">
            O mesmo nome será usado em qualquer cotação que você reservar.
          </span>
        </label>
      </header>

      <ol className="divide-y divide-slate-100">
        {results.map((quote, index) => {
          const reserveState = reserveStates[quote.quoteId] ?? { status: 'idle' };
          const isReserving = reserveState.status === 'reserving';
          const isBestOption = index === 0;

          return (
            <li key={quote.quoteId} className="p-4 sm:p-5">
              <article className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                <div className="min-w-0">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    {isBestOption ? (
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
                        Melhor preço em milhas
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                        Opção {index + 1}
                      </span>
                    )}
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${getAirlineStyle(quote.airline)}`}
                    >
                      {quote.airline}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                      Fornecedor {quote.supplier}
                    </span>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-[auto_1fr_auto] sm:items-end">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Milhas
                      </p>
                      <p className="mt-1 text-3xl font-bold tabular-nums tracking-tight text-brand">
                        {formatMiles(quote.miles)}
                      </p>
                    </div>

                    <div className="hidden h-12 w-px bg-slate-200 sm:block" />

                    <div className="sm:text-right">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Taxas em dinheiro
                      </p>
                      <p className="mt-1 text-lg font-semibold tabular-nums text-slate-900">
                        {formatCurrency(quote.taxesBrl)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:min-w-36 sm:items-stretch">
                  <button
                    type="button"
                    onClick={() => void handleReserve(quote)}
                    disabled={isReserving}
                    className="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    {isReserving ? 'Reservando…' : 'Reservar'}
                  </button>

                  {reserveState.status === 'success' && (
                    <p className="rounded-xl bg-emerald-50 px-3 py-2 text-center text-xs font-medium text-emerald-800">
                      Confirmada · #{shortId(reserveState.orderId)}
                    </p>
                  )}

                  {reserveState.status === 'error' && (
                    <p
                      className="rounded-xl bg-rose-50 px-3 py-2 text-center text-xs font-medium text-rose-800"
                      role="alert"
                    >
                      {reserveState.message}
                    </p>
                  )}
                </div>
              </article>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
