type CircuitState = 'closed' | 'open' | 'half_open';

export const DEFAULT_CIRCUIT_B_FAILURE_THRESHOLD = 3;
export const DEFAULT_CIRCUIT_B_OPEN_MS = 30_000;

function readPositiveInt(
  raw: string | undefined,
  fallback: number,
): number {
  if (!raw) {
    return fallback;
  }

  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

export function getCircuitBFailureThreshold(): number {
  return readPositiveInt(
    process.env.CIRCUIT_B_FAILURE_THRESHOLD,
    DEFAULT_CIRCUIT_B_FAILURE_THRESHOLD,
  );
}

export function getCircuitBOpenMs(): number {
  return readPositiveInt(
    process.env.CIRCUIT_B_OPEN_MS,
    DEFAULT_CIRCUIT_B_OPEN_MS,
  );
}

export class CircuitBreaker {
  private state: CircuitState = 'closed';
  private failureCount = 0;
  private openedAt: number | null = null;
  private halfOpenProbeInFlight = false;

  constructor(
    private readonly failureThreshold: number,
    private readonly openMs: number,
  ) {}

  canExecute(): boolean {
    if (this.state === 'closed') {
      return true;
    }

    if (this.state === 'open') {
      if (Date.now() - (this.openedAt ?? 0) >= this.openMs) {
        this.state = 'half_open';
        this.halfOpenProbeInFlight = false;
      } else {
        return false;
      }
    }

    if (this.halfOpenProbeInFlight) {
      return false;
    }

    this.halfOpenProbeInFlight = true;
    return true;
  }

  recordSuccess(): void {
    this.state = 'closed';
    this.failureCount = 0;
    this.openedAt = null;
    this.halfOpenProbeInFlight = false;
  }

  recordFailure(): void {
    if (this.state === 'half_open') {
      this.state = 'open';
      this.openedAt = Date.now();
      this.halfOpenProbeInFlight = false;
      return;
    }

    this.failureCount += 1;
    this.halfOpenProbeInFlight = false;

    if (this.failureCount >= this.failureThreshold) {
      this.state = 'open';
      this.openedAt = Date.now();
    }
  }

  reset(): void {
    this.state = 'closed';
    this.failureCount = 0;
    this.openedAt = null;
    this.halfOpenProbeInFlight = false;
  }
}

export const supplierBCircuitBreaker = new CircuitBreaker(
  getCircuitBFailureThreshold(),
  getCircuitBOpenMs(),
);

export function resetSupplierBCircuitBreaker(): void {
  supplierBCircuitBreaker.reset();
}
