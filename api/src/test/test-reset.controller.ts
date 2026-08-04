import { Controller, NotFoundException, Post } from '@nestjs/common';

import { clearSearchCache } from '../search/search-cache';
import { resetSupplierBCircuitBreaker } from '../suppliers/circuit-breaker';

@Controller('__test__')
export class TestResetController {
  @Post('reset')
  reset(): { ok: true } {
    if (process.env.ENABLE_TEST_ENDPOINTS !== 'true') {
      throw new NotFoundException();
    }

    clearSearchCache();
    resetSupplierBCircuitBreaker();

    return { ok: true };
  }
}
