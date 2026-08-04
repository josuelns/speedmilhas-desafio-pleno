import {
  API_PORT,
  forceFailSupplier,
  postSearch,
  resetSearchTestState,
} from '../../test/e2e-helpers';

describe('Bônus - circuit breaker do fornecedor B', () => {
  beforeEach(async () => {
    await resetSearchTestState();
    await forceFailSupplier('supplier-b');
  });

  afterEach(async () => {
    await resetSearchTestState();
  });

  it('abre o circuito após falhas consecutivas e evita nova chamada ao B', async () => {
    const failingDates = ['2026-08-10', '2026-08-11', '2026-08-12'];

    for (const date of failingDates) {
      const response = await postSearch(API_PORT, {
        origin: 'GRU',
        destination: 'GIG',
        date,
      });

      expect(response.body.meta.suppliers.B).toEqual({
        ok: false,
        reason: 'http_error',
      });
    }

    const fourth = await postSearch(API_PORT, {
      origin: 'GRU',
      destination: 'GIG',
      date: '2026-08-13',
    });

    expect([200, 201]).toContain(fourth.status);
    expect(fourth.body.meta.suppliers.B).toEqual({
      ok: false,
      reason: 'circuit_open',
    });
    expect(fourth.body.meta.suppliers.A).toEqual({ ok: true });
    expect(fourth.body.meta.suppliers.C).toEqual({ ok: true });
    expect(fourth.elapsedMs).toBeLessThan(2000);
  });
});
