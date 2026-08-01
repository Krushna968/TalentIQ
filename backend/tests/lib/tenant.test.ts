import { describe, it, expect } from 'vitest';
import { scopedWhere, assertSameOrg } from '../../src/lib/tenant.js';
import { AppError } from '../../src/middleware/error.middleware.js';
import { fakeReq } from '../setup/helpers.js';

describe('tenant scoping helpers', () => {
  it('injects the caller orgId into a where clause', () => {
    const req = fakeReq({ id: 'u1', orgId: 'orgA' });
    expect(scopedWhere(req, { status: 'open' })).toEqual({ status: 'open', orgId: 'orgA' });
    expect(scopedWhere(req)).toEqual({ orgId: 'orgA' });
  });

  it('allows same-org records and rejects cross-org / missing ones', () => {
    const req = fakeReq({ id: 'u1', orgId: 'orgA' });
    expect(() => assertSameOrg({ orgId: 'orgA' }, req)).not.toThrow();
    expect(() => assertSameOrg({ orgId: 'orgB' }, req)).toThrow(AppError);
    expect(() => assertSameOrg(null, req)).toThrow(AppError);
  });
});
