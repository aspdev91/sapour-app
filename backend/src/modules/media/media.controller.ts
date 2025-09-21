import { Body, Controller, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
import { SupabaseJwtGuard } from '../auth/supabase-jwt.guard';
import { MediaService, CreateSignedUrlDto } from './media.service';

@Controller('media')
@UseGuards(SupabaseJwtGuard)
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('signed-url')
  @HttpCode(201)
  async signedUrl(@Body() body: CreateSignedUrlDto) {
    const result = await this.mediaService.createSignedUploadUrl(body);
    return {
      uploadUrl: result.uploadUrl,
      storagePath: result.storagePath,
      mediaId: result.mediaId,
    };
  }

  @Post(':mediaId/analysis')
  @HttpCode(202)
  async triggerAnalysis(@Param('mediaId') mediaId: string) {
    await this.mediaService.triggerAnalysis(mediaId);
    return { status: 'processing', mediaId };
  }
}
