import type { SupplierId } from './types';

export const SUPPLIER_IDS = {
  A: 'A',
  B: 'B',
  C: 'C',
} as const satisfies Record<SupplierId, SupplierId>;
