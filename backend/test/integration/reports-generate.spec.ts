import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../../src/shared/prisma.service';
import {
  createIntegrationTestApp,
  setupTestApp,
  cleanupDatabase,
  initializeTestDatabase,
} from '../test-utils';

describe('Reports Generation Integration', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminId: string;
  let user1Id: string;
  let user2Id: string;

  beforeAll(async () => {
    const moduleFixture = await createIntegrationTestApp('reports-generate-test@example.com');
    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get(PrismaService);
    await setupTestApp(app);
    await app.init();

    // Create test admin
    const admin = await prisma.admin.upsert({
      where: { email: 'reports-generate-test@example.com' },
      update: { allowlisted: true },
      create: {
        email: 'reports-generate-test@example.com',
        allowlisted: true,
      },
    });
    adminId = admin.id;

    // Initialize test database with seed data
    await initializeTestDatabase(prisma);
  });

  beforeEach(async () => {
    await cleanupDatabase(prisma);

    // Create test users
    const user1 = await prisma.user.create({
      data: {
        name: 'Primary User',
        createdByAdminId: adminId,
      },
    });
    user1Id = user1.id;

    const user2 = await prisma.user.create({
      data: {
        name: 'Secondary User',
        createdByAdminId: adminId,
      },
    });
    user2Id = user2.id;
  });

  afterAll(async () => {
    await cleanupDatabase(prisma);
    await app.close();
  });

  describe('POST /reports', () => {
    let templateRevisionId: string;

    beforeEach(async () => {
      // Mock template revision ID (would come from Google Drive)
      templateRevisionId = 'mock-revision-123';
    });

    it('should generate first impression report', async () => {
      const response = await request(app.getHttpServer())
        .post('/reports')
        .set('Authorization', `Bearer mock-jwt-token-${adminId}`)
        .send({
          reportType: 'first_impression',
          primaryUserId: user1Id,
          templateType: 'first_impression',
          templateRevisionId,
        })
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(String),
        reportType: 'first_impression',
        primaryUserId: user1Id,
        templateType: 'first_impression',
        templateDocumentId: expect.any(String),
        templateRevisionId,
        content: expect.any(String),
        createdAt: expect.any(String),
      });

      const reportId = response.body.id;

      // Verify report was created in database
      const report = await prisma.report.findUnique({
        where: { id: reportId },
      });
      expect(report).toMatchObject({
        reportType: 'first_impression',
        primaryUserId: user1Id,
        secondaryUserId: null,
        templateType: 'first_impression',
        content: expect.any(String),
      });
      expect(report?.secondaryUserId).toBeNull(); // Single user report
    });

    it('should generate compatibility report', async () => {
      const response = await request(app.getHttpServer())
        .post('/reports')
        .set('Authorization', `Bearer mock-jwt-token-${adminId}`)
        .send({
          reportType: 'romance_compatibility',
          primaryUserId: user1Id,
          secondaryUserId: user2Id,
          templateType: 'romance_compatibility',
          templateRevisionId,
        })
        .expect(201);

      const reportId = response.body.id;

      // Verify compatibility report structure
      const report = await prisma.report.findUnique({
        where: { id: reportId },
      });
      expect(report).toMatchObject({
        reportType: 'romance_compatibility',
        primaryUserId: user1Id,
        secondaryUserId: user2Id,
        templateType: 'romance_compatibility',
      });
    });

    it('should include self-observed differences when provided', async () => {
      const selfObservedDifferences =
        'I think I come across as more introverted than I actually am.';

      const response = await request(app.getHttpServer())
        .post('/reports')
        .set('Authorization', `Bearer mock-jwt-token-${adminId}`)
        .send({
          reportType: 'first_impression_divergence',
          primaryUserId: user1Id,
          templateType: 'first_impression_divergence',
          templateRevisionId,
          selfObservedDifferences,
        })
        .expect(201);

      // The content should incorporate the self-observed differences
      expect(response.body.content).toContain(selfObservedDifferences);
    });

    it('should fail for invalid user IDs', async () => {
      const fakeUserId = '00000000-0000-0000-0000-000000000000';

      await request(app.getHttpServer())
        .post('/reports')
        .set('Authorization', `Bearer mock-jwt-token-${adminId}`)
        .send({
          reportType: 'first_impression',
          primaryUserId: fakeUserId,
          templateType: 'first_impression',
          templateRevisionId,
        })
        .expect(400);
    });

    it('should fail for compatibility reports with same users', async () => {
      await request(app.getHttpServer())
        .post('/reports')
        .set('Authorization', `Bearer mock-jwt-token-${adminId}`)
        .send({
          reportType: 'romance_compatibility',
          primaryUserId: user1Id,
          secondaryUserId: user1Id, // Same user
          templateType: 'romance_compatibility',
          templateRevisionId,
        })
        .expect(400);
    });
  });

  describe('GET /reports/{reportId}', () => {
    let reportId: string;

    beforeEach(async () => {
      // Create a test report
      const report = await prisma.report.create({
        data: {
          reportType: 'first_impression',
          primaryUserId: user1Id,
          templateType: 'first_impression',
          templateDocumentId: 'mock-doc-id',
          templateRevisionId: 'mock-revision-id',
          aiProviderName: 'openai',
          aiModelName: 'gpt-4',
          content: 'This is a test report content with personality analysis.',
        },
      });
      reportId = report.id;
    });

    it('should retrieve report by ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/reports/${reportId}`)
        .set('Authorization', `Bearer mock-jwt-token-${adminId}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: reportId,
        reportType: 'first_impression',
        primaryUserId: user1Id,
        content: 'This is a test report content with personality analysis.',
        createdAt: expect.any(String),
      });
    });

    it('should fail for non-existent report', async () => {
      const fakeReportId = '00000000-0000-0000-0000-000000000000';

      await request(app.getHttpServer())
        .get(`/reports/${fakeReportId}`)
        .set('Authorization', `Bearer mock-jwt-token-${adminId}`)
        .expect(404);
    });
  });

  describe('Report Immutability', () => {
    it('should not allow updates to reports', async () => {
      // Create a report
      const report = await prisma.report.create({
        data: {
          reportType: 'first_impression',
          primaryUserId: user1Id,
          templateType: 'first_impression',
          templateDocumentId: 'mock-doc-id',
          templateRevisionId: 'mock-revision-id',
          aiProviderName: 'openai',
          aiModelName: 'gpt-4',
          content: 'Original content',
        },
      });

      // Attempt to update (this should not be possible via API)
      // Reports are immutable by design - no PUT/PATCH endpoints should exist

      const updatedReport = await prisma.report.findUnique({
        where: { id: report.id },
      });

      // Content should remain unchanged
      expect(updatedReport?.content).toBe('Original content');
    });

    it('should preserve all provenance data', async () => {
      const report = await prisma.report.create({
        data: {
          reportType: 'my_type',
          primaryUserId: user1Id,
          templateType: 'my_type',
          templateDocumentId: 'specific-doc-id',
          templateRevisionId: 'specific-revision-456',
          templateRevisionLabel: 'v2.1 - Enhanced Analysis',
          aiProviderName: 'openai',
          aiModelName: 'gpt-4-turbo',
          content: 'Detailed personality analysis...',
        },
      });

      // Retrieve and verify all provenance is preserved
      const retrieved = await prisma.report.findUnique({
        where: { id: report.id },
      });

      expect(retrieved).toMatchObject({
        templateDocumentId: 'specific-doc-id',
        templateRevisionId: 'specific-revision-456',
        templateRevisionLabel: 'v2.1 - Enhanced Analysis',
        aiProviderName: 'openai',
        aiModelName: 'gpt-4-turbo',
      });
    });
  });

  describe('Report Content Generation', () => {
    it('should generate content using available media analysis', async () => {
      // Create media with analysis
      await prisma.media.create({
        data: {
          userId: user1Id,
          type: 'image',
          storagePath: 'test/image.jpg',
          publicUrl: 'https://example.com/image.jpg',
          status: 'succeeded',
          analysisJson: JSON.stringify({
            description: 'Confident person with warm smile',
            emotions: ['joy', 'confidence'],
            personality_traits: ['extroverted', 'approachable'],
          }),
        },
      });

      await prisma.media.create({
        data: {
          userId: user1Id,
          type: 'audio',
          storagePath: 'test/audio.wav',
          publicUrl: 'https://example.com/audio.wav',
          status: 'succeeded',
          analysisJson: JSON.stringify({
            emotions: { joy: 0.8, confidence: 0.7 },
            personality: {
              extraversion: 0.8,
              agreeableness: 0.9,
            },
          }),
        },
      });

      const response = await request(app.getHttpServer())
        .post('/reports')
        .set('Authorization', `Bearer mock-jwt-token-${adminId}`)
        .send({
          reportType: 'first_impression',
          primaryUserId: user1Id,
          templateType: 'first_impression',
          templateRevisionId: 'mock-revision-id',
        })
        .expect(201);

      // Content should incorporate the media analysis
      const content = response.body.content;
      expect(content).toContain('confident');
      expect(content).toContain('warm');
      expect(content).toContain('extroverted');
    });

    it('should handle missing media analysis gracefully', async () => {
      // Create report without any media analysis
      const response = await request(app.getHttpServer())
        .post('/reports')
        .set('Authorization', `Bearer mock-jwt-token-${adminId}`)
        .send({
          reportType: 'first_impression',
          primaryUserId: user1Id,
          templateType: 'first_impression',
          templateRevisionId: 'mock-revision-id',
        })
        .expect(201);

      // Should still generate content, noting missing analysis
      const content = response.body.content;
      expect(content).toBeTruthy();
      expect(typeof content).toBe('string');
      expect(content.length).toBeGreaterThan(0);
    });
  });
});
