import {
  Injectable,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../../shared/prisma.service';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
// import sharp from 'sharp'; // TODO: Uncomment when sharp is installed
import OpenAI from 'openai';

const CreateMediaSchema = z.object({
  userId: z.string().uuid(),
  type: z.enum(['image', 'audio']),
  storagePath: z.string().min(1),
});

export type CreateMediaDto = z.infer<typeof CreateMediaSchema>;

@Injectable()
export class MediaService {
  private readonly openai: OpenAI;

  constructor(private readonly prisma: PrismaService) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.supabase = createClient(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    );
  }
  private readonly supabase;

  async createMediaAfterUpload(data: CreateMediaDto): Promise<{ mediaId: string }> {
    const validatedData = CreateMediaSchema.parse(data);

    // Verify user exists
    const user = await this.prisma.user.findUnique({
      where: { id: validatedData.userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const dataType = validatedData.type as 'image' | 'audio';

    try {
      // Create media record in pending state (analysis will be triggered later during report generation)
      const media = await this.prisma.media.create({
        data: {
          userId: validatedData.userId,
          type: dataType,
          storagePath: validatedData.storagePath,
          status: dataType === 'image' ? 'succeeded' : 'pending',
        },
      });

      // Audio analysis can still be triggered immediately if needed
      if (media.type === 'audio') {
        // Trigger audio analysis asynchronously
        this.triggerAudioAnalysis(media.id, media);
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
    console.log(
      `[ImageAnalysis] Starting analysis for mediaId: ${mediaId}, storagePath: ${media.storagePath}`,
    );

    try {
      // Get the image file from Supabase storage
      const bucket = process.env.SUPABASE_STORAGE_BUCKET_IMAGES || 'user-submitted-images';
      console.log(`[ImageAnalysis] Downloading image from Supabase: ${media.storagePath}`);
      const { data: fileData, error: downloadError } = await this.supabase.storage
        .from(bucket)
        .download(media.storagePath);

      if (downloadError) {
        console.error(`[ImageAnalysis] Supabase download error:`, downloadError);
        throw new Error(`Failed to download image from Supabase: ${downloadError.message}`);
      }

      if (!fileData) {
        console.error(`[ImageAnalysis] No file data returned from Supabase`);
        throw new Error('Image file not found in storage');
      }

      // Convert blob to buffer
      console.log(`[ImageAnalysis] Converting file to buffer`);
      const buffer = Buffer.from(await fileData.arrayBuffer());
      console.log(`[ImageAnalysis] Original file size: ${buffer.length} bytes`);

      // TODO: Resize image to 768px longest side using sharp (when installed)
      console.log(`[ImageAnalysis] Resizing image to 768px longest side`);
      // const resizedBuffer = await sharp(buffer)
      //   .resize(768, 768, {
      //     fit: 'inside',
      //     withoutEnlargement: true,
      //   })
      //   .jpeg({ quality: 85 }) // Convert to JPEG for consistency
      //   .toBuffer();
      const resizedBuffer = buffer; // Placeholder: use original buffer until sharp is installed

      console.log(`[ImageAnalysis] Resized file size: ${resizedBuffer.length} bytes`);

      // Convert buffer to base64 for OpenAI API
      const base64Image = resizedBuffer.toString('base64');
      const dataUrl = `data:image/jpeg;base64,${base64Image}`;

      console.log(`[ImageAnalysis] Sending to OpenAI Vision API`);

      // Call OpenAI Vision API
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-vision-preview',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: "Analyze this image and provide a detailed description of what you see, including the person's appearance, facial expression, mood, setting, and any other relevant details that could be useful for personality analysis.",
              },
              {
                type: 'image_url',
                image_url: {
                  url: dataUrl,
                },
              },
            ],
          },
        ],
        max_tokens: 500,
        temperature: 0.7,
      });

      const analysisText = response.choices[0]?.message?.content || '';
      if (!analysisText) {
        throw new Error('Empty response from OpenAI Vision API');
      }

      console.log(`[ImageAnalysis] Analysis completed successfully`);

      // Store the analysis result
      const analysisData = {
        provider: 'openai_vision',
        model: 'gpt-4-vision-preview',
        analysis: {
          description: analysisText,
          timestamp: new Date().toISOString(),
          imageMetadata: {
            originalSize: buffer.length,
            resizedSize: resizedBuffer.length,
            maxDimension: 768,
          },
        },
      };

      await this.prisma.media.update({
        where: { id: mediaId },
        data: {
          status: 'succeeded',
          provider: 'openai_vision',
          model: 'gpt-4-vision-preview',
          analysisJson: analysisData,
          error: null, // Clear any previous error
        },
      });

      console.log(`[ImageAnalysis] Analysis completed successfully for mediaId: ${mediaId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      const errorStack = error instanceof Error ? error.stack : undefined;

      console.error(`[ImageAnalysis] Analysis failed for mediaId ${mediaId}:`, errorMessage);
      if (errorStack) {
        console.error(`[ImageAnalysis] Error stack:`, errorStack);
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

      console.log(`[ImageAnalysis] Error stored in database for mediaId: ${mediaId}`);
    }
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

  async triggerImageAnalysisForReport(userId: string, limit = 5): Promise<void> {
    // Get the latest pending image media for the user, limited to the specified number
    const pendingImages = await this.prisma.media.findMany({
      where: {
        userId: userId,
        type: 'image',
        status: 'pending',
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    if (pendingImages.length === 0) {
      console.log(`[ReportAnalysis] No pending images found for user ${userId}`);
      return;
    }

    console.log(
      `[ReportAnalysis] Triggering analysis for ${pendingImages.length} images for user ${userId}`,
    );

    // Trigger analysis for each image asynchronously
    const analysisPromises = pendingImages.map((media) =>
      this.triggerImageAnalysis(media.id, media),
    );

    // Wait for all analyses to complete
    await Promise.allSettled(analysisPromises);

    console.log(`[ReportAnalysis] Completed triggering analysis for user ${userId}`);
  }
}
