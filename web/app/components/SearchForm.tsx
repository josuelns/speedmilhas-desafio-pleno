import type { SearchFormValues } from '@/lib/types';
import { AIRPORTS } from '@/lib/types';

interface SearchFormProps {
  values: SearchFormValues;
  loading: boolean;
  onChange: (values: SearchFormValues) => void;
  onSubmit: () => void;
}

export function SearchForm({
  values,
  loading,
  onChange,
  onSubmit,
}: SearchFormProps) {
  return (
    <form
      className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      onSubmit={(event) => {
        event.preventDefault();
        if (loading) {
          return;
        }
        onSubmit();
      }}
    >
      <fieldset className="grid gap-4" disabled={loading}>
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium text-slate-700">Origem</span>
          <select
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
            value={values.origin}
            onChange={(event) =>
              onChange({
                ...values,
                origin: event.target.value as SearchFormValues['origin'],
              })
            }
          >
            {AIRPORTS.map((airport) => (
              <option key={airport} value={airport}>
                {airport}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1.5 text-sm">
          <span className="font-medium text-slate-700">Destino</span>
          <select
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
            value={values.destination}
            onChange={(event) =>
              onChange({
                ...values,
                destination: event.target.value as SearchFormValues['destination'],
              })
            }
          >
            {AIRPORTS.map((airport) => (
              <option key={airport} value={airport}>
                {airport}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1.5 text-sm">
          <span className="font-medium text-slate-700">Data</span>
          <input
            type="date"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
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
        className="inline-flex items-center justify-center rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? 'Buscando...' : 'Buscar passagens'}
      </button>
      </fieldset>
    </form>
  );
}
