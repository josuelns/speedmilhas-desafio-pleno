import { randomUUID } from 'crypto';

import {
  API_PORT,
  buildOrderPayload,
  createPrismaClient,
  postOrder,
} from '../../test/e2e-helpers';

describe('RF2 - replay idempotente de POST /orders', () => {
  it('devolve a mesma reserva em chamadas sequenciais com a mesma idempotencyKey', async () => {
    const prisma = createPrismaClient();
    const idempotencyKey = `replay-${randomUUID()}`;
    const payload = buildOrderPayload(idempotencyKey);

    try {
      const firstResponse = await postOrder(API_PORT, payload);
      const secondResponse = await postOrder(API_PORT, payload);

      expect([200, 201]).toContain(firstResponse.status);
      expect([200, 201]).toContain(secondResponse.status);
      expect(firstResponse.body.id).toBe(secondResponse.body.id);
      expect(firstResponse.body.idempotencyKey).toBe(idempotencyKey);
      expect(secondResponse.body.idempotencyKey).toBe(idempotencyKey);

      const count = await prisma.order.count({
        where: { idempotencyKey },
      });

      expect(count).toBe(1);
    } finally {
      await prisma.$disconnect();
    }
  });
});
