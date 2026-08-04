interface PartialBannerProps {
  failedSuppliers: string[];
}

export function PartialBanner({ failedSuppliers }: PartialBannerProps) {
  return (
    <div
      role="status"
      className="flex gap-3 rounded-2xl border border-amber-200/80 bg-amber-50 px-4 py-4 text-sm text-amber-950 shadow-sm"
    >
      <span
        aria-hidden
        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-base"
      >
        !
      </span>
      <div>
        <p className="font-semibold">Resultado parcial</p>
        <p className="mt-1 leading-relaxed text-amber-900/90">
          Alguns fornecedores não responderam:{' '}
          <span className="font-medium">{failedSuppliers.join(', ')}</span>.
          As opções abaixo podem estar incompletas, mas já dá para comparar o
          que chegou.
        </p>
      </div>
    </div>
  );
}
