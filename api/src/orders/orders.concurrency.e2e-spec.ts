import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';
import { randomUUID } from 'crypto';

import { PrismaClient } from '../generated/prisma/client';

const API_PORTS = [3000, 3010] as const;

interface OrderResponse {
  id: string;
  idempotencyKey: string;
  status: string;
}

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL não configurada para o teste RF4');
  }

  return new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });
}

async function postOrder(
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

describe('RF4 - concorrência de POST /orders', () => {
  it('cria uma única reserva quando duas instâncias recebem a mesma idempotencyKey', async () => {
    const prisma = createPrismaClient();
    const idempotencyKey = `rf4-${randomUUID()}`;
    const payload = {
      quoteId: randomUUID(),
      passageiro: 'Teste RF4',
      idempotencyKey,
    };

    try {
      const [responseA, responseB] = await Promise.all([
        postOrder(API_PORTS[0], payload),
        postOrder(API_PORTS[1], payload),
      ]);

      expect([200, 201]).toContain(responseA.status);
      expect([200, 201]).toContain(responseB.status);
      expect(responseA.body.id).toBe(responseB.body.id);
      expect(responseA.body.idempotencyKey).toBe(idempotencyKey);
      expect(responseB.body.idempotencyKey).toBe(idempotencyKey);

      const count = await prisma.order.count({
        where: { idempotencyKey },
      });

      expect(count).toBe(1);
    } finally {
      await prisma.$disconnect();
    }
  });
});
