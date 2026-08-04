import { randomUUID } from 'crypto';

import {
  API_PORT,
  API_SECONDARY_PORT,
  buildOrderPayload,
  createPrismaClient,
  postOrder,
} from '../../test/e2e-helpers';

describe('RF4 - concorrência de POST /orders', () => {
  it('cria uma única reserva quando duas instâncias recebem a mesma idempotencyKey', async () => {
    const prisma = createPrismaClient();
    const idempotencyKey = `rf4-${randomUUID()}`;
    const payload = buildOrderPayload(idempotencyKey);

    try {
      const [responseA, responseB] = await Promise.all([
        postOrder(API_PORT, payload),
        postOrder(API_SECONDARY_PORT, payload),
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
