import { Test, TestingModule } from '@nestjs/testing';
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
};

export async function createTestApp(): Promise<TestingModule> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(AuthService)
    .useValue({
      verifyJwtAndGetUser: async () => ({
        email: 'test@example.com',
        userId: 'test-user-id',
      }),
      checkAllowlist: async () => ({
        email: 'test@example.com',
        allowlisted: true,
      }),
      verifyTokenAndCheckAllowlist: async () => ({
        email: 'test@example.com',
        userId: 'test-user-id',
        allowlisted: true,
      }),
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
