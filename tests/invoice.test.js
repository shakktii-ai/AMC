import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateGst } from '../lib/gst.js';
import { calculateInvoiceStatus } from '../lib/invoice-service.js';

test('State-aware GST calculation: Same state (CGST + SGST)', () => {
  const result = calculateGst({
    subtotal: 10000,
    discount: 0,
    customerState: 'MAHARASHTRA',
    companyState: 'MAHARASHTRA',
  });

  assert.equal(result.isSameState, true);
  assert.equal(result.cgstAmount, 900); // 9%
  assert.equal(result.sgstAmount, 900); // 9%
  assert.equal(result.igstAmount, 0);
  assert.equal(result.totalAmount, 11800);
});

test('State-aware GST calculation: Different state (IGST)', () => {
  const result = calculateGst({
    subtotal: 10000,
    discount: 0,
    customerState: 'GUJARAT',
    companyState: 'MAHARASHTRA',
  });

  assert.equal(result.isSameState, false);
  assert.equal(result.cgstAmount, 0);
  assert.equal(result.sgstAmount, 0);
  assert.equal(result.igstAmount, 1800); // 18%
  assert.equal(result.totalAmount, 11800);
});

test('Invoice status determination', () => {
  assert.equal(calculateInvoiceStatus({ balanceDue: 0, status: 'ISSUED' }), 'PAID');

  const pastDue = new Date(Date.now() - 5 * 24 * 3600 * 1000);
  assert.equal(calculateInvoiceStatus({ balanceDue: 500, dueDate: pastDue, status: 'ISSUED' }), 'OVERDUE');
});
