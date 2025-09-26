import { Test, TestingModule } from '@nestjs/testing';
import { MediaService } from '../../src/modules/media/media.service';
import { PrismaService } from '../../src/shared/prisma.service';

describe('MediaService', () => {
  let service: MediaService;
  let prisma: PrismaService;

  const mockPrismaService = {
    media: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MediaService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<MediaService>(MediaService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createSignedUploadUrl', () => {
    it('should create media record and return signed URL for image', async () => {
      const params = {
        userId: 'user-123',
        type: 'image' as const,
        contentType: 'image/jpeg',
      };

      const mockMedia = {
        id: 'media-123',
        userId: params.userId,
        type: params.type,
        storagePath: 'uploads/user-123/media-123.jpg',
        publicUrl: 'https://storage.example.com/uploads/user-123/media-123.jpg',
        status: 'pending',
        createdAt: new Date(),
      };

      mockPrismaService.media.create.mockResolvedValue(mockMedia);

      const result = await service.createSignedUploadUrl(params);

      expect(mockPrismaService.media.create).toHaveBeenCalledWith({
        data: {
          userId: params.userId,
          type: params.type,
          storagePath: expect.stringContaining('uploads/user-123/'),
          publicUrl: expect.stringContaining('https://storage.example.com/'),
          status: 'pending',
        },
      });

      expect(result).toEqual({
        uploadUrl: expect.any(String),
        storagePath: mockMedia.storagePath,
        mediaId: mockMedia.id,
      });
    });

    it('should create media record for audio', async () => {
      const params = {
        userId: 'user-456',
        type: 'audio' as const,
        contentType: 'audio/wav',
      };

      const mockMedia = {
        id: 'media-456',
        userId: params.userId,
        type: params.type,
        storagePath: 'uploads/user-456/media-456.wav',
        publicUrl: 'https://storage.example.com/uploads/user-456/media-456.wav',
        status: 'pending',
        createdAt: new Date(),
      };

      mockPrismaService.media.create.mockResolvedValue(mockMedia);

      const result = await service.createSignedUploadUrl(params);

      expect(result.mediaId).toBe(mockMedia.id);
      expect(result.uploadUrl).toBeTruthy();
    });
  });

  describe('triggerAnalysis', () => {
    it('should trigger analysis for image media', async () => {
      const mediaId = 'media-123';
      const mockMedia = {
        id: mediaId,
        type: 'image',
        status: 'pending',
        storagePath: 'path/to/image.jpg',
        publicUrl: 'https://example.com/image.jpg',
      };

      mockPrismaService.media.findUnique.mockResolvedValue(mockMedia);
      mockPrismaService.media.update.mockResolvedValue({
        ...mockMedia,
        status: 'processing',
      });

      const result = await service.triggerAnalysis(mediaId);

      expect(mockPrismaService.media.findUnique).toHaveBeenCalledWith({
        where: { id: mediaId },
      });

      expect(mockPrismaService.media.update).toHaveBeenCalledWith({
        where: { id: mediaId },
        data: {
          status: 'processing',
          provider: 'openai_vision',
        },
      });

      // triggerAnalysis returns void, just verify it doesn't throw
      expect(result).toBeUndefined();
    });

    it('should trigger analysis for audio media', async () => {
      const mediaId = 'media-456';
      const mockMedia = {
        id: mediaId,
        type: 'audio',
        status: 'pending',
        storagePath: 'path/to/audio.wav',
        publicUrl: 'https://example.com/audio.wav',
      };

      mockPrismaService.media.findUnique.mockResolvedValue(mockMedia);
      mockPrismaService.media.update.mockResolvedValue({
        ...mockMedia,
        status: 'processing',
      });

      const result = await service.triggerAnalysis(mediaId);

      expect(mockPrismaService.media.update).toHaveBeenCalledWith({
        where: { id: mediaId },
        data: {
          status: 'processing',
          provider: 'hume',
        },
      });

      // triggerAnalysis returns void, just verify it doesn't throw
      expect(result).toBeUndefined();
    });

    it('should throw error for non-existent media', async () => {
      mockPrismaService.media.findUnique.mockResolvedValue(null);

      await expect(service.triggerAnalysis('non-existent')).rejects.toThrow('Media not found');
    });

    it('should throw error for already processing media', async () => {
      const mockMedia = {
        id: 'media-123',
        type: 'image',
        status: 'processing',
      };

      mockPrismaService.media.findUnique.mockResolvedValue(mockMedia);

      await expect(service.triggerAnalysis('media-123')).rejects.toThrow(
        'Analysis already in progress',
      );
    });

    it('should throw error for completed media', async () => {
      const mockMedia = {
        id: 'media-123',
        type: 'image',
        status: 'succeeded',
      };

      mockPrismaService.media.findUnique.mockResolvedValue(mockMedia);

      await expect(service.triggerAnalysis('media-123')).rejects.toThrow(
        'Analysis already completed',
      );
    });
  });

  describe('getMediaById', () => {
    it('should return media with user info', async () => {
      const mediaId = 'media-123';
      const mockMedia = {
        id: mediaId,
        userId: 'user-123',
        type: 'image',
        storagePath: 'path/to/image.jpg',
        publicUrl: 'https://example.com/image.jpg',
        status: 'succeeded',
        analysisJson: { result: 'analysis data' },
        provider: 'openai_vision',
        model: 'gpt-4-vision',
        createdAt: new Date(),
        user: {
          id: 'user-123',
          name: 'Test User',
        },
      };

      mockPrismaService.media.findUnique.mockResolvedValue(mockMedia);

      const result = await service.getMediaById(mediaId);

      expect(mockPrismaService.media.findUnique).toHaveBeenCalledWith({
        where: { id: mediaId },
        include: {
          user: {
            select: { id: true, name: true },
          },
        },
      });
      expect(result).toEqual(mockMedia);
    });

    it('should throw error for non-existent media', async () => {
      mockPrismaService.media.findUnique.mockResolvedValue(null);

      await expect(service.getMediaById('non-existent')).rejects.toThrow('Media not found');
    });
  });
});
