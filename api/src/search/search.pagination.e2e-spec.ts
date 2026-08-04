import { API_PORT, postSearch, resetSearchTestState } from '../../test/e2e-helpers';

describe('Bônus - paginação de POST /search', () => {
  beforeEach(async () => {
    await resetSearchTestState();
  });

  afterEach(async () => {
    await resetSearchTestState();
  });

  it('retorna fatias paginadas com hasMore quando há mais resultados', async () => {
    const firstPage = await postSearch(API_PORT, {
      ...{ origin: 'GRU', destination: 'GIG', date: '2026-08-15' },
      page: 1,
      pageSize: 3,
    });

    expect([200, 201]).toContain(firstPage.status);
    expect(firstPage.body.results).toHaveLength(3);
    expect(firstPage.body.meta.pagination).toMatchObject({
      page: 1,
      pageSize: 3,
      hasMore: true,
    });
    expect(firstPage.body.meta.pagination.total).toBeGreaterThan(3);

    const secondPage = await postSearch(API_PORT, {
      origin: 'GRU',
      destination: 'GIG',
      date: '2026-08-15',
      page: 2,
      pageSize: 3,
    });

    expect(secondPage.body.results).toHaveLength(3);
    expect(secondPage.body.meta.cached).toBe(true);
    expect(secondPage.body.meta.pagination.page).toBe(2);

    const firstIds = new Set(firstPage.body.results.map((quote) => quote.quoteId));
    for (const quote of secondPage.body.results) {
      expect(firstIds.has(quote.quoteId)).toBe(false);
    }
  });
});
