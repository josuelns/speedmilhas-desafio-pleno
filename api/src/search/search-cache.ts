import type { NormalizedQuote, SupplierId, SupplierStatus } from '../suppliers/types';

export const DEFAULT_SEARCH_CACHE_TTL_MS = 30_000;

export interface CachedSearchPayload {
  quotes: NormalizedQuote[];
  suppliers: Record<SupplierId, SupplierStatus>;
  partial: boolean;
}

interface CacheEntry {
  expiresAt: number;
  payload: CachedSearchPayload;
}

const cache = new Map<string, CacheEntry>();

export function buildSearchCacheKey(params: {
  origin: string;
  destination: string;
  date: string;
}): string {
  return `${params.origin}:${params.destination}:${params.date}`;
}

export function getSearchCacheTtlMs(): number {
  const raw = process.env.SEARCH_CACHE_TTL_MS;
  if (!raw) {
    return DEFAULT_SEARCH_CACHE_TTL_MS;
  }

  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0
    ? parsed
    : DEFAULT_SEARCH_CACHE_TTL_MS;
}

export function getCachedSearch(
  key: string,
): CachedSearchPayload | undefined {
  const entry = cache.get(key);
  if (!entry) {
    return undefined;
  }

  if (Date.now() >= entry.expiresAt) {
    cache.delete(key);
    return undefined;
  }

  return entry.payload;
}

export function setCachedSearch(
  key: string,
  payload: CachedSearchPayload,
  ttlMs: number = getSearchCacheTtlMs(),
): void {
  cache.set(key, {
    expiresAt: Date.now() + ttlMs,
    payload,
  });
}

export function clearSearchCache(): void {
  cache.clear();
}
