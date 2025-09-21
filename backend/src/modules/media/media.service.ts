import {
  Injectable,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const CreateSignedUrlSchema = z.object({
  userId: z.string().uuid(),
  type: z.enum(['image', 'audio']),
  contentType: z.string().min(1),
});

export type CreateSignedUrlDto = z.infer<typeof CreateSignedUrlSchema>;

export interface SignedUrlResponse {
  uploadUrl: string;
  storagePath: string;
  mediaId: string;
}

@Injectable()
export class MediaService {
  private readonly prisma = new PrismaClient();
  private readonly supabase = createClient(
    process.env.SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  );

  async createSignedUploadUrl(data: CreateSignedUrlDto): Promise<SignedUrlResponse> {
    const validatedData = CreateSignedUrlSchema.parse(data);

    // Verify user exists
    const user = await this.prisma.user.findUnique({
      where: { id: validatedData.userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Generate unique storage path
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const bucket =
      validatedData.type === 'image'
        ? process.env.SUPABASE_STORAGE_BUCKET_IMAGES || 'images'
        : process.env.SUPABASE_STORAGE_BUCKET_AUDIO || 'audio';

    const storagePath = `${validatedData.userId}/${timestamp}-${randomSuffix}`;
    const fullPath = `${bucket}/${storagePath}`;

    try {
      // Generate signed upload URL
      const { data: urlData, error } = await this.supabase.storage
        .from(bucket)
        .createSignedUploadUrl(storagePath);

      if (error) {
            throw new InternalServerErrorException(`Failed to create signed URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // Create media record in pending state
      const media = await this.prisma.media.create({
        data: {
          userId: validatedData.userId,
          type: validatedData.type as 'image' | 'audio',
          storagePath: fullPath,
          status: 'pending',
        },
      });

      return {
        uploadUrl: urlData.signedUrl,
        storagePath: fullPath,
        mediaId: media.id,
      };
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }
      throw new InternalServerErrorException(`Storage operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async triggerAnalysis(mediaId: string): Promise<void> {
    const media = await this.prisma.media.findUnique({
      where: { id: mediaId },
    });

    if (!media) {
      throw new NotFoundException('Media not found');
    }

    if (media.status !== 'pending') {
      throw new BadRequestException(`Media is not in pending status: ${media.status}`);
    }

    try {
      // Update status to processing
      await this.prisma.media.update({
        where: { id: mediaId },
        data: { status: 'processing' },
      });

      // Trigger analysis based on media type
      if (media.type === 'image') {
        await this.triggerImageAnalysis(mediaId, media);
      } else if (media.type === 'audio') {
        await this.triggerAudioAnalysis(mediaId, media);
      }
    } catch (error) {
      // Mark as failed if analysis trigger fails
      await this.prisma.media.update({
        where: { id: mediaId },
        data: {
          status: 'failed',
                error: error instanceof Error ? error.message : 'Unknown error',
        },
      });
      throw new InternalServerErrorException(`Analysis trigger failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async triggerImageAnalysis(mediaId: string, media: any): Promise<void> {
    // TODO: Implement OpenAI Vision analysis
    // For now, simulate processing
    setTimeout(async () => {
      try {
        // Simulate OpenAI Vision call
        const mockAnalysis = {
          provider: 'openai_vision',
          model: 'gpt-4-vision-preview',
          analysis: {
            description: 'Mock image analysis result',
            objects: ['person', 'background'],
            mood: 'neutral',
            timestamp: new Date().toISOString(),
          },
        };

        await this.prisma.media.update({
          where: { id: mediaId },
          data: {
            status: 'succeeded',
            provider: 'openai_vision',
            model: 'gpt-4-vision-preview',
            analysisJson: mockAnalysis,
          },
        });
      } catch (error) {
        await this.prisma.media.update({
          where: { id: mediaId },
          data: {
            status: 'failed',
            error: `Image analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        });
      }
    }, 2000); // Simulate 2-second processing time
  }

  private async triggerAudioAnalysis(mediaId: string, media: any): Promise<void> {
    // TODO: Implement Hume.ai audio analysis
    // For now, simulate processing
    setTimeout(async () => {
      try {
        // Simulate Hume.ai call
        const mockAnalysis = {
          provider: 'hume',
          model: 'hume-voice-analysis',
          analysis: {
            emotions: [
              { name: 'joy', score: 0.7 },
              { name: 'sadness', score: 0.2 },
              { name: 'anger', score: 0.1 },
            ],
            prosody: {
              pitch: 'medium',
              pace: 'normal',
              volume: 'moderate',
            },
            timestamp: new Date().toISOString(),
          },
        };

        await this.prisma.media.update({
          where: { id: mediaId },
          data: {
            status: 'succeeded',
            provider: 'hume',
            model: 'hume-voice-analysis',
            analysisJson: mockAnalysis,
          },
        });
      } catch (error) {
        await this.prisma.media.update({
          where: { id: mediaId },
          data: {
            status: 'failed',
            error: `Audio analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        });
      }
    }, 3000); // Simulate 3-second processing time
  }

  async getMediaById(mediaId: string) {
    const media = await this.prisma.media.findUnique({
      where: { id: mediaId },
      include: {
        user: {
          select: { id: true, name: true },
        },
      },
    });

    if (!media) {
      throw new NotFoundException('Media not found');
    }

    return media;
  }
}
