'use client';

import { useRef, useState } from 'react';

import { createOrder } from '@/lib/api';
import type { Quote, ReserveState } from '@/lib/types';

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

function shortId(value: string): string {
  return value.slice(0, 8);
}

export function QuoteList({ results }: QuoteListProps) {
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
          message: 'Informe o nome do passageiro.',
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
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-slate-600">
        Nenhuma cotação encontrada para esta rota.
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <label className="grid gap-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <span className="text-sm font-medium text-slate-700">
          Nome do passageiro
        </span>
        <input
          type="text"
          value={passenger}
          onChange={(event) => setPassenger(event.target.value)}
          placeholder="Ex.: Maria Silva"
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
      </label>

      <div className="grid gap-3">
        {results.map((quote) => {
          const reserveState = reserveStates[quote.quoteId] ?? { status: 'idle' };
          const isReserving = reserveState.status === 'reserving';

          return (
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

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => void handleReserve(quote)}
                  disabled={isReserving}
                  className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {isReserving ? 'Reservando…' : 'Reservar'}
                </button>

                {reserveState.status === 'success' && (
                  <p className="text-sm font-medium text-emerald-700">
                    Reserva confirmada · #{shortId(reserveState.orderId)}
                  </p>
                )}

                {reserveState.status === 'error' && (
                  <p className="text-sm text-rose-700" role="alert">
                    {reserveState.message}
                  </p>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
