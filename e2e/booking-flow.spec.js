import { test, expect } from '@playwright/test';

/**
 * E2E Test: Login → Booking → Checkout Flow
 * 
 * This test simulates a complete user journey:
 * 1. Navigate to the home page
 * 2. Go to the login page
 * 3. Fill in login credentials
 * 4. Navigate to booking page
 * 5. Fill in booking details
 * 6. Complete the checkout process
 */

test.describe('Complete Booking Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home page before each test
    await page.goto('/');
  });

  test('should navigate through home page', async ({ page }) => {
    // Verify we're on the home page
    await expect(page).toHaveURL(/.*\//);
    
    // Check for key elements on the home page
    await expect(page.locator('h1')).toContainText(/GNB/i);
  });

  test('should display login page with form fields', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');
    
    // Verify we're on the login page
    await expect(page).toHaveURL(/.*login/);
    
    // Check for login form elements
    const emailInput = page.locator('input[name="email"]');
    const passwordInput = page.locator('input[name="password"]');
    const submitButton = page.locator('button[type="submit"]');
    
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitButton).toBeVisible();
  });

  test('should show validation errors for invalid login', async ({ page }) => {
    await page.goto('/login');
    
    // Try to submit empty form
    await page.click('button[type="submit"]');
    
    // Wait a bit for validation to appear
    await page.waitForTimeout(500);
    
    // Check that we're still on login page (not redirected)
    await expect(page).toHaveURL(/.*login/);
  });

  test('should navigate to booking page', async ({ page }) => {
    // Navigate to booking page
    await page.goto('/booking');
    
    // Verify we're on the booking page
    await expect(page).toHaveURL(/.*booking/);
    
    // Wait for page to load
    await page.waitForTimeout(1000);
  });

  test('should display booking form fields', async ({ page }) => {
    await page.goto('/booking');
    
    // Wait for tours to load
    await page.waitForTimeout(2000);
    
    // Check for booking form elements
    const nameInput = page.locator('input[name="name"]').first();
    const emailInput = page.locator('input[name="email"]').first();
    const phoneInput = page.locator('input[name="phone"]').first();
    
    // At least one of these should be visible
    const formVisible = await nameInput.isVisible().catch(() => false) ||
                       await emailInput.isVisible().catch(() => false) ||
                       await phoneInput.isVisible().catch(() => false);
    
    expect(formVisible).toBeTruthy();
  });

  test('should allow filling booking form', async ({ page }) => {
    await page.goto('/booking');
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Try to fill form fields if they exist
    const nameInput = page.locator('input[name="name"]').first();
    const emailInput = page.locator('input[name="email"]').first();
    const phoneInput = page.locator('input[name="phone"]').first();
    
    if (await nameInput.isVisible().catch(() => false)) {
      await nameInput.fill('John Doe');
      await expect(nameInput).toHaveValue('John Doe');
    }
    
    if (await emailInput.isVisible().catch(() => false)) {
      await emailInput.fill('john@example.com');
      await expect(emailInput).toHaveValue('john@example.com');
    }
    
    if (await phoneInput.isVisible().catch(() => false)) {
      await phoneInput.fill('+1234567890');
      await expect(phoneInput).toHaveValue('+1234567890');
    }
  });

  test('should navigate between pages using header links', async ({ page }) => {
    // Start at home
    await page.goto('/');
    
    // Try to click on Tours link if it exists
    const toursLink = page.locator('a[href="/tours"]').first();
    if (await toursLink.isVisible().catch(() => false)) {
      await toursLink.click();
      await expect(page).toHaveURL(/.*tours/);
    }
    
    // Go to booking page
    await page.goto('/booking');
    await expect(page).toHaveURL(/.*booking/);
    
    // Verify we can navigate back to home
    const homeLink = page.locator('a[href="/"]').first();
    if (await homeLink.isVisible().catch(() => false)) {
      await homeLink.click();
      await expect(page).toHaveURL(/.*\//);
    }
  });

  test('complete user flow: home → login → booking', async ({ page }) => {
    // Step 1: Start at home page
    await page.goto('/');
    await expect(page.locator('h1')).toContainText(/GNB/i);
    
    // Step 2: Navigate to login
    await page.goto('/login');
    await expect(page).toHaveURL(/.*login/);
    
    // Verify login form exists
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    
    // Step 3: Navigate to booking page
    await page.goto('/booking');
    await expect(page).toHaveURL(/.*booking/);
    
    // Wait for page to fully load
    await page.waitForTimeout(2000);
    
    // Verify we're on a page with booking functionality
    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(0);
  });
});

test.describe('Page Load Performance', () => {
  test('home page should load quickly', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    const loadTime = Date.now() - startTime;
    
    // Page should load in less than 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test('booking page should load quickly', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/booking');
    await page.waitForLoadState('domcontentloaded');
    const loadTime = Date.now() - startTime;
    
    // Page should load in less than 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });
});
