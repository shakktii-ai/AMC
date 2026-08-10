import test from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, comparePassword, signToken, verifyToken } from '../lib/auth.js';
import { hasRole, validateCustomerOwnership, validateTechnicianOwnership } from '../lib/rbac.js';

test('Password hashing and comparison', async () => {
  const plain = 'Test@12345';
  const hashed = await hashPassword(plain);
  assert.notEqual(plain, hashed);

  const match = await comparePassword(plain, hashed);
  assert.equal(match, true);

  const invalidMatch = await comparePassword('WrongPass123', hashed);
  assert.equal(invalidMatch, false);
});

test('JWT signing and verification', () => {
  const payload = { id: 'user_123', email: 'test@example.com', role: 'ADMIN' };
  const token = signToken(payload);
  assert.ok(token);

  const decoded = verifyToken(token);
  assert.equal(decoded.id, 'user_123');
  assert.equal(decoded.role, 'ADMIN');
});

test('RBAC role authorization checks', () => {
  assert.equal(hasRole('SUPER_ADMIN', ['SUPER_ADMIN', 'ADMIN']), true);
  assert.equal(hasRole('CUSTOMER', ['SUPER_ADMIN', 'ADMIN']), false);
});

test('Customer IDOR Ownership validation', () => {
  const adminUser = { role: 'ADMIN' };
  assert.equal(validateCustomerOwnership(adminUser, 'cust_999'), true);

  const customerUser = { role: 'CUSTOMER', customerId: 'cust_111' };
  assert.equal(validateCustomerOwnership(customerUser, 'cust_111'), true);
  assert.equal(validateCustomerOwnership(customerUser, 'cust_222'), false); // Cross-customer IDOR blocked!
});

test('Technician Ownership validation', () => {
  const managerUser = { role: 'SERVICE_MANAGER' };
  assert.equal(validateTechnicianOwnership(managerUser, 'tech_555'), true);

  const techUser = { role: 'TECHNICIAN', id: 'tech_555' };
  assert.equal(validateTechnicianOwnership(techUser, 'tech_555'), true);
  assert.equal(validateTechnicianOwnership(techUser, 'tech_777'), false); // Cannot access another tech's job!
});
