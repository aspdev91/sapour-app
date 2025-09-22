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

    // Wait for authentication
    console.log('Waiting for authentication...');
    await page.waitForTimeout(5000);

    // Check if login succeeded
    const appTitle = await page.locator('text=Sapour Admin').count();
    if (appTitle > 0) {
      console.log('✅ Login successful! App loaded.');
    } else {
      console.log('❌ Login failed. Still on sign-in page or error occurred.');

      // Check for error messages
      const errorText = await page.locator('.text-destructive').textContent();
      if (errorText) {
        console.log('Error message:', errorText);
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
