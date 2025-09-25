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
    console.log(
      `[AudioAnalysis] Starting analysis for mediaId: ${mediaId}, storagePath: ${media.storagePath}`,
    );

    try {
      // Check if Hume API key is configured
      const humeApiKey = process.env.HUME_API_KEY;
      if (!humeApiKey) {
        throw new Error('HUME_API_KEY environment variable is not configured');
      }
      console.log(`[AudioAnalysis] Hume API key is configured (length: ${humeApiKey.length})`);

      // Get the audio file from Supabase storage
      const bucket = process.env.SUPABASE_STORAGE_BUCKET_AUDIO || 'user-submitted-audio';
      console.log(`[AudioAnalysis] Downloading file from Supabase: ${media.storagePath}`);
      const { data: fileData, error: downloadError } = await this.supabase.storage
        .from(bucket)
        .download(media.storagePath);

      if (downloadError) {
        console.error(`[AudioAnalysis] Supabase download error:`, downloadError);
        throw new Error(`Failed to download audio file from Supabase: ${downloadError.message}`);
      }

      if (!fileData) {
        console.error(`[AudioAnalysis] No file data returned from Supabase`);
        throw new Error('Audio file not found in storage');
      }

      // Convert blob to buffer
      console.log(`[AudioAnalysis] Converting file to buffer`);
      const buffer = Buffer.from(await fileData.arrayBuffer());
      console.log(`[AudioAnalysis] File size: ${buffer.length} bytes`);

      // Prepare form data for Hume.ai API
      const formData = new FormData();
      formData.append('file', new Blob([buffer]), 'audio.wav'); // Assuming WAV format
      console.log(`[AudioAnalysis] Prepared form data for Hume.ai API`);

      // Make request to Hume.ai Prosody API
      console.log(`[AudioAnalysis] Submitting job to Hume.ai API`);
      const response = await fetch('https://api.hume.ai/v0/batch/jobs', {
        method: 'POST',
        headers: {
          'X-Hume-Api-Key': humeApiKey,
        },
        body: formData,
      });

      console.log(
        `[AudioAnalysis] Hume.ai API response status: ${response.status} ${response.statusText}`,
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[AudioAnalysis] Hume.ai API error response:`, errorText);
        throw new Error(
          `Hume.ai API request failed: ${response.status} ${response.statusText} - ${errorText}`,
        );
      }

      const jobResponse = await response.json();
      console.log(`[AudioAnalysis] Job submitted successfully:`, jobResponse);

      const jobId = jobResponse.job_id;
      if (!jobId) {
        throw new Error('No job_id returned from Hume.ai API');
      }
      console.log(`[AudioAnalysis] Job ID: ${jobId}`);

      // Poll for job completion
      let attempts = 0;
      const maxAttempts = 30; // 5 minutes with 10s intervals

      console.log(
        `[AudioAnalysis] Starting polling for job completion (max ${maxAttempts} attempts)`,
      );

      while (attempts < maxAttempts) {
        console.log(`[AudioAnalysis] Polling attempt ${attempts + 1}/${maxAttempts}`);
        await new Promise((resolve) => setTimeout(resolve, 10000)); // Wait 10 seconds

        const statusResponse = await fetch(`https://api.hume.ai/v0/batch/jobs/${jobId}`, {
          headers: {
            'X-Hume-Api-Key': humeApiKey,
          },
        });

        if (!statusResponse.ok) {
          console.error(
            `[AudioAnalysis] Failed to check job status: ${statusResponse.status} ${statusResponse.statusText}`,
          );
          const statusErrorText = await statusResponse.text();
          console.error(`[AudioAnalysis] Status check error details:`, statusErrorText);
          throw new Error(
            `Failed to check job status: ${statusResponse.status} ${statusResponse.statusText} - ${statusErrorText}`,
          );
        }

        const statusData = await statusResponse.json();
        console.log(`[AudioAnalysis] Job status: ${JSON.stringify(statusData, null, 2)}`);

        if (statusData.state.status === 'COMPLETED') {
          console.log(`[AudioAnalysis] Job completed, fetching results`);

          // Get the results
          const resultsResponse = await fetch(
            `https://api.hume.ai/v0/batch/jobs/${jobId}/predictions`,
            {
              headers: {
                'X-Hume-Api-Key': humeApiKey,
              },
            },
          );

          if (!resultsResponse.ok) {
            console.error(
              `[AudioAnalysis] Failed to get results: ${resultsResponse.status} ${resultsResponse.statusText}`,
            );
            const resultsErrorText = await resultsResponse.text();
            console.error(`[AudioAnalysis] Results fetch error details:`, resultsErrorText);
            throw new Error(
              `Failed to get analysis results: ${resultsResponse.status} ${resultsResponse.statusText} - ${resultsErrorText}`,
            );
          }

          const results = await resultsResponse.json();
          console.log(
            `[AudioAnalysis] Analysis results received:`,
            JSON.stringify(results, null, 2),
          );

          // Extract the analysis data from the response
          // Based on test expectations, store emotions, personality, and vocal_traits
          const analysisData = {
            emotions: results.emotions || {},
            personality: results.personality || {},
            vocal_traits: results.vocal_traits || {},
            metadata: {
              jobId: jobId,
              processedAt: new Date().toISOString(),
              rawResponse: results, // Store full response for debugging
            },
          };

          console.log(`[AudioAnalysis] Updating database with successful analysis`);
          await this.prisma.media.update({
            where: { id: mediaId },
            data: {
              status: 'succeeded',
              provider: 'hume',
              model: 'prosody',
              analysisJson: analysisData,
              error: null, // Clear any previous error
            },
          });
          console.log(`[AudioAnalysis] Analysis completed successfully for mediaId: ${mediaId}`);
          return;
        } else if (statusData.state === 'FAILED') {
          const failureMessage = statusData.message || 'Job failed without specific error message';
          console.error(`[AudioAnalysis] Hume.ai job failed: ${failureMessage}`);
          console.error(`[AudioAnalysis] Full status data:`, JSON.stringify(statusData, null, 2));
          throw new Error(`Hume.ai analysis job failed: ${failureMessage}`);
        }

        attempts++;
      }

      console.error(`[AudioAnalysis] Job polling timed out after ${maxAttempts} attempts`);
      throw new Error(`Hume.ai analysis job timed out after ${maxAttempts * 10} seconds`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      const errorStack = error instanceof Error ? error.stack : undefined;

      console.error(`[AudioAnalysis] Analysis failed for mediaId ${mediaId}:`, errorMessage);
      if (errorStack) {
        console.error(`[AudioAnalysis] Error stack:`, errorStack);
      }

      // Store detailed error information
      const errorData = {
        message: errorMessage,
        timestamp: new Date().toISOString(),
        mediaId: mediaId,
        storagePath: media.storagePath,
        stack: errorStack,
      };

      await this.prisma.media.update({
        where: { id: mediaId },
        data: {
          status: 'failed',
          error: errorMessage,
          analysisJson: errorData, // Store error details in analysisJson for debugging
        },
      });

      console.log(`[AudioAnalysis] Error stored in database for mediaId: ${mediaId}`);
    }
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
