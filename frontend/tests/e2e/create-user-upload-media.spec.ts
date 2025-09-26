import { test, expect } from '@playwright/test';

test.describe('Create User and Upload Media', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authenticated admin
    await page.addInitScript(() => {
      window.localStorage.setItem('supabase.auth.token', 'mock-jwt-token-allowlisted');
    });
  });

  test('should create a new user and upload media', async ({ page }) => {
    await page.goto('/');

    // Navigate to users page
    await page.click('text=Users');
    await expect(page).toHaveURL('/users');

    // Click "Add User" button
    await page.click('text=Add User');
    await expect(page).toHaveURL('/users/new');

    // Fill user creation form
    await page.fill('input[name="name"]', 'Test User E2E');

    // Mock the API responses
    await page.route('**/users', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'test-user-id',
            name: 'Test User E2E',
            consent: true,
            createdAt: new Date().toISOString(),
          }),
        });
      }
    });

    // Submit user creation
    await page.click('button[type="submit"]');

    // Should redirect to user detail page
    await expect(page).toHaveURL('/users/test-user-id');

    // Should show user info
    await expect(page.getByText('Test User E2E')).toBeVisible();

    // Test media upload section should be present
    await expect(page.getByText('Upload Media')).toBeVisible();

    // Mock file upload
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test-image.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake-image-data'),
    });

    // Mock signed URL API
    await page.route('**/media/signed-url', async (route) => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          uploadUrl: 'https://mock-storage.example.com/upload',
          storagePath: 'test/path/image.jpg',
          mediaId: 'test-media-id',
        }),
      });
    });

    // Click upload button
    await page.click('text=Upload');

    // Should show success message
    await expect(page.getByText('Upload successful')).toBeVisible();

    // Should show the uploaded media
    await expect(page.getByText('test-image.jpg')).toBeVisible();
  });

  test('should handle upload errors gracefully', async ({ page }) => {
    await page.goto('/users');

    // Navigate to existing user or create one first
    // This test assumes a user exists, in real scenario we'd create one

    // Mock failed upload
    await page.route('**/media/signed-url', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Invalid file type',
        }),
      });
    });

    // Try to upload invalid file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'invalid-file.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('invalid data'),
    });

    await page.click('text=Upload');

    // Should show error message
    await expect(page.getByText('Invalid file type')).toBeVisible();
  });

  test('should validate user creation form', async ({ page }) => {
    await page.goto('/users/new');

    // Try to submit empty form
    await page.click('button[type="submit"]');

    // Should show validation error
    await expect(page.getByText('Name is required')).toBeVisible();

    // Fill name and submit
    await page.fill('input[name="name"]', 'Valid User Name');

    // Mock successful creation
    await page.route('**/users', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'valid-user-id',
            name: 'Valid User Name',
            consent: true,
            createdAt: new Date().toISOString(),
          }),
        });
      }
    });

    await page.click('button[type="submit"]');

    // Should redirect to user detail
    await expect(page).toHaveURL('/users/valid-user-id');
  });
});
