import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from '../../src/modules/users/users.service';
import { PrismaService } from '../../src/shared/prisma.service';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: PrismaService;

  const mockPrismaService = {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('listUsers', () => {
    it('should return paginated users with default parameters', async () => {
      const mockUsers = [
        {
          id: '1',
          name: 'User 1',
          consent: true,
          createdAt: new Date(),
        },
      ];

      mockPrismaService.user.findMany.mockResolvedValue(mockUsers);

      const result = await service.listUsers();

      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { createdAt: 'desc' },
        take: 21, // limit + 1 for hasMore check
        skip: undefined,
        select: {
          id: true,
          name: true,
          consent: true,
          createdAt: true,
        },
      });
      expect(result.users).toEqual(mockUsers);
      expect(result.hasMore).toBe(false);
      expect(result.nextCursor).toBeUndefined();
    });

    it('should handle cursor pagination', async () => {
      const cursor = 'cursor-123';
      const limit = 10;

      await service.listUsers(cursor, limit);

      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith({
        where: {
          createdAt: { lt: new Date(cursor) },
        },
        orderBy: { createdAt: 'desc' },
        take: 11, // limit + 1
        skip: undefined,
        select: {
          id: true,
          name: true,
          consent: true,
          createdAt: true,
        },
      });
    });
  });

  describe('createUser', () => {
    it('should create a user with consent true', async () => {
      const createData = { name: 'New User' };
      const adminId = 'admin-123';
      const mockCreatedUser = {
        id: 'new-user-id',
        name: 'New User',
        consent: true,
        createdAt: new Date(),
        createdByAdminId: adminId,
        media: [],
        primaryReports: [],
      };

      mockPrismaService.user.create.mockResolvedValue(mockCreatedUser);

      const result = await service.createUser(createData, adminId);

      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: {
          name: createData.name,
          consent: true,
          createdByAdminId: adminId,
        },
        include: {
          media: {
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              type: true,
              storagePath: true,
              publicUrl: true,
              status: true,
              createdAt: true,
            },
          },
          primaryReports: {
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              reportType: true,
              createdAt: true,
            },
          },
        },
      });
      expect(result.id).toBe(mockCreatedUser.id);
      expect(result.name).toBe(mockCreatedUser.name);
      expect(result.consent).toBe(true);
      expect(result.createdByAdminId).toBe(adminId);
    });
  });

  describe('getUserById', () => {
    it('should return user with media and reports', async () => {
      const userId = 'user-123';
      const mockUser = {
        id: userId,
        name: 'Test User',
        consent: true,
        createdAt: new Date(),
        createdByAdminId: 'admin-123',
        media: [
          {
            id: 'media-1',
            type: 'image',
            storagePath: 'path',
            publicUrl: 'url',
            status: 'succeeded',
            createdAt: new Date(),
          },
        ],
        primaryReports: [
          {
            id: 'report-1',
            reportType: 'first_impression',
            createdAt: new Date(),
          },
        ],
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.getUserById(userId);

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        include: {
          media: {
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              type: true,
              storagePath: true,
              publicUrl: true,
              status: true,
              createdAt: true,
            },
          },
          primaryReports: {
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              reportType: true,
              createdAt: true,
            },
          },
        },
      });
      expect(result.id).toBe(userId);
      expect(result.media).toHaveLength(1);
      expect(result.reports).toHaveLength(1);
    });

    it('should throw error for non-existent user', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.getUserById('non-existent')).rejects.toThrow(
        'User with ID non-existent not found',
      );
    });
  });
});
