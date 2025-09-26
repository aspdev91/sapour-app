const { chromium } = require('playwright');

async function testLogin() {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Capture console messages
  page.on('console', (msg) => {
    console.log('PAGE LOG:', msg.type(), msg.text());
  });

  page.on('pageerror', (error) => {
    console.log('PAGE ERROR:', error.message);
  });

  // Capture network requests and responses
  page.on('request', (request) => {
    console.log('NETWORK REQUEST:', request.method(), request.url());
    if (request.postData()) {
      console.log('REQUEST BODY:', request.postData());
    }
  });

  page.on('response', (response) => {
    console.log('NETWORK RESPONSE:', response.status(), response.url());
  });

  console.log('Navigating to app...');
  await page.goto('http://localhost:3000');

  console.log('Waiting for page to load...');
  await page.waitForTimeout(2000);

  // Check if we're on the sign-in page
  console.log('Checking page content...');
  const pageContent = await page.textContent('body');
  console.log('Page contains:', pageContent.substring(0, 500) + '...');

  const signInHeading = await page.locator('text=Sign in with your admin email').count();
  console.log('Sign-in heading count:', signInHeading);

  if (signInHeading > 0) {
    console.log('On sign-in page, entering credentials...');

    // Enter email
    await page.fill('input[type="email"]', 'mtdev91@gmail.com');
    console.log('Entered email: mtdev91@gmail.com');

    // Enter password
    await page.fill('input[type="password"]', 'tedSys-dotrod-coxme5');
    console.log('Entered password');

    // Click sign in
    await page.click('text=Sign In');
    console.log('Clicked Sign In button');

    // Wait for authentication and navigation to dashboard
    console.log('Waiting for authentication and dashboard load...');
    try {
      // Wait for either navigation to occur or timeout (similar to Playwright test)
      await Promise.race([
        page.waitForURL('**', { timeout: 5000 }).catch(() => {}), // Wait for navigation but don't fail
        page.waitForTimeout(5000), // Max wait time
      ]);
    } catch (error) {
      console.log('Navigation timeout or no navigation occurred');
    }

    // Check if login succeeded by looking for dashboard navigation elements
    // Wait up to 10 seconds for elements to appear (similar to Playwright test)
    console.log('Checking for dashboard elements...');

    try {
      await page.waitForSelector('text=Sapour Admin', { timeout: 10000 });
      console.log('Sapour Admin title found');

      await page.waitForSelector('text=Users', { timeout: 5000 });
      console.log('Users link found');

      await page.waitForSelector('text=Reports', { timeout: 5000 });
      console.log('Reports link found');

      await page.waitForSelector('text=Experiments', { timeout: 5000 });
      console.log('Experiments link found');

      console.log('✅ Login successful! Dashboard loaded with navigation elements:');
      console.log('  - Users link visible');
      console.log('  - Reports link visible');
      console.log('  - Experiments link visible');
      console.log('  - Sapour Admin title visible');
    } catch (error) {
      console.log('❌ Login failed. Dashboard elements not found within timeout.');
      console.log('❌ Login failed. Dashboard elements not found.');

      // Check if we're still on sign-in page
      const signInHeading = await page.locator('text=Sign in with your admin email').count();
      if (signInHeading > 0) {
        console.log('Still on sign-in page. Checking for error messages...');
        const errorText = await page.locator('.text-destructive').textContent();
        if (errorText) {
          console.log('Error message:', errorText);
        }
      } else {
        console.log('Not on sign-in page, but dashboard not loaded properly.');
        console.log(
          'Current page content:',
          (await page.textContent('body')).substring(0, 500) + '...',
        );
      }
    }
  } else {
    console.log('Not on sign-in page. Checking if already logged in...');

    const appTitle = await page.locator('text=Sapour Admin').count();
    if (appTitle > 0) {
      console.log('✅ Already logged in!');
    } else {
      console.log('❌ Unexpected page state');
    }
  }

  console.log('Test complete. Browser will remain open for 10 seconds...');
  await page.waitForTimeout(10000);

  await browser.close();
  console.log('Browser closed.');
}

testLogin().catch(console.error);
