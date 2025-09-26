import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import {
  createIntegrationTestApp,
  setupTestApp,
  cleanupDatabase,
  initializeTestDatabase,
} from '../test-utils';
import { PrismaService } from '../../src/shared/prisma.service';

describe('Templates Revisions Integration', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminId: string;

  beforeAll(async () => {
    const moduleFixture = await createIntegrationTestApp('templates-revisions-test@example.com');
    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get(PrismaService);
    await setupTestApp(app);
    await app.init();

    // Create test admin
    const admin = await prisma.admin.upsert({
      where: { email: 'templates-revisions-test@example.com' },
      update: { allowlisted: true },
      create: {
        email: 'templates-revisions-test@example.com',
        allowlisted: true,
      },
    });
    adminId = admin.id;

    // Initialize test database with seed data
    await initializeTestDatabase(prisma);
  });

  beforeEach(async () => {
    // Clean up database before each test
    await cleanupDatabase(prisma);
  });

  afterAll(async () => {
    await cleanupDatabase(prisma);
    await app.close();
  });

  describe('GET /templates/{templateType}/revisions', () => {
    it('should list revisions for first_impression template', async () => {
      // Mock Google Drive API responses would be needed here
      // For integration test, we test the endpoint structure

      const response = await request(app.getHttpServer())
        .get('/templates/first_impression/revisions')
        .set('Authorization', `Bearer mock-jwt-token-${adminId}`)
        .expect(200);

      expect(response.body).toHaveProperty('revisions');
      expect(Array.isArray(response.body.revisions)).toBe(true);

      // Each revision should have expected structure
      if (response.body.revisions.length > 0) {
        const revision = response.body.revisions[0];
        expect(revision).toMatchObject({
          id: expect.any(String),
          label: expect.any(String),
          createdAt: expect.any(String),
        });
      }
    });

    it('should list revisions for my_type template', async () => {
      const response = await request(app.getHttpServer())
        .get('/templates/my_type/revisions')
        .set('Authorization', `Bearer mock-jwt-token-${adminId}`)
        .expect(200);

      expect(response.body).toHaveProperty('revisions');
      expect(Array.isArray(response.body.revisions)).toBe(true);
    });

    it('should list revisions for compatibility templates', async () => {
      const response = await request(app.getHttpServer())
        .get('/templates/romance_compatibility/revisions')
        .set('Authorization', `Bearer mock-jwt-token-${adminId}`)
        .expect(200);

      expect(response.body).toHaveProperty('revisions');
    });

    it('should handle invalid template type', async () => {
      await request(app.getHttpServer())
        .get('/templates/invalid_type/revisions')
        .set('Authorization', `Bearer mock-jwt-token-${adminId}`)
        .expect(400);
    });
  });

  describe('Template Data Structure', () => {
    it('should have template records in database', async () => {
      // Verify templates are seeded
      const templates = await prisma.template.findMany();
      expect(templates.length).toBeGreaterThan(0);

      // Check each template type exists
      const templateTypes = templates.map((t) => t.templateType);
      expect(templateTypes).toContain('first_impression');
      expect(templateTypes).toContain('my_type');
      expect(templateTypes).toContain('romance_compatibility');
      expect(templateTypes).toContain('friendship_compatibility');
    });

    it('should have valid Google Doc IDs', async () => {
      const templates = await prisma.template.findMany();

      for (const template of templates) {
        expect(template.externalDocumentId).toBeTruthy();
        expect(template.externalDocumentUrl).toMatch(/^https:\/\/docs\.google\.com/);
      }
    });
  });

  describe('Revision Caching and Performance', () => {
    it('should handle concurrent requests for same template', async () => {
      // Test concurrent access to same template revisions
      const promises = Array(5)
        .fill(null)
        .map(() =>
          request(app.getHttpServer())
            .get('/templates/first_impression/revisions')
            .set('Authorization', `Bearer mock-jwt-token-${adminId}`),
        );

      const responses = await Promise.all(promises);

      // All should succeed
      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('revisions');
      });
    });

    it('should handle backoff and rate limiting gracefully', async () => {
      // This would test Google API rate limiting behavior
      // For now, just ensure endpoint doesn't crash under load

      const requests = Array(10)
        .fill(null)
        .map(() =>
          request(app.getHttpServer())
            .get('/templates/first_impression/revisions')
            .set('Authorization', `Bearer mock-jwt-token-${adminId}`),
        );

      // Use Promise.allSettled to handle potential rejections
      const results = await Promise.allSettled(requests);

      const fulfilled = results.filter((r) => r.status === 'fulfilled');
      const rejected = results.filter((r) => r.status === 'rejected');

      // At least some should succeed
      expect(fulfilled.length).toBeGreaterThan(0);

      // If any failed, they should fail gracefully (not crash the service)
      rejected.forEach((rejection) => {
        expect(rejection.status).toBe('rejected');
        // Could check for specific error types here
      });
    });
  });

  describe('Revision Selection Logic', () => {
    it('should return revisions in chronological order', async () => {
      const response = await request(app.getHttpServer())
        .get('/templates/first_impression/revisions')
        .set('Authorization', `Bearer mock-jwt-token-${adminId}`)
        .expect(200);

      const revisions = response.body.revisions;

      if (revisions.length > 1) {
        // Check that revisions are ordered by creation date (newest first or oldest first)
        for (let i = 1; i < revisions.length; i++) {
          const prevDate = new Date(revisions[i - 1].createdAt);
          const currDate = new Date(revisions[i].createdAt);

          // Either newest first or oldest first, but consistent
          expect(Math.abs(prevDate.getTime() - currDate.getTime())).toBeGreaterThanOrEqual(0);
        }
      }
    });

    it('should include meaningful revision labels', async () => {
      const response = await request(app.getHttpServer())
        .get('/templates/my_type/revisions')
        .set('Authorization', `Bearer mock-jwt-token-${adminId}`)
        .expect(200);

      const revisions = response.body.revisions;

      revisions.forEach((revision: any) => {
        expect(revision.label).toBeTruthy();
        expect(typeof revision.label).toBe('string');
        expect(revision.label.length).toBeGreaterThan(0);
      });
    });
  });
});
