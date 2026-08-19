import { test, expect } from '@playwright/test';

const SESSION = {
  state: {
    accessToken: 'test-access-token',
    user: {
      id: 'u-1',
      email: 'agent@example.com',
      firstName: 'Ada',
      lastName: 'Obi',
      role: 'AGENT',
      verified: true,
    },
  },
  version: 0,
};

test.describe('agent dashboard journey', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript((session) => {
      localStorage.setItem('hw-auth', JSON.stringify(session));
    }, SESSION);
    await page.route('**/api/v1/crm/dashboard/stats', (route) =>
      route.fulfill({
        json: { activeClients: 8, newThisMonth: 3, pendingClients: 2, todayInspections: 1 },
      }),
    );
    await page.route('**/api/v1/crm/dashboard/recent-clients', (route) =>
      route.fulfill({
        json: [
          {
            id: 'c-1',
            status: 'active',
            buyer: { firstName: 'Bola', lastName: 'Ade', email: 'bola@example.com' },
          },
        ],
      }),
    );
    await page.route('**/api/v1/activity/stats*', (route) =>
      route.fulfill({ json: { points: 120, tier: 'Silver' } }),
    );
    await page.route('**/api/v1/crm/inspections*', (route) =>
      route.fulfill({ json: [] }),
    );
    await page.route('**/api/v1/listings*', (route) =>
      route.fulfill({ json: { listings: [], total: 0 } }),
    );
    await page.route('**/api/v1/transactions*', (route) =>
      route.fulfill({ json: { transactions: [], total: 0 } }),
    );
    await page.route('**/api/v1/notifications**', (route) =>
      route.fulfill({ json: { notifications: [], total: 0 } }),
    );
    await page.route('**/api/v1/audit**', (route) =>
      route.fulfill({ json: [] }),
    );
  });

  test('dashboard loads with agent greeting and client stats', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByText(/Welcome back, Ada/)).toBeVisible();
    await expect(page.getByText('Active Clients')).toBeVisible();
  });

  test('agent can navigate to their transactions page', async ({ page }) => {
    await page.goto('/dashboard/agent/transactions');
    await expect(page.getByRole('heading', { name: 'Transactions' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'New Transaction' })).toBeVisible();
    await expect(page.getByText('No transactions yet')).toBeVisible();
  });

  test('agent can open the new transaction modal', async ({ page }) => {
    await page.goto('/dashboard/agent/transactions');
    await page.getByRole('button', { name: 'New Transaction' }).click({ force: true });
    await expect(page.getByRole('heading', { name: 'New Transaction' })).toBeVisible();
    await expect(page.getByPlaceholder('Buyer user ID')).toBeVisible();
  });

  test('unauth user is redirected to /auth', async ({ page }) => {
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/auth/, { timeout: 10_000 });
  });
});