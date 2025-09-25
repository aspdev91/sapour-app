import {
  Injectable,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../../shared/prisma.service';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const CreateMediaSchema = z.object({
  userId: z.string().uuid(),
  type: z.enum(['image', 'audio']),
  storagePath: z.string().min(1),
});

export type CreateMediaDto = z.infer<typeof CreateMediaSchema>;

@Injectable()
export class MediaService {
  constructor(private readonly prisma: PrismaService) {}
  private readonly supabase = createClient(
    process.env.SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  );

  async createMediaAfterUpload(data: CreateMediaDto): Promise<{ mediaId: string }> {
    const validatedData = CreateMediaSchema.parse(data);

    // Verify user exists
    const user = await this.prisma.user.findUnique({
      where: { id: validatedData.userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    try {
      // Create media record in processing state and trigger analysis
      const media = await this.prisma.media.create({
        data: {
          userId: validatedData.userId,
          type: validatedData.type as 'image' | 'audio',
          storagePath: validatedData.storagePath,
          status: 'processing',
        },
      });

      // Trigger analysis based on media type
      if (media.type === 'image') {
        await this.triggerImageAnalysis(media.id, media);
      } else if (media.type === 'audio') {
        await this.triggerAudioAnalysis(media.id, media);
      }

      return { mediaId: media.id };
    } catch (error) {
      throw new InternalServerErrorException(
        `Media creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
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
      throw new InternalServerErrorException(
        `Analysis trigger failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
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
