import type { AirportCode, SearchFormValues } from '@/lib/types';
import { AIRPORTS, formatAirportOption } from '@/lib/types';
import { formatDisplayDate } from '@/lib/format';

interface SearchFormProps {
  values: SearchFormValues;
  loading: boolean;
  onChange: (values: SearchFormValues) => void;
  onSubmit: () => void;
}

function getOriginOptions(destination: AirportCode): AirportCode[] {
  return AIRPORTS.filter((airport) => airport !== destination);
}

function getDestinationOptions(origin: AirportCode): AirportCode[] {
  return AIRPORTS.filter((airport) => airport !== origin);
}

export function SearchForm({  values,
  loading,
  onChange,
  onSubmit,
}: SearchFormProps) {
  const originOptions = getOriginOptions(values.destination);
  const destinationOptions = getDestinationOptions(values.origin);

  return (    <form
      className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm"
      onSubmit={(event) => {
        event.preventDefault();
        if (loading) {
          return;
        }
        onSubmit();
      }}
    >
      <div className="border-b border-slate-100 bg-brand-soft/60 px-5 py-4">
        <p className="text-sm font-semibold text-slate-900">Sua busca</p>
        <p className="mt-1 text-sm text-slate-600">
          {formatAirportOption(values.origin)} para{' '}
          {formatAirportOption(values.destination)} em{' '}
          {formatDisplayDate(values.date)}
        </p>
      </div>

      <fieldset className="grid gap-5 p-5" disabled={loading}>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="grid gap-2 text-sm">
            <span className="font-medium text-slate-700">Origem</span>
            <select
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
              value={values.origin}
              onChange={(event) => {
                const origin = event.target.value as SearchFormValues['origin'];
                const destination =
                  origin === values.destination
                    ? getDestinationOptions(origin)[0]
                    : values.destination;

                onChange({ ...values, origin, destination });
              }}
            >
              {originOptions.map((airport) => (                <option key={airport} value={airport}>
                  {formatAirportOption(airport)}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm">
            <span className="font-medium text-slate-700">Destino</span>
            <select
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
              value={values.destination}
              onChange={(event) => {
                const destination =
                  event.target.value as SearchFormValues['destination'];
                const origin =
                  destination === values.origin
                    ? getOriginOptions(destination)[0]
                    : values.origin;

                onChange({ ...values, origin, destination });
              }}
            >
              {destinationOptions.map((airport) => (                <option key={airport} value={airport}>
                  {formatAirportOption(airport)}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm">
            <span className="font-medium text-slate-700">Data</span>
            <input
              type="date"
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
              value={values.date}
              onChange={(event) =>
                onChange({ ...values, date: event.target.value })
              }
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          aria-busy={loading}
          className="inline-flex items-center justify-center rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Buscando opções…' : 'Buscar passagens'}
        </button>
      </fieldset>
    </form>
  );
}
