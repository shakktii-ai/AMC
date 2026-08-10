import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateAmcStatus, datesOverlap } from '../lib/amc-service.js';
import { generatePpmScheduleDates, formatPpmServiceId } from '../lib/ppm-generator.js';

test('AMC dynamic status calculation', () => {
  const now = new Date();
  const past = new Date(now.getTime() - 400 * 24 * 3600 * 1000);
  const pastEnd = new Date(now.getTime() - 10 * 24 * 3600 * 1000);

  assert.equal(calculateAmcStatus({ startDate: past, endDate: pastEnd, status: 'ACTIVE' }), 'EXPIRED');

  const futureEnd = new Date(now.getTime() + 15 * 24 * 3600 * 1000); // 15 days left
  assert.equal(calculateAmcStatus({ startDate: past, endDate: futureEnd, status: 'ACTIVE' }), 'EXPIRING_SOON');

  const longFutureEnd = new Date(now.getTime() + 180 * 24 * 3600 * 1000);
  assert.equal(calculateAmcStatus({ startDate: past, endDate: longFutureEnd, status: 'ACTIVE' }), 'ACTIVE');
});

test('AMC Date overlap detection', () => {
  const range1Start = '2026-01-01';
  const range1End = '2026-12-31';

  const overlappingRangeStart = '2026-06-01';
  const overlappingRangeEnd = '2027-05-31';

  const nonOverlappingStart = '2027-01-01';
  const nonOverlappingEnd = '2027-12-31';

  assert.equal(datesOverlap(range1Start, range1End, overlappingRangeStart, overlappingRangeEnd), true);
  assert.equal(datesOverlap(range1Start, range1End, nonOverlappingStart, nonOverlappingEnd), false);
});

test('PPM Schedule date generator', () => {
  const startDate = '2026-01-01';
  const endDate = '2026-12-31';

  const monthlyDates = generatePpmScheduleDates(startDate, endDate, 'MONTHLY');
  assert.equal(monthlyDates.length, 12);

  const quarterlyDates = generatePpmScheduleDates(startDate, endDate, 'QUARTERLY');
  assert.equal(quarterlyDates.length, 4);
});

test('PPM Service ID deterministic format', () => {
  const amc1 = { contractNumber: 'AMC-2026-000001', startDate: new Date('2026-01-01') };
  assert.equal(formatPpmServiceId(amc1, 0, 0), 'PPM-AMC-2026-000001-LIFT-1-V01');

  const amc2 = { amcId: 'AMC-5001', startDate: new Date('2026-01-01') };
  assert.equal(formatPpmServiceId(amc2, 1, 2), 'PPM-AMC-2026-005001-LIFT-2-V03');
});
