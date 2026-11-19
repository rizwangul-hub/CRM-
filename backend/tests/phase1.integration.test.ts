import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createApp } from '../app';
import { connectDatabase, disconnectDatabase } from '../config/db';
import { seedDatabaseIfEmpty } from '../utils/seed';
import { Product } from '../models/Product';
import { toPaisa } from '../utils/money';

let server: http.Server;
let baseUrl = '';

async function apiFetch(
  path: string,
  options: { method?: string; body?: unknown; role?: 'ADMIN' | 'MANAGER' | 'STAFF' } = {},
) {
  const headers: Record<string, string> = {};
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (options.role) {
    headers['X-Demo-Role'] = options.role;
  }

  const res = await fetch(`${baseUrl}${path}`, {
    method: options.method || 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

test('Phase 1 Backend Integration Suite (Direct Access + Role Switcher)', async (t) => {
  await connectDatabase();
  await seedDatabaseIfEmpty();

  const app = createApp();
  await new Promise<void>((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      if (addr && typeof addr !== 'string') {
        baseUrl = `http://127.0.0.1:${addr.port}`;
      }
      resolve();
    });
  });

  t.after(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await disconnectDatabase();
  });

  let createdStaffId = '';

  await t.test('GET /api/health reports connected MongoDB', async () => {
    const res = await apiFetch('/api/health');
    assert.equal(res.status, 200);
    assert.equal(res.json.success, true);
    assert.equal(res.json.database.connected, true);
  });

  await t.test('Direct dashboard access defaults to ADMIN with full financial metrics', async () => {
    const res = await apiFetch('/api/dashboard/overview');
    assert.equal(res.status, 200);
    const data = res.json.data;
    assert.equal(data.permissions.canViewFinancials, true);
    assert.ok(data.summary.totalProducts >= 9);
    assert.ok(data.summary.totalCustomers >= 5);
    assert.ok(data.summary.totalSalesMonthPaisa > 0);
    assert.equal(typeof data.summary.netProfitMonthPaisa, 'number');
    assert.equal(typeof data.summary.totalExpensesMonthPaisa, 'number');
    assert.equal(data.charts.dailySales.length, 14);
    assert.equal(data.charts.monthlyRevenue.length, 6);
  });

  await t.test('ADMIN role can create, update, guard duplicate email, and delete team members', async () => {
    const create = await apiFetch('/api/users', {
      method: 'POST',
      role: 'ADMIN',
      body: {
        fullName: 'QA Cashier',
        email: 'cashier.qa@celltrack.pk',
        phone: '+92 300 9988776',
        role: 'STAFF',
      },
    });
    assert.equal(create.status, 201);
    createdStaffId = create.json.data.user.id;

    const dup = await apiFetch('/api/users', {
      method: 'POST',
      role: 'ADMIN',
      body: {
        fullName: 'Duplicate User',
        email: 'cashier.qa@celltrack.pk',
        role: 'STAFF',
      },
    });
    assert.equal(dup.status, 409);

    const patch = await apiFetch(`/api/users/${createdStaffId}`, {
      method: 'PATCH',
      role: 'ADMIN',
      body: { role: 'MANAGER' },
    });
    assert.equal(patch.status, 200);
    assert.equal(patch.json.data.user.role, 'MANAGER');

    const del = await apiFetch(`/api/users/${createdStaffId}`, {
      method: 'DELETE',
      role: 'ADMIN',
    });
    assert.equal(del.status, 200);
  });

  await t.test('MANAGER role gets operational dashboard & audit logs, denied User Management', async () => {
    const usersAttempt = await apiFetch('/api/users', { role: 'MANAGER' });
    assert.equal(usersAttempt.status, 403);

    const auditOk = await apiFetch('/api/dashboard/audit-logs', { role: 'MANAGER' });
    assert.equal(auditOk.status, 200);

    const dash = await apiFetch('/api/dashboard/overview', { role: 'MANAGER' });
    assert.equal(dash.status, 200);
    assert.equal(dash.json.data.permissions.canViewFinancials, false);
    assert.equal(dash.json.data.summary.netProfitMonthPaisa, null);
  });

  await t.test('STAFF role gets operational dashboard only, denied /api/users and audit logs', async () => {
    const usersAttempt = await apiFetch('/api/users', { role: 'STAFF' });
    assert.equal(usersAttempt.status, 403);

    const auditAttempt = await apiFetch('/api/dashboard/audit-logs', { role: 'STAFF' });
    assert.equal(auditAttempt.status, 403);

    const dash = await apiFetch('/api/dashboard/overview', { role: 'STAFF' });
    assert.equal(dash.status, 200);
    assert.equal(dash.json.data.permissions.canViewFinancials, false);
    assert.equal(dash.json.data.summary.netProfitMonthPaisa, null);
    assert.equal(dash.json.data.summary.totalExpensesMonthPaisa, null);
  });

  await t.test('Product schema enforces unique IMEI for active phones', async () => {
    await Product.syncIndexes();
    await assert.rejects(
      () =>
        Product.create({
          productType: 'PHONE',
          name: 'Duplicate IMEI Test Phone',
          brand: 'Apple',
          deviceModel: 'A3106',
          category: 'Smartphones',
          imei: '356891240918472',
          condition: 'New',
          purchasePricePaisa: toPaisa(400000),
          sellingPricePaisa: toPaisa(430000),
          quantity: 1,
          minStockLevel: 1,
        }),
      (err: { code?: number }) => err?.code === 11000,
    );
  });
});
