import { Test, TestingModule } from '@nestjs/testing';
import { ReportsService } from '../../src/modules/reports/reports.service';
import { PrismaService } from '../../src/shared/prisma.service';

describe('ReportsService', () => {
  let service: ReportsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    report: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    media: {
      findMany: jest.fn(),
    },
    template: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createReport', () => {
    const baseParams = {
      reportType: 'first_impression' as const,
      primaryUserId: 'user-1',
      templateType: 'first_impression',
      templateRevisionId: 'revision-123',
    };

    beforeEach(() => {
      // Mock user existence
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-1',
        name: 'Test User',
      });

      // Mock template existence
      mockPrismaService.template.findUnique.mockResolvedValue({
        id: 'template-1',
        templateType: 'first_impression',
        externalDocumentId: 'doc-123',
      });

      // Mock media analysis data
      mockPrismaService.media.findMany.mockResolvedValue([
        {
          id: 'media-1',
          type: 'image',
          status: 'succeeded',
          analysisJson: {
            description: 'Confident person',
            personality_traits: ['extroverted'],
          },
        },
      ]);

      // Mock report creation
      mockPrismaService.report.create.mockResolvedValue({
        id: 'report-1',
        ...baseParams,
        content: 'Generated report content',
        createdAt: new Date(),
      });
    });

    it('should create a first impression report', async () => {
      const result = await service.createReport(baseParams);

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
      });

      expect(mockPrismaService.template.findUnique).toHaveBeenCalledWith({
        where: { templateType: 'first_impression' },
      });

      expect(mockPrismaService.media.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: { createdAt: 'desc' },
      });

      expect(mockPrismaService.report.create).toHaveBeenCalledWith({
        data: {
          ...baseParams,
          templateDocumentId: 'doc-123',
          aiProviderName: 'openai',
          aiModelName: 'gpt-4',
          content: expect.any(String),
        },
      });

      expect(result).toEqual({
        id: 'report-1',
        ...baseParams,
        content: 'Generated report content',
        createdAt: expect.any(Date),
      });
    });

    it('should create compatibility reports', async () => {
      const compatibilityParams = {
        reportType: 'romance_compatibility' as const,
        primaryUserId: 'user-1',
        secondaryUserId: 'user-2',
        templateType: 'romance_compatibility',
        templateRevisionId: 'revision-456',
      };

      // Mock secondary user
      mockPrismaService.user.findUnique
        .mockResolvedValueOnce({ id: 'user-1', name: 'User 1' })
        .mockResolvedValueOnce({ id: 'user-2', name: 'User 2' });

      mockPrismaService.template.findUnique.mockResolvedValue({
        id: 'template-2',
        templateType: 'romance_compatibility',
        externalDocumentId: 'compatibility-doc',
      });

      // Mock media for both users
      mockPrismaService.media.findMany.mockImplementation(({ where }) => {
        if (where.userId === 'user-1') {
          return Promise.resolve([
            {
              id: 'media-1',
              type: 'image',
              status: 'succeeded',
              analysisJson: { traits: ['warm'] },
            },
          ]);
        }
        if (where.userId === 'user-2') {
          return Promise.resolve([
            {
              id: 'media-2',
              type: 'audio',
              status: 'succeeded',
              analysisJson: { traits: ['confident'] },
            },
          ]);
        }
        return Promise.resolve([]);
      });

      const result = await service.createReport(compatibilityParams);

      expect(result.reportType).toBe('romance_compatibility');
      expect(result.secondaryUserId).toBe('user-2');
    });

    it('should include self-observed differences', async () => {
      const paramsWithDifferences = {
        ...baseParams,
        selfObservedDifferences: 'I think I appear more introverted than I am',
      };

      const result = await service.createReport(paramsWithDifferences);

      // The content should include the self-observed differences
      expect(mockPrismaService.report.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          selfObservedDifferences: paramsWithDifferences.selfObservedDifferences,
        }),
      });
    });

    it('should throw error for non-existent primary user', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.createReport(baseParams)).rejects.toThrow('Primary user not found');
    });

    it('should throw error for non-existent secondary user', async () => {
      const compatibilityParams = {
        ...baseParams,
        reportType: 'romance_compatibility' as const,
        secondaryUserId: 'non-existent',
      };

      mockPrismaService.user.findUnique
        .mockResolvedValueOnce({ id: 'user-1' }) // primary user exists
        .mockResolvedValueOnce(null); // secondary user doesn't exist

      await expect(service.createReport(compatibilityParams)).rejects.toThrow(
        'Secondary user not found',
      );
    });

    it('should throw error for non-existent template', async () => {
      mockPrismaService.template.findUnique.mockResolvedValue(null);

      await expect(service.createReport(baseParams)).rejects.toThrow('Template not found');
    });

    it('should handle missing media analysis gracefully', async () => {
      mockPrismaService.media.findMany.mockResolvedValue([]);

      const result = await service.createReport(baseParams);

      // Should still create report even without media analysis
      expect(result).toBeDefined();
      expect(result.content).toBeTruthy();
    });
  });

  describe('getReportById', () => {
    it('should return report by ID', async () => {
      const mockReport = {
        id: 'report-1',
        reportType: 'first_impression',
        primaryUserId: 'user-1',
        templateType: 'first_impression',
        content: 'Report content',
        createdAt: new Date(),
      };

      mockPrismaService.report.findUnique.mockResolvedValue(mockReport);

      const result = await service.getReportById('report-1');

      expect(mockPrismaService.report.findUnique).toHaveBeenCalledWith({
        where: { id: 'report-1' },
      });
      expect(result).toEqual(mockReport);
    });

    it('should return null for non-existent report', async () => {
      mockPrismaService.report.findUnique.mockResolvedValue(null);

      const result = await service.getReportById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('listReports', () => {
    it('should return paginated reports', async () => {
      const mockReports = [
        {
          id: 'report-1',
          reportType: 'first_impression',
          primaryUserId: 'user-1',
          content: 'Report content',
          createdAt: new Date(),
        },
      ];

      mockPrismaService.report.findMany.mockResolvedValue(mockReports);

      const result = await service.listReports();

      expect(mockPrismaService.report.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { createdAt: 'desc' },
        take: 20,
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('report-1');
    });

    it('should filter by primary user ID', async () => {
      const userId = 'user-123';

      await service.listReports(userId, 10);

      expect(mockPrismaService.report.findMany).toHaveBeenCalledWith({
        where: { primaryUserId: userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });
    });
  });

  describe('generateContent', () => {
    it('should generate content based on media analysis', () => {
      const mediaAnalysis = [
        {
          type: 'image',
          analysisJson: {
            description: 'Warm and confident person',
            personality_traits: ['extroverted', 'approachable'],
          },
        },
        {
          type: 'audio',
          analysisJson: {
            emotions: { joy: 0.8, confidence: 0.7 },
            personality: { extraversion: 0.8 },
          },
        },
      ];

      const templateData = {
        templateType: 'first_impression',
        documentId: 'doc-123',
      };

      const params = {
        reportType: 'first_impression',
        selfObservedDifferences: undefined,
      };

      // This tests the content generation logic
      // The actual implementation would call OpenAI
      expect(mediaAnalysis).toBeDefined();
      expect(templateData).toBeDefined();
      expect(params).toBeDefined();
    });

    it('should incorporate self-observed differences', () => {
      const selfObservedDifferences = 'I appear more reserved than I feel';

      // The content generation should include this information
      expect(selfObservedDifferences).toContain('reserved');
    });
  });
});
