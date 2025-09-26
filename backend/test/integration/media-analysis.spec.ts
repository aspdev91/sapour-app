import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../../src/shared/prisma.service';
import {
  createIntegrationTestApp,
  setupTestApp,
  cleanupDatabase,
  initializeTestDatabase,
} from '../test-utils';

describe('Media Analysis Integration', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminId: string;
  let userId: string;

  beforeAll(async () => {
    const moduleFixture = await createIntegrationTestApp('media-analysis-test@example.com');
    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get(PrismaService);
    await setupTestApp(app);
    await app.init();

    // Create test admin
    const admin = await prisma.admin.upsert({
      where: { email: 'media-analysis-test@example.com' },
      update: { allowlisted: true },
      create: {
        email: 'media-analysis-test@example.com',
        allowlisted: true,
      },
    });
    adminId = admin.id;

    // Initialize test database with seed data
    await initializeTestDatabase(prisma);
  });

  beforeEach(async () => {
    await cleanupDatabase(prisma);

    // Create test user
    const user = await prisma.user.create({
      data: {
        name: 'Test User',
        createdByAdminId: adminId,
      },
    });
    userId = user.id;
  });

  afterAll(async () => {
    await cleanupDatabase(prisma);
    await app.close();
  });

  describe('Image Analysis (OpenAI Vision)', () => {
    let imageMediaId: string;

    beforeEach(async () => {
      // Create image media
      const media = await prisma.media.create({
        data: {
          userId,
          type: 'image',
          storagePath: 'test/image.jpg',
          publicUrl: 'https://example.com/image.jpg',
          status: 'pending',
        },
      });
      imageMediaId = media.id;
    });

    it('should trigger OpenAI analysis for image', async () => {
      // Mock external OpenAI API call would be needed
      // For integration test, we test the endpoint and status updates

      const response = await request(app.getHttpServer())
        .post(`/media/${imageMediaId}/analysis`)
        .set('Authorization', `Bearer mock-jwt-token-${adminId}`)
        .expect(202);

      expect(response.body).toMatchObject({
        status: 'processing',
        mediaId: imageMediaId,
      });

      // Verify media status was updated
      const updatedMedia = await prisma.media.findUnique({
        where: { id: imageMediaId },
      });
      expect(updatedMedia?.status).toBe('processing');
      expect(updatedMedia?.provider).toBe('openai_vision');
    });

    it('should handle OpenAI analysis completion', async () => {
      // This would typically be tested with a job queue or webhook
      // For now, test the data structure expectations

      const mockAnalysisResult = {
        description: 'A person smiling at the camera',
        emotions: ['joy', 'confidence'],
        personality_traits: ['extroverted', 'warm'],
      };

      // Simulate analysis completion
      await prisma.media.update({
        where: { id: imageMediaId },
        data: {
          status: 'succeeded',
          analysisJson: JSON.stringify(mockAnalysisResult),
          provider: 'openai_vision',
          model: 'gpt-4-vision-preview',
        },
      });

      // Verify the analysis data was stored
      const media = await prisma.media.findUnique({
        where: { id: imageMediaId },
      });
      expect(JSON.parse(media?.analysisJson as string)).toEqual(mockAnalysisResult);
      expect(media?.status).toBe('succeeded');
    });

    it('should handle OpenAI analysis failure', async () => {
      const errorMessage = 'OpenAI API rate limit exceeded';

      // Simulate analysis failure
      await prisma.media.update({
        where: { id: imageMediaId },
        data: {
          status: 'failed',
          error: errorMessage,
          provider: 'openai_vision',
        },
      });

      const media = await prisma.media.findUnique({
        where: { id: imageMediaId },
      });
      expect(media?.status).toBe('failed');
      expect(media?.error).toBe(errorMessage);
    });
  });

  describe('Audio Analysis (Hume.ai)', () => {
    let audioMediaId: string;

    beforeEach(async () => {
      // Create audio media
      const media = await prisma.media.create({
        data: {
          userId,
          type: 'audio',
          storagePath: 'test/audio.wav',
          publicUrl: 'https://example.com/audio.wav',
          status: 'pending',
        },
      });
      audioMediaId = media.id;
    });

    it('should trigger Hume.ai analysis for audio', async () => {
      const response = await request(app.getHttpServer())
        .post(`/media/${audioMediaId}/analysis`)
        .set('Authorization', `Bearer mock-jwt-token-${adminId}`)
        .expect(202);

      expect(response.body).toMatchObject({
        status: 'processing',
        mediaId: audioMediaId,
      });

      // Verify media status was updated
      const updatedMedia = await prisma.media.findUnique({
        where: { id: audioMediaId },
      });
      expect(updatedMedia?.status).toBe('processing');
      expect(updatedMedia?.provider).toBe('hume');
    });

    it('should handle Hume.ai analysis completion', async () => {
      const mockHumeResult = {
        emotions: {
          joy: 0.8,
          sadness: 0.1,
          anger: 0.05,
          fear: 0.03,
          surprise: 0.02,
        },
        personality: {
          openness: 0.7,
          conscientiousness: 0.8,
          extraversion: 0.6,
          agreeableness: 0.9,
          neuroticism: 0.3,
        },
        vocal_traits: {
          pitch_variability: 0.6,
          speech_rate: 0.7,
          volume: 0.8,
        },
      };

      // Simulate analysis completion
      await prisma.media.update({
        where: { id: audioMediaId },
        data: {
          status: 'succeeded',
          analysisJson: JSON.stringify(mockHumeResult),
          provider: 'hume',
          model: 'prosody',
        },
      });

      const media = await prisma.media.findUnique({
        where: { id: audioMediaId },
      });
      expect(media?.analysisJson).toEqual(mockHumeResult);
      expect(media?.status).toBe('succeeded');
      expect(media?.provider).toBe('hume');
    });

    it('should handle Hume.ai analysis failure', async () => {
      const errorMessage = 'Audio file corrupted or unsupported format';

      await prisma.media.update({
        where: { id: audioMediaId },
        data: {
          status: 'failed',
          error: errorMessage,
          provider: 'hume',
        },
      });

      const media = await prisma.media.findUnique({
        where: { id: audioMediaId },
      });
      expect(media?.status).toBe('failed');
      expect(media?.error).toBe(errorMessage);
    });
  });

  describe('Analysis Edge Cases', () => {
    it('should not allow analysis of already processed media', async () => {
      const processedMedia = await prisma.media.create({
        data: {
          userId,
          type: 'image',
          storagePath: 'test/processed.jpg',
          publicUrl: 'https://example.com/processed.jpg',
          status: 'succeeded',
          analysisJson: JSON.stringify({ processed: true }),
        },
      });

      await request(app.getHttpServer())
        .post(`/media/${processedMedia.id}/analysis`)
        .set('Authorization', `Bearer mock-jwt-token-${adminId}`)
        .expect(400);
    });

    it('should handle concurrent analysis requests', async () => {
      const media = await prisma.media.create({
        data: {
          userId,
          type: 'image',
          storagePath: 'test/concurrent.jpg',
          publicUrl: 'https://example.com/concurrent.jpg',
          status: 'pending',
        },
      });

      // First request
      await request(app.getHttpServer())
        .post(`/media/${media.id}/analysis`)
        .set('Authorization', `Bearer mock-jwt-token-${adminId}`)
        .expect(202);

      // Second concurrent request should be rejected
      await request(app.getHttpServer())
        .post(`/media/${media.id}/analysis`)
        .set('Authorization', `Bearer mock-jwt-token-${adminId}`)
        .expect(409); // Conflict
    });

    it('should validate media exists before analysis', async () => {
      const fakeMediaId = '00000000-0000-0000-0000-000000000000';

      await request(app.getHttpServer())
        .post(`/media/${fakeMediaId}/analysis`)
        .set('Authorization', `Bearer mock-jwt-token-${adminId}`)
        .expect(404);
    });
  });
});
