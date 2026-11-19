import test from 'node:test';
import assert from 'node:assert/strict';
import { createUserSchema, updateUserSchema } from './auth.validator';
import {
  canRoleAccess,
  canViewSensitiveFinancials,
  parseDemoRole,
} from '../middleware/auth';

test('createUserSchema normalizes email and rejects invalid roles', () => {
  const valid = createUserSchema.parse({
    fullName: 'Usman Ali',
    email: 'USMAN@CellTrack.PK',
    role: 'MANAGER',
  });
  assert.equal(valid.email, 'usman@celltrack.pk');

  const invalidRole = createUserSchema.safeParse({
    fullName: 'Usman Ali',
    email: 'usman@celltrack.pk',
    role: 'SUPERUSER',
  });
  assert.equal(invalidRole.success, false);
});

test('updateUserSchema validates partial updates cleanly', () => {
  const ok = updateUserSchema.safeParse({ role: 'ADMIN', isActive: true });
  assert.equal(ok.success, true);

  const shortName = updateUserSchema.safeParse({ fullName: 'A' });
  assert.equal(shortName.success, false);
});

test('parseDemoRole defaults safely to ADMIN and validates known roles', () => {
  assert.equal(parseDemoRole(undefined), 'ADMIN');
  assert.equal(parseDemoRole('invalid'), 'ADMIN');
  assert.equal(parseDemoRole('manager'), 'MANAGER');
  assert.equal(parseDemoRole('STAFF'), 'STAFF');
});

test('RBAC helpers enforce Admin, Manager, and Staff permission matrix', () => {
  assert.equal(canRoleAccess('ADMIN', ['ADMIN']), true);
  assert.equal(canRoleAccess('MANAGER', ['ADMIN']), false);
  assert.equal(canRoleAccess('STAFF', ['ADMIN', 'MANAGER']), false);

  assert.equal(canViewSensitiveFinancials('ADMIN'), true);
  assert.equal(canViewSensitiveFinancials('MANAGER'), false);
  assert.equal(canViewSensitiveFinancials('STAFF'), false);
});
