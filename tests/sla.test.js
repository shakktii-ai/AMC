import test from 'node:test';
import assert from 'node:assert/strict';
import { getSlaTargetMinutes, calculateSlaDueDate, calculateSlaStatus } from '../lib/sla.js';

test('SLA target minutes by priority', () => {
  assert.equal(getSlaTargetMinutes('CRITICAL'), 60);
  assert.equal(getSlaTargetMinutes('HIGH'), 120);
  assert.equal(getSlaTargetMinutes('MEDIUM'), 240);
  assert.equal(getSlaTargetMinutes('LOW'), 480);
});

test('SLA Status breach detection', () => {
  const created = new Date(Date.now() - 150 * 60 * 1000); // Created 150 mins ago
  const complaint = {
    createdAt: created,
    priority: 'HIGH', // SLA target 120 mins
    status: 'TECHNICIAN_DISPATCHED',
    slaTargetMinutes: 120,
  };

  const status = calculateSlaStatus(complaint);
  assert.equal(status, 'BREACHED');
});

test('SLA Status within target', () => {
  const created = new Date(Date.now() - 10 * 60 * 1000); // Created 10 mins ago
  const complaint = {
    createdAt: created,
    priority: 'HIGH', // SLA target 120 mins
    status: 'TECHNICIAN_DISPATCHED',
    slaTargetMinutes: 120,
  };

  const status = calculateSlaStatus(complaint);
  assert.equal(status, 'WITHIN_SLA');
});
