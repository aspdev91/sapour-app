import { test, expect } from '@playwright/test';

test.describe('Authentication - Allowlist', () => {
  test('should allow sign-in for allowlisted admin', async ({ page }) => {
    // Mock Supabase auth with allowlisted token
    await page.addInitScript(() => {
      window.localStorage.setItem('supabase.auth.token', 'mock-jwt-token-allowlisted');
    });

    // Navigate to the app
    await page.goto('/');

    // Should see loading state first
    await expect(page.getByText('Checking authentication...')).toBeVisible();

    // Should then see the main app with navigation
    await expect(page.getByText('Sapour Admin')).toBeVisible();

    // Should show user email in sidebar (mock email from JWT)
    await expect(page.getByText(/mock-jwt-token-allowlisted/)).toBeVisible();

    // Try to access users page (requires auth)
    await page.click('text=Users');
    await expect(page).toHaveURL(/\/users/);

    // Should be able to see users page (auth passed)
    await expect(page.getByText('Users')).toBeVisible();
  });

  test('should block access for non-allowlisted user', async ({ page }) => {
    // Mock Supabase auth with non-allowlisted token
    await page.addInitScript(() => {
      window.localStorage.setItem('supabase.auth.token', 'mock-jwt-token-not-allowlisted');
    });

    // Navigate to the app
    await page.goto('/');

    // Should see loading, then sign-in form
    await expect(page.getByText('Checking authentication...')).toBeVisible();

    // Should show sign-in form when auth fails
    await expect(page.getByText('Sign in with your admin email')).toBeVisible();
    await expect(page.getByText('Sapour Admin')).toBeVisible();
  });

  test('should show sign-in form when no auth token', async ({ page }) => {
    // Clear any auth tokens
    await page.addInitScript(() => {
      window.localStorage.removeItem('supabase.auth.token');
    });

    // Navigate to the app
    await page.goto('/');

    // Should see loading briefly, then sign-in form
    await expect(page.getByText('Checking authentication...')).toBeVisible();

    // Should show sign-in form
    await expect(page.getByText('Sign in with your admin email')).toBeVisible();
    await expect(page.getByText('Only allowlisted admin emails')).toBeVisible();
  });

  test('should allow manual sign-in with email', async ({ page }) => {
    // Start with no auth token
    await page.addInitScript(() => {
      window.localStorage.removeItem('supabase.auth.token');
    });

    // Navigate to the app
    await page.goto('/');

    // Should show sign-in form
    await expect(page.getByText('Sign in with your admin email')).toBeVisible();

    // Enter email and sign in
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.click('text=Sign In');

    // Should see loading state
    await expect(page.getByText('Signing in...')).toBeVisible();

    // Note: This test assumes the backend will accept the mock token
    // In real scenario, this would trigger Supabase auth flow
  });

  test('should login with real Supabase credentials', async ({ page }) => {
    // Navigate to the app
    await page.goto('/');

    // Should show sign-in form initially
    await expect(page.getByText('Sign in with your admin email')).toBeVisible();

    // Enter the real admin email and password
    await page.fill('input[type="email"]', 'mtdev91@gmail.com');
    await page.fill('input[type="password"]', 'tedSys-dotrod-coxme5');

    // Click sign in
    await page.click('text=Sign In');

    // Wait for either loading state or successful navigation
    await Promise.race([
      page.waitForTimeout(5000), // Max wait time
      page.waitForURL('**', { timeout: 5000 }).catch(() => {}), // Wait for navigation
    ]);

    // Should see the main app (auth + allowlist check passed)
    await expect(page.getByText('Sapour Admin')).toBeVisible({ timeout: 10000 });
    console.log('Login with real Supabase credentials successful!');
  });
});
