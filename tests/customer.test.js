import test from 'node:test';
import assert from 'node:assert/strict';
import { customerSchema } from '../validators/schemas.js';

test('Customer creation schema validation & login account parameters', () => {
  const validData = {
    customerId: 'CUST-9901',
    name: 'Anil Mehta',
    companyName: 'Mehta Heights',
    email: 'anil@mehta.local',
    phone: '+91 98200 99999',
    address: 'Sector 5, Vashi',
    city: 'Navi Mumbai',
    state: 'MAHARASHTRA',
    pincode: '400703',
    createLogin: true,
    loginEmail: 'anil@mehta.local',
    password: 'Test@12345',
  };

  const parsed = customerSchema.parse(validData);
  assert.equal(parsed.customerId, 'CUST-9901');
  assert.equal(parsed.createLogin, true);
  assert.equal(parsed.loginEmail, 'anil@mehta.local');
  assert.equal(parsed.password, 'Test@12345');
});

test('Customer creation schema rejects invalid email', () => {
  const invalidEmailData = {
    customerId: 'CUST-9902',
    name: 'Anil Mehta',
    email: 'not-an-email',
    phone: '+91 98200 99999',
    address: 'Sector 5, Vashi',
    city: 'Navi Mumbai',
    state: 'MAHARASHTRA',
    pincode: '400703',
  };

  assert.throws(() => customerSchema.parse(invalidEmailData), /Invalid email address/);
});
