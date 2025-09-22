import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import {
  createIntegrationTestApp,
  setupTestApp,
  cleanupDatabase,
  initializeTestDatabase,
} from '../test-utils';
import { PrismaService } from '../../src/shared/prisma.service';

describe('Media Upload Integration', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminId: string;
  let userId: string;

  beforeAll(async () => {
    const moduleFixture = await createIntegrationTestApp('media-upload-test@example.com');
    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get(PrismaService);
    await setupTestApp(app);
    await app.init();

    // Create test admin
    const admin = await prisma.admin.upsert({
      where: { email: 'media-upload-test@example.com' },
      update: { allowlisted: true },
      create: {
        email: 'media-upload-test@example.com',
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
    userId = 'test-user-id';
  });

  afterAll(async () => {
    await cleanupDatabase(prisma);
    await app.close();
  });

  describe('POST /users', () => {
    it('should create a new user with consent true', async () => {
      const response = await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer mock-jwt-token-${adminId}`)
        .send({
          name: 'Test User',
        })
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(String),
        name: 'Test User',
        consent: true,
        createdAt: expect.any(String),
      });

      userId = response.body.id;

      // Verify user was created in database
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });
      expect(user).toMatchObject({
        name: 'Test User',
        consent: true,
        createdByAdminId: adminId,
      });
    });
  });

  describe('POST /media/signed-url', () => {
    beforeEach(async () => {
      // Create a user first
      const user = await prisma.user.create({
        data: {
          name: 'Test User',
          createdByAdminId: adminId,
        },
      });
      userId = user.id;
    });

    it('should create signed upload URL for image', async () => {
      const response = await request(app.getHttpServer())
        .post('/media/signed-url')
        .set('Authorization', `Bearer mock-jwt-token-${adminId}`)
        .send({
          userId,
          type: 'image',
          contentType: 'image/jpeg',
        })
        .expect(201);

      expect(response.body).toMatchObject({
        uploadUrl: expect.any(String),
        storagePath: expect.any(String),
        mediaId: expect.any(String),
      });

      const { mediaId } = response.body;

      // Verify media record was created
      const media = await prisma.media.findUnique({
        where: { id: mediaId },
      });
      expect(media).toMatchObject({
        userId,
        type: 'image',
        status: 'pending',
        storagePath: expect.any(String),
      });
    });

    it('should create signed upload URL for audio', async () => {
      const response = await request(app.getHttpServer())
        .post('/media/signed-url')
        .set('Authorization', `Bearer mock-jwt-token-${adminId}`)
        .send({
          userId,
          type: 'audio',
          contentType: 'audio/wav',
        })
        .expect(201);

      const { mediaId } = response.body;

      // Verify media record was created
      const media = await prisma.media.findUnique({
        where: { id: mediaId },
      });
      expect(media).toMatchObject({
        userId,
        type: 'audio',
        status: 'pending',
        storagePath: expect.any(String),
      });
    });

    it('should fail for invalid user ID', async () => {
      const fakeUserId = '00000000-0000-0000-0000-000000000000';

      await request(app.getHttpServer())
        .post('/media/signed-url')
        .set('Authorization', `Bearer mock-jwt-token-${adminId}`)
        .send({
          userId: fakeUserId,
          type: 'image',
          contentType: 'image/jpeg',
        })
        .expect(400);
    });
  });

  describe('POST /media/:mediaId/analysis', () => {
    let mediaId: string;

    beforeEach(async () => {
      // Create user and media
      const user = await prisma.user.create({
        data: {
          name: 'Test User',
          createdByAdminId: adminId,
        },
      });
      userId = user.id;

      const media = await prisma.media.create({
        data: {
          userId,
          type: 'image',
          storagePath: 'test/path/image.jpg',
          publicUrl: 'https://example.com/image.jpg',
          status: 'pending',
        },
      });
      mediaId = media.id;
    });

    it('should trigger analysis for image media', async () => {
      // Mock external services would be needed here
      // For now, just test the endpoint structure
      const response = await request(app.getHttpServer())
        .post(`/media/${mediaId}/analysis`)
        .set('Authorization', `Bearer mock-jwt-token-${adminId}`)
        .expect(202);

      expect(response.body).toMatchObject({
        status: expect.any(String),
        mediaId,
      });
    });

    it('should trigger analysis for audio media', async () => {
      // Update media to audio type
      await prisma.media.update({
        where: { id: mediaId },
        data: { type: 'audio' },
      });

      const response = await request(app.getHttpServer())
        .post(`/media/${mediaId}/analysis`)
        .set('Authorization', `Bearer mock-jwt-token-${adminId}`)
        .expect(202);

      expect(response.body).toMatchObject({
        status: expect.any(String),
        mediaId,
      });
    });

    it('should fail for non-existent media', async () => {
      const fakeMediaId = '00000000-0000-0000-0000-000000000000';

      await request(app.getHttpServer())
        .post(`/media/${fakeMediaId}/analysis`)
        .set('Authorization', `Bearer mock-jwt-token-${adminId}`)
        .expect(404);
    });
  });
});
