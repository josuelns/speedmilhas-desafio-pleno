import { postSearch, resetSearchTestState } from '../../test/e2e-helpers';

describe('Bônus - cache reativo de POST /search', () => {
  beforeEach(async () => {
    await resetSearchTestState();
  });

  afterEach(async () => {
    await resetSearchTestState();
  });

  it('marca a segunda busca idêntica como cached sem reconsultar fornecedores', async () => {
    const first = await postSearch();
    const second = await postSearch();

    expect([200, 201]).toContain(first.status);
    expect([200, 201]).toContain(second.status);
    expect(first.body.meta.cached).toBe(false);
    expect(second.body.meta.cached).toBe(true);
    expect(second.body.meta.pagination.total).toBe(
      first.body.meta.pagination.total,
    );
    expect(second.elapsedMs).toBeLessThanOrEqual(first.elapsedMs);
  });
});
