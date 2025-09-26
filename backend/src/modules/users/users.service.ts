import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma.service';
import { z } from 'zod';

const CreateUserSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
});

export type CreateUserDto = z.infer<typeof CreateUserSchema>;

export interface PaginatedUsers {
  users: Array<{
    id: string;
    name: string;
    consent: boolean;
    createdAt: Date;
  }>;
  nextCursor?: string;
  hasMore: boolean;
}

export interface UserDetail {
  id: string;
  name: string;
  consent: boolean;
  createdAt: Date;
  createdByAdminId: string;
  media: Array<{
    id: string;
    type: string;
    storagePath: string;
    publicUrl?: string;
    status: string;
    createdAt: Date;
  }>;
  reports: Array<{
    id: string;
    // TODO: Update when schema migration is complete
    // templateId: string;
    // templateRevisionId: string;
    aiProviderName: string;
    aiModelName: string;
    createdAt: Date;
  }>;
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getAdminByEmail(email: string) {
    const admin = await this.prisma.admin.findUnique({
      where: { email },
    });

    if (!admin) {
      throw new NotFoundException(`Admin with email ${email} not found`);
    }

    return admin;
  }

  async listUsers(cursor?: string, limit = 20): Promise<PaginatedUsers> {
    if (limit < 1 || limit > 100) {
      throw new BadRequestException('Limit must be between 1 and 100');
    }

    const whereClause = cursor
      ? {
          createdAt: { lt: new Date(cursor) },
        }
      : {};

    const users = await this.prisma.user.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: limit + 1, // Take one extra to check if there are more
      select: {
        id: true,
        name: true,
        consent: true,
        createdAt: true,
      },
    });

    const hasMore = users.length > limit;
    const returnUsers = hasMore ? users.slice(0, limit) : users;
    const nextCursor = hasMore
      ? returnUsers[returnUsers.length - 1].createdAt.toISOString()
      : undefined;

    return {
      users: returnUsers,
      nextCursor,
      hasMore,
    };
  }

  async createUser(data: CreateUserDto, createdByAdminId: string): Promise<UserDetail> {
    const validatedData = CreateUserSchema.parse(data);

    const user = await this.prisma.user.create({
      data: {
        name: validatedData.name,
        consent: true, // Always true on creation as per spec
        createdByAdminId,
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
            aiProviderName: true,
            aiModelName: true,
            content: true,
            createdAt: true,
          },
        },
      },
    });

    return {
      id: user.id,
      name: user.name,
      consent: user.consent,
      createdAt: user.createdAt,
      createdByAdminId: user.createdByAdminId,
      media: user.media.map((media) => ({
        ...media,
        publicUrl: media.publicUrl || undefined,
      })),
      reports: user.primaryReports,
    };
  }

  async getUserById(userId: string): Promise<UserDetail> {
    const user = await this.prisma.user.findUnique({
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
            aiProviderName: true,
            aiModelName: true,
            content: true,
            createdAt: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return {
      id: user.id,
      name: user.name,
      consent: user.consent,
      createdAt: user.createdAt,
      createdByAdminId: user.createdByAdminId,
      media: user.media.map((media) => ({
        ...media,
        publicUrl: media.publicUrl || undefined,
      })),
      reports: user.primaryReports,
    };
  }
}
