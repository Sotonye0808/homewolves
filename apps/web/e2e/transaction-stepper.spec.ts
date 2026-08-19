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

const TX = {
  id: 't-1',
  status: 'IN_PROGRESS',
  currentStep: 2,
  type: 'PURCHASE',
  listing: { id: 'l-1', title: 'Modern Apartment' },
  buyer: { id: 'b-1', firstName: 'Bola', lastName: 'Ade', email: 'bola@example.com' },
  stepsJson: [
    { id: 's1', label: 'Inspection Scheduled', status: 'completed', order: 0 },
    { id: 's2', label: 'Inspection Completed', status: 'completed', order: 1 },
    { id: 's3', label: 'Documents Received', status: 'active', order: 2 },
    { id: 's4', label: 'Due Diligence', status: 'pending', order: 3 },
  ],
};

test.describe('transaction stepper journey', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript((session) => {
      localStorage.setItem('hw-auth', JSON.stringify(session));
    }, SESSION);
    await page.route('**/api/v1/transactions/t-1', (route) =>
      route.fulfill({ json: TX }),
    );
    await page.route('**/api/v1/transactions/t-1/documents', (route) =>
      route.fulfill({ json: [] }),
    );
    await page.route('**/api/v1/signatures/transaction/t-1', (route) =>
      route.fulfill({ json: [] }),
    );
    await page.route('**/api/v1/audit**', (route) =>
      route.fulfill({ json: [] }),
    );
    await page.route('**/api/v1/notifications**', (route) =>
      route.fulfill({ json: { notifications: [], total: 0 } }),
    );
  });

  test('transaction detail renders the stepper and current step', async ({ page }) => {
    await page.goto('/dashboard/agent/transactions/t-1');
    await expect(page.getByText('Deal Overview')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Documents Received' })).toBeVisible();
    await expect(page.getByText('IN_PROGRESS', { exact: true })).toBeVisible();
  });

  test('advancing the transaction calls the advance endpoint', async ({ page }) => {
    await page.route('**/api/v1/transactions/t-1/advance', (route) => {
      route.fulfill({ json: { ...TX, currentStep: 3 } });
    });
    const advanceRequest = page.waitForRequest(
      (req) => req.url().includes('/transactions/t-1/advance') && req.method() === 'PUT',
    );
    await page.goto('/dashboard/agent/transactions/t-1');
    await page.getByRole('button', { name: 'Advance to Next Step' }).click({ force: true });
    await advanceRequest;
  });
});