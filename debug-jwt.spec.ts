import { test, expect } from '@playwright/test';

test.describe('JWT Debug Test', () => {
  test('capture and debug JWT token', async ({ page }) => {
    // Enable request/response logging
    page.on('request', (request) => {
      console.log('REQUEST:', request.method(), request.url());
      if (request.url().includes('/auth/')) {
        console.log('AUTH REQUEST HEADERS:', request.headers());
        if (request.postData()) {
          console.log('AUTH REQUEST BODY:', request.postData());
        }
      }
    });

    page.on('response', (response) => {
      console.log('RESPONSE:', response.status(), response.url());
      if (response.url().includes('/auth/')) {
        console.log('AUTH RESPONSE STATUS:', response.status());
        // Log response headers that might contain tokens
        const headers = response.headers();
        Object.keys(headers).forEach((key) => {
          if (key.toLowerCase().includes('auth') || key.toLowerCase().includes('token')) {
            console.log(`AUTH HEADER ${key}:`, headers[key]);
          }
        });
      }
    });

    // Navigate to the app
    console.log('Navigating to http://localhost:3000');
    await page.goto('http://localhost:3000');

    // Wait for the sign-in form to load
    await page.waitForSelector('input[type="email"]');
    console.log('Sign-in form loaded');

    // Try to sign in (you'll need to provide actual credentials)
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const signInButton = page.locator('button:has-text("Sign In")');

    // Fill in test credentials (replace with actual admin email/password)
    await emailInput.fill('test@example.com');
    await passwordInput.fill('password123');

    console.log('Attempting to sign in...');
    await signInButton.click();

    // Wait a bit for any auth requests to complete
    await page.waitForTimeout(5000);

    // Check if we get redirected or see an error
    const currentUrl = page.url();
    console.log('Current URL after sign-in attempt:', currentUrl);

    // Look for any error messages
    const errorElement = page.locator('[role="alert"], .text-destructive').first();
    if (await errorElement.isVisible()) {
      const errorText = await errorElement.textContent();
      console.log('Error message:', errorText);
    }

    // If sign-in succeeds, try to capture the JWT from localStorage or network
    const localStorage = await page.evaluate(() => {
      const items: { [key: string]: string } = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          items[key] = localStorage.getItem(key) || '';
        }
      }
      return items;
    });

    console.log('localStorage contents:', localStorage);

    // If we have a JWT token, test it against our debug endpoint
    const supabaseAuth = localStorage['sb-lahbaecgtipihprmjpwq-auth-token'];
    if (supabaseAuth) {
      console.log('Found Supabase auth token in localStorage');
      try {
        const authData = JSON.parse(supabaseAuth);
        const accessToken = authData.access_token;
        console.log('Access token found, length:', accessToken?.length);

        if (accessToken) {
          // Test the token against our debug endpoint
          console.log('Testing token against debug endpoint...');
          const debugResponse = await page.request.post('http://localhost:3001/auth/debug-token', {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          });

          const debugData = await debugResponse.json();
          console.log('Debug endpoint response:', JSON.stringify(debugData, null, 2));

          // Also test against the actual /auth/me endpoint
          console.log('Testing token against /auth/me endpoint...');
          const meResponse = await page.request.get('http://localhost:3001/auth/me', {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          });

          console.log('ME endpoint status:', meResponse.status());
          if (meResponse.status() !== 200) {
            const errorData = await meResponse.json();
            console.log('ME endpoint error:', JSON.stringify(errorData, null, 2));
          } else {
            const meData = await meResponse.json();
            console.log('ME endpoint success:', JSON.stringify(meData, null, 2));
          }
        }
      } catch (error) {
        console.error('Error testing token:', error);
      }
    } else {
      console.log('No Supabase auth token found in localStorage');
    }
  });
});
