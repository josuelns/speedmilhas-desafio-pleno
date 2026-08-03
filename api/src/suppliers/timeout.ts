export const DEFAULT_SUPPLIER_TIMEOUT_MS = 5500;

export function getSupplierTimeoutMs(): number {
  const raw = process.env.SUPPLIER_TIMEOUT_MS;
  if (!raw) {
    return DEFAULT_SUPPLIER_TIMEOUT_MS;
  }

  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0
    ? parsed
    : DEFAULT_SUPPLIER_TIMEOUT_MS;
}

export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), ms);

    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}
