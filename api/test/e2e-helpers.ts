import 'dotenv/config';

import { readFileSync } from 'fs';
import path from 'path';

import { PrismaPg } from '@prisma/adapter-pg';
import { randomUUID } from 'crypto';

import { PrismaClient } from '../src/generated/prisma/client';
import type { SearchResponse } from '../src/suppliers/types';

interface E2EConfig {
  apiPort: number;
  apiSecondaryPort: number;
}

function loadE2EConfig(): E2EConfig {
  try {
    const configPath = path.join(__dirname, 'e2e-config.json');
    return JSON.parse(readFileSync(configPath, 'utf8')) as E2EConfig;
  } catch {
    return { apiPort: 3000, apiSecondaryPort: 3010 };
  }
}

const e2eConfig = loadE2EConfig();

export const API_PORT = e2eConfig.apiPort;
export const API_SECONDARY_PORT = e2eConfig.apiSecondaryPort;

export const SEARCH_PAYLOAD = {
  origin: 'GRU',
  destination: 'GIG',
  date: '2026-08-15',
} as const;

type MockSupplierSlug = 'supplier-a' | 'supplier-b' | 'supplier-c';

function getMockBaseUrl(): string {
  return process.env.SUPPLIERS_BASE_URL ?? 'http://localhost:4000';
}

export interface OrderResponse {
  id: string;
  idempotencyKey: string;
  status: string;
}

export function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL não configurada para os testes e2e');
  }

  return new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });
}

export async function resetMockSuppliers(): Promise<void> {
  const response = await fetch(`${getMockBaseUrl()}/admin/reset`, {
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error(`Falha ao resetar mock-suppliers: ${response.status}`);
  }
}

export async function forceFailSupplier(
  supplier: MockSupplierSlug,
): Promise<void> {
  const response = await fetch(
    `${getMockBaseUrl()}/admin/force-fail/${supplier}`,
    { method: 'POST' },
  );

  if (!response.ok) {
    throw new Error(`Falha ao forçar erro em ${supplier}: ${response.status}`);
  }
}

export async function forceSlowSupplier(
  supplier: MockSupplierSlug,
): Promise<void> {
  const response = await fetch(
    `${getMockBaseUrl()}/admin/force-slow/${supplier}`,
    { method: 'POST' },
  );

  if (!response.ok) {
    throw new Error(
      `Falha ao forçar lentidão em ${supplier}: ${response.status}`,
    );
  }
}

export async function resetSearchTestState(): Promise<void> {
  const responses = await Promise.all(
    [API_PORT, API_SECONDARY_PORT].map((port) =>
      fetch(`http://localhost:${port}/__test__/reset`, { method: 'POST' }),
    ),
  );

  for (const response of responses) {
    if (!response.ok) {
      throw new Error(`Falha ao resetar estado de teste: ${response.status}`);
    }
  }

  await resetMockSuppliers();
}

export async function postSearch(
  port: number = API_PORT,
  payload: Record<string, unknown> = { ...SEARCH_PAYLOAD },
): Promise<{ status: number; body: SearchResponse; elapsedMs: number }> {
  const startedAt = Date.now();
  const response = await fetch(`http://localhost:${port}/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  return {
    status: response.status,
    body: (await response.json()) as SearchResponse,
    elapsedMs: Date.now() - startedAt,
  };
}

export async function postOrder(
  port: number,
  body: {
    quoteId: string;
    passageiro: string;
    idempotencyKey: string;
  },
): Promise<{ status: number; body: OrderResponse }> {
  const response = await fetch(`http://localhost:${port}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  return {
    status: response.status,
    body: (await response.json()) as OrderResponse,
  };
}

export function buildOrderPayload(idempotencyKey = `test-${randomUUID()}`) {
  return {
    quoteId: randomUUID(),
    passageiro: 'Teste E2E',
    idempotencyKey,
  };
}
