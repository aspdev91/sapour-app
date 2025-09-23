import { test, expect } from '@playwright/test';

test.describe('Complete Login Flow Test', () => {
  test('should login and access admin dashboard', async ({ page }) => {
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

    page.on('response', async (response) => {
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
        // Log response body for auth requests
        try {
          const body = await response.text();
          console.log('AUTH RESPONSE BODY:', body);
        } catch (e) {
          console.log('Could not read response body');
        }
      }
    });

    // Navigate to the app
    console.log('Navigating to http://localhost:3000');
    await page.goto('http://localhost:3000');

    // Wait for the sign-in form to load
    await page.waitForSelector('input[type="email"]');
    console.log('Sign-in form loaded');

    // Check if we're stuck on "Checking authentication..."
    const checkingAuthText = page.locator('text=Checking authentication...');
    if (await checkingAuthText.isVisible()) {
      console.log('App is stuck on "Checking authentication..." - this indicates auth flow issue');
    }

    // Try to sign in with test credentials (these will fail, but we can see the auth flow)
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const signInButton = page.locator('button:has-text("Sign In")');

    // Fill in test credentials
    await emailInput.fill('admin@example.com');
    await passwordInput.fill('password123');

    console.log('Attempting to sign in...');
    await signInButton.click();

    // Wait for auth response
    await page.waitForTimeout(3000);

    // Check current state
    const currentUrl = page.url();
    console.log('Current URL after sign-in attempt:', currentUrl);

    // Look for error messages
    const errorElement = page.locator('[role="alert"], .text-destructive').first();
    if (await errorElement.isVisible()) {
      const errorText = await errorElement.textContent();
      console.log('Error message displayed:', errorText);
    }

    // Check localStorage for auth tokens
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

    console.log('localStorage contents:', JSON.stringify(localStorage, null, 2));

    // Check if we're still on the sign-in page or moved to dashboard
    const signInFormVisible = await page.locator('input[type="email"]').isVisible();
    console.log('Still on sign-in page:', signInFormVisible);

    // If we have a JWT token, test it against our backend
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

          // Test against the actual /auth/me endpoint
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

    // Wait 10 seconds to see if the app transitions to dashboard
    console.log('Waiting 10 seconds to observe app behavior...');
    await page.waitForTimeout(10000);

    // Final check
    const finalUrl = page.url();
    console.log('Final URL after 10 seconds:', finalUrl);

    const finalCheckingAuth = await checkingAuthText.isVisible();
    console.log('Still showing "Checking authentication...":', finalCheckingAuth);

    // Check if dashboard elements are visible
    const dashboardElements = page
      .locator('[data-testid="dashboard"], nav, .dashboard')
      .or(page.getByText('Users'))
      .or(page.getByText('Reports'));
    const dashboardVisible = await dashboardElements.first().isVisible();
    console.log('Dashboard elements visible:', dashboardVisible);
  });
});
