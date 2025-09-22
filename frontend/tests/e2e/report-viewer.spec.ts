import { test, expect } from '@playwright/test';

test.describe('Report Viewer', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authenticated admin
    await page.addInitScript(() => {
      window.localStorage.setItem('supabase.auth.token', 'mock-jwt-token-allowlisted');
    });
  });

  test('should display report with provenance information', async ({ page }) => {
    const mockReportId = 'test-report-id';

    await page.goto(`/reports/${mockReportId}`);

    // Mock the report API response
    await page.route(`**/reports/${mockReportId}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: mockReportId,
          reportType: 'first_impression',
          primaryUserId: 'user-1',
          templateType: 'first_impression',
          templateDocumentId: 'doc-123',
          templateRevisionId: 'revision-456',
          templateRevisionLabel: 'v1.2 - Enhanced Analysis',
          aiProviderName: 'openai',
          aiModelName: 'gpt-4',
          content:
            'This person appears confident and approachable. Their warm smile suggests high extraversion and agreeableness.',
          createdAt: '2024-01-15T10:30:00Z',
        }),
      });
    });

    // Should display report title
    await expect(page.getByText('First Impression Report')).toBeVisible();

    // Should display report content
    await expect(page.getByText('This person appears confident and approachable')).toBeVisible();

    // Should display provenance information
    await expect(page.getByText('Provenance')).toBeVisible();
    await expect(page.getByText('OpenAI')).toBeVisible();
    await expect(page.getByText('gpt-4')).toBeVisible();
    await expect(page.getByText('v1.2 - Enhanced Analysis')).toBeVisible();

    // Should show creation date
    await expect(page.getByText('January 15, 2024')).toBeVisible();
  });

  test('should display compatibility report for two users', async ({ page }) => {
    const mockReportId = 'compatibility-report-id';

    await page.goto(`/reports/${mockReportId}`);

    // Mock compatibility report
    await page.route(`**/reports/${mockReportId}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: mockReportId,
          reportType: 'romance_compatibility',
          primaryUserId: 'user-alice',
          secondaryUserId: 'user-bob',
          templateType: 'romance_compatibility',
          templateDocumentId: 'compatibility-doc-789',
          templateRevisionId: 'comp-revision-101',
          templateRevisionLabel: 'v3.0 - Advanced Compatibility',
          aiProviderName: 'openai',
          aiModelName: 'gpt-4-turbo',
          content:
            'Alice and Bob show excellent romantic compatibility. Their complementary personality traits suggest a harmonious relationship with strong emotional connection.',
          createdAt: '2024-01-20T14:45:00Z',
        }),
      });
    });

    // Should display compatibility title
    await expect(page.getByText('Romance Compatibility Report')).toBeVisible();

    // Should show both users are involved
    await expect(page.getByText('Alice and Bob')).toBeVisible();

    // Should display compatibility content
    await expect(page.getByText('excellent romantic compatibility')).toBeVisible();
  });

  test('should handle report not found', async ({ page }) => {
    const fakeReportId = 'non-existent-report';

    await page.goto(`/reports/${fakeReportId}`);

    // Mock 404 response
    await page.route(`**/reports/${fakeReportId}`, async (route) => {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Report not found',
        }),
      });
    });

    // Should show error message
    await expect(page.getByText('Report not found')).toBeVisible();
  });

  test('should be read-only - no edit functionality', async ({ page }) => {
    const mockReportId = 'readonly-report-id';

    await page.goto(`/reports/${mockReportId}`);

    // Mock report response
    await page.route(`**/reports/${mockReportId}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: mockReportId,
          reportType: 'my_type',
          primaryUserId: 'user-1',
          templateType: 'my_type',
          templateDocumentId: 'my-type-doc',
          templateRevisionId: 'my-type-revision',
          aiProviderName: 'openai',
          aiModelName: 'gpt-4',
          content: 'This individual shows strong tendencies toward openness and creativity.',
          createdAt: '2024-01-10T09:15:00Z',
        }),
      });
    });

    // Should not have any edit buttons or forms
    await expect(page.locator('button:has-text("Edit")')).not.toBeVisible();
    await expect(page.locator('input')).not.toBeVisible();
    await expect(page.locator('textarea')).not.toBeVisible();

    // Content should be displayed as read-only text
    const contentElement = page.locator('text="This individual shows strong tendencies"');
    await expect(contentElement).toBeVisible();
  });

  test('should display template revision information', async ({ page }) => {
    const mockReportId = 'template-info-report';

    await page.goto(`/reports/${mockReportId}`);

    // Mock report with detailed template info
    await page.route(`**/reports/${mockReportId}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: mockReportId,
          reportType: 'first_impression_divergence',
          primaryUserId: 'user-1',
          templateType: 'first_impression_divergence',
          templateDocumentId: 'divergence-template-v2',
          templateRevisionId: 'revision-2024-01',
          templateRevisionLabel: 'January 2024 Update - Enhanced Divergence Analysis',
          aiProviderName: 'openai',
          aiModelName: 'gpt-4',
          content:
            'Analysis shows significant divergence between self-perception and external perception.',
          createdAt: '2024-01-25T16:20:00Z',
        }),
      });
    });

    // Should display detailed template revision info
    await expect(
      page.getByText('January 2024 Update - Enhanced Divergence Analysis'),
    ).toBeVisible();
    await expect(page.getByText('Template ID: divergence-template-v2')).toBeVisible();
    await expect(page.getByText('Revision: revision-2024-01')).toBeVisible();
  });

  test('should format report content properly', async ({ page }) => {
    const mockReportId = 'formatted-report';

    await page.goto(`/reports/${mockReportId}`);

    // Mock report with formatted content
    await page.route(`**/reports/${mockReportId}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: mockReportId,
          reportType: 'my_type',
          primaryUserId: 'user-1',
          templateType: 'my_type',
          templateDocumentId: 'my-type-doc',
          templateRevisionId: 'my-type-revision',
          aiProviderName: 'openai',
          aiModelName: 'gpt-4',
          content: `# Personality Analysis

## Key Traits
- **Openness**: High
- **Conscientiousness**: Medium-High
- **Extraversion**: Medium

## Summary
This individual demonstrates balanced personality traits with particular strength in openness to experience.`,
          createdAt: '2024-01-12T11:30:00Z',
        }),
      });
    });

    // Should render markdown-like formatting
    await expect(page.getByText('Personality Analysis')).toBeVisible();
    await expect(page.getByText('Key Traits')).toBeVisible();
    await expect(page.getByText('Openness: High')).toBeVisible();
    await expect(page.getByText('Summary')).toBeVisible();
  });
});
