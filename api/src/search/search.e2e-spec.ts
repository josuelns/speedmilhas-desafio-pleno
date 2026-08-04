import {
  forceFailSupplier,
  forceSlowSupplier,
  postSearch,
  resetSearchTestState,
} from '../../test/e2e-helpers';

const SEARCH_DEADLINE_MS = 6000;

describe('RF1 - POST /search', () => {
  beforeEach(async () => {
    await resetSearchTestState();
  });

  afterEach(async () => {
    await resetSearchTestState();
  });

  it('retorna resultado parcial quando o fornecedor B falha', async () => {
    await forceFailSupplier('supplier-b');

    const { status, body } = await postSearch();

    expect([200, 201]).toContain(status);
    expect(body.meta.partial).toBe(true);
    expect(body.meta.suppliers.B).toEqual({ ok: false, reason: 'http_error' });
    expect(body.meta.suppliers.A).toEqual({ ok: true });
    expect(body.meta.suppliers.C).toEqual({ ok: true });
    expect(body.results.length).toBeGreaterThan(0);
    expect(body.results.every((quote) => quote.supplier !== 'B')).toBe(true);

    for (let index = 1; index < body.results.length; index += 1) {
      expect(body.results[index].miles).toBeGreaterThanOrEqual(
        body.results[index - 1].miles,
      );
    }
  });

  it('respeita o teto de 6s quando o fornecedor B demora 8s', async () => {
    await forceSlowSupplier('supplier-b');

    const { status, body, elapsedMs } = await postSearch();

    expect([200, 201]).toContain(status);
    expect(elapsedMs).toBeLessThanOrEqual(SEARCH_DEADLINE_MS);
    expect(body.meta.partial).toBe(true);
    expect(body.meta.suppliers.B).toEqual({ ok: false, reason: 'timeout' });
    expect(body.meta.suppliers.A).toEqual({ ok: true });
    expect(body.meta.suppliers.C).toEqual({ ok: true });
    expect(body.results.length).toBeGreaterThan(0);
  });
});
