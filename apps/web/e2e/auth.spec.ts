import { test, expect } from '@playwright/test';

test.describe('auth journey', () => {
  test('registration flow: email -> OTP -> profile -> agent verification', async ({ page }) => {
    await page.route('**/api/v1/auth/register', (route) =>
      route.fulfill({ json: { otp: '123456' } }),
    );
    await page.route('**/api/v1/auth/verify-otp', (route) =>
      route.fulfill({
        json: {
          accessToken: 'test-access-token',
          user: { id: 'u-1', email: 'new@example.com', firstName: '', lastName: '', role: 'BUYER', verified: false },
        },
      }),
    );
    await page.route('**/api/v1/auth/complete-profile', (route) =>
      route.fulfill({
        json: {
          accessToken: 'test-access-token',
          user: { id: 'u-1', email: 'new@example.com', firstName: 'Ada', lastName: 'Obi', role: 'BUYER', verified: true },
        },
      }),
    );
    await page.route('**/api/v1/notifications**', (route) =>
      route.fulfill({ json: { notifications: [], total: 0 } }),
    );

    await page.goto('/auth');
    await expect(page.getByText('Welcome to Homewolves')).toBeVisible();

    await page.locator('#auth-email').fill('new@example.com');
    await page.getByRole('button', { name: 'Continue' }).click();

    await expect(page.getByText('Check Your Email')).toBeVisible();
    const digits = ['1', '2', '3', '4', '5', '6'];
    for (let i = 0; i < digits.length; i++) {
      await page.getByLabel(`OTP digit ${i + 1}`).fill(digits[i]!);
    }
    await page.getByRole('button', { name: 'Verify' }).click();

    await expect(page.getByText('Complete Your Profile')).toBeVisible();
    await page.locator('#auth-firstname').fill('Ada');
    await page.locator('#auth-lastname').fill('Obi');
    await page.locator('#auth-phone').fill('+234 800 000 0000');
    await page.getByRole('button', { name: 'Continue' }).click();

    await expect(page.getByText('Verify Your Identity')).toBeVisible();
  });

  test('invalid email shows a validation error state', async ({ page }) => {
    await page.route('**/api/v1/auth/register', (route) =>
      route.fulfill({ status: 400, json: { message: 'Invalid email address' } }),
    );
    await page.goto('/auth');
    await page.locator('#auth-email').fill('not-an-email');
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByText('Invalid email address')).toBeVisible();
  });

  test('auth page shows referral banner when ref param is present', async ({ page }) => {
    await page.goto('/auth?ref=AB12CD');
    await expect(page.getByText('Referral Applied')).toBeVisible();
    await expect(page.getByText('AB12CD')).toBeVisible();
  });
});