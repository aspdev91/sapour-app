import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ExecutionContext } from '@nestjs/common';
import { AppModule } from '../src/modules/app/app.module';
import { AuthService } from '../src/modules/auth/auth.service';
import { SupabaseJwtGuard } from '../src/modules/auth/supabase-jwt.guard';
import { PrismaService } from '../src/shared/prisma.service';
import { MediaService } from '../src/modules/media/media.service';
import { ReportsService } from '../src/modules/reports/reports.service';

// Mock Prisma client
const mockPrismaClient = {
  user: {
    findMany: async () => [],
    findUnique: async () => ({
      id: 'test-user-id',
      name: 'Test User',
      email: 'test@example.com',
      consent: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdByAdminId: 'test-admin-id',
      media: [],
      reports: [],
    }),
    create: async () => ({
      id: 'test-user-id',
      name: 'Test User',
      email: 'test@example.com',
      consent: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdByAdminId: 'test-admin-id',
      media: [],
      reports: [],
    }),
  },
  media: {
    findUnique: async () => ({
      id: 'test-media-id',
      userId: 'test-user-id',
      type: 'IMAGE',
      status: 'PENDING',
      provider: 'SUPABASE',
      url: 'https://example.com/test.jpg',
      analysisJson: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    create: async () => ({
      id: 'test-media-id',
      userId: 'test-user-id',
      type: 'IMAGE',
      status: 'PENDING',
      provider: 'SUPABASE',
      url: 'https://example.com/test.jpg',
      analysisJson: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    update: async () => ({
      id: 'test-media-id',
      userId: 'test-user-id',
      type: 'IMAGE',
      status: 'ANALYZING',
      provider: 'SUPABASE',
      url: 'https://example.com/test.jpg',
      analysisJson: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
  },
  report: {
    findUnique: async () => ({
      id: 'test-report-id',
      primaryUserId: 'test-user-id',
      templateType: 'first_impression',
      templateRevisionId: '1',
      content: 'Test report content',
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    create: async () => ({
      id: 'test-report-id',
      primaryUserId: 'test-user-id',
      templateType: 'first_impression',
      templateRevisionId: '1',
      content: 'Test report content',
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
  },
  admin: {
    findUnique: async () => ({
      id: 'test-admin-id',
      email: 'test@example.com',
      allowlisted: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    create: async () => ({
      id: 'test-admin-id',
      email: 'test@example.com',
      allowlisted: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    update: async () => ({
      id: 'test-admin-id',
      email: 'test@example.com',
      allowlisted: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
  },
  template: {
    findMany: async () => [
      {
        id: 'test-template-id',
        name: 'Test Template',
        type: 'first_impression',
        content: 'Test template content',
        description: 'Test template description',
        status: 'draft',
        latestPublishedVersionId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    findUnique: async () => ({
      id: 'test-template-id',
      name: 'Test Template',
      type: 'first_impression',
      content: 'Test template content',
      description: 'Test template description',
      status: 'draft',
      latestPublishedVersionId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    create: async () => ({
      id: 'test-template-id',
      name: 'Test Template',
      type: 'first_impression',
      content: 'Test template content',
      description: 'Test template description',
      status: 'draft',
      latestPublishedVersionId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    update: async () => ({
      id: 'test-template-id',
      name: 'Updated Template',
      type: 'first_impression',
      content: 'Updated template content',
      description: 'Updated template description',
      status: 'draft',
      latestPublishedVersionId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    upsert: async () => ({
      id: 'test-template-id',
      templateType: 'first_impression',
      externalDocumentId: '1BxqQ8vz_test_doc_1',
      externalDocumentUrl: 'https://docs.google.com/document/d/1BxqQ8vz_test_doc_1',
      createdAt: new Date(),
    }),
  },
  templateVersion: {
    findMany: async () => [
      {
        id: 'test-version-id',
        templateId: 'test-template-id',
        versionNumber: 1,
        versionName: 'v1.0.0',
        content: 'Test version content',
        changelog: 'Initial version',
        isPublished: true,
        publishedAt: new Date(),
        createdAt: new Date(),
      },
    ],
    findUnique: async () => ({
      id: 'test-version-id',
      templateId: 'test-template-id',
      versionNumber: 1,
      versionName: 'v1.0.0',
      content: 'Test version content',
      changelog: 'Initial version',
      isPublished: true,
      publishedAt: new Date(),
      createdAt: new Date(),
    }),
    create: async () => ({
      id: 'test-version-id',
      templateId: 'test-template-id',
      versionNumber: 1,
      versionName: 'v1.0.0',
      content: 'Test version content',
      changelog: 'Initial version',
      isPublished: true,
      publishedAt: new Date(),
      createdAt: new Date(),
    }),
  },
};

export async function createTestApp(): Promise<TestingModule> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(AuthService)
    .useValue({
      verifyToken: async () => ({
        email: 'test@example.com',
        userId: 'test-user-id',
      }),
      checkAdminAccess: async () => true,
    })
    .overrideGuard(SupabaseJwtGuard)
    .useValue({
      canActivate: (context: ExecutionContext) => {
        const request = context.switchToHttp().getRequest();
        request.user = {
          email: 'test@example.com',
          userId: 'test-user-id',
          allowlisted: true,
        };
        return true;
      },
    })
    .overrideProvider(PrismaService)
    .useValue(mockPrismaClient)
    .overrideProvider(MediaService)
    .useValue({
      createSignedUploadUrl: async () => ({
        uploadUrl: 'https://example.com/upload-url',
        storagePath: 'test/path',
        mediaId: 'test-media-id',
      }),
      triggerAnalysis: async () => ({
        message: 'Analysis triggered',
      }),
    })
    .overrideProvider(ReportsService)
    .useValue({
      createReport: async () => ({
        id: 'test-report-id',
        primaryUserId: 'test-user-id',
        templateType: 'first_impression',
        templateRevisionId: '1',
        content: 'Test report content',
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      getReportById: async () => ({
        id: 'test-report-id',
        primaryUserId: 'test-user-id',
        templateType: 'first_impression',
        templateRevisionId: '1',
        content: 'Test report content',
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    })
    .compile();

  return moduleRef;
}

export async function setupTestApp(app: INestApplication): Promise<void> {
  // Configure app for testing
  app.setGlobalPrefix(''); // No global prefix for tests
}

export async function cleanupDatabase(prisma: PrismaService): Promise<void> {
  // Clean up test data - handle missing tables gracefully
  // Note: Don't delete admins and templates as they are created once per test suite
  try {
    await prisma.report.deleteMany();
  } catch (error) {
    // Table might not exist, continue
  }
  try {
    await prisma.media.deleteMany();
  } catch (error) {
    // Table might not exist, continue
  }
  try {
    await prisma.user.deleteMany();
  } catch (error) {
    // Table might not exist, continue
  }
  // TODO: Add cleanup for new template versioning entities after database migration
  // try {
  //   await prisma.templateVersion.deleteMany();
  // } catch (error) {
  //   // Table might not exist, continue
  // }
}

export async function initializeTestDatabase(prisma: PrismaService): Promise<void> {
  // Seed template data for integration tests
  const templates = [
    {
      templateType: 'first_impression' as const,
      externalDocumentId: '1BxqQ8vz_test_doc_1',
      externalDocumentUrl: 'https://docs.google.com/document/d/1BxqQ8vz_test_doc_1',
    },
    {
      templateType: 'my_type' as const,
      externalDocumentId: '1BxqQ8vz_test_doc_2',
      externalDocumentUrl: 'https://docs.google.com/document/d/1BxqQ8vz_test_doc_2',
    },
    {
      templateType: 'romance_compatibility' as const,
      externalDocumentId: '1BxqQ8vz_test_doc_3',
      externalDocumentUrl: 'https://docs.google.com/document/d/1BxqQ8vz_test_doc_3',
    },
    {
      templateType: 'friendship_compatibility' as const,
      externalDocumentId: '1BxqQ8vz_test_doc_4',
      externalDocumentUrl: 'https://docs.google.com/document/d/1BxqQ8vz_test_doc_4',
    },
  ];

  for (const template of templates) {
    await prisma.template.upsert({
      where: { templateType: template.templateType },
      update: template,
      create: template,
    });
  }
}

export async function createIntegrationTestApp(
  adminEmail = 'test@example.com',
): Promise<TestingModule> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(AuthService)
    .useValue({
      verifyToken: async () => ({
        email: adminEmail,
        userId: 'test-user-id',
      }),
      checkAdminAccess: async () => true,
    })
    .overrideGuard(SupabaseJwtGuard)
    .useValue({
      canActivate: (context: ExecutionContext) => {
        const request = context.switchToHttp().getRequest();
        request.user = {
          email: adminEmail,
          userId: 'test-user-id',
          allowlisted: true,
        };
        return true;
      },
    })
    // Note: Not overriding PrismaService - using real database for integration tests
    .compile();

  return moduleRef;
}
