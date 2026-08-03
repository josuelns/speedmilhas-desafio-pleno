interface PartialBannerProps {
  failedSuppliers: string[];
}

export function PartialBanner({ failedSuppliers }: PartialBannerProps) {
  return (
    <div
      role="status"
      className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
    >
      <p className="font-medium">Resultado parcial</p>
      <p className="mt-1 text-amber-800">
        Alguns fornecedores não responderam a tempo:{' '}
        {failedSuppliers.join(', ')}. As opções abaixo podem estar incompletas.
      </p>
    </div>
  );
}
