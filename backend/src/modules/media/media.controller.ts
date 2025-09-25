import { Body, Controller, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
import { SupabaseJwtGuard } from '../auth/supabase-jwt.guard';
import { MediaService, CreateMediaDto } from './media.service';

@Controller('media')
@UseGuards(SupabaseJwtGuard)
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post()
  @HttpCode(201)
  async createMedia(@Body() body: CreateMediaDto) {
    const result = await this.mediaService.createMediaAfterUpload(body);
    return {
      mediaId: result.mediaId,
      status: 'processing',
    };
  }

  @Post(':mediaId/analysis')
  @HttpCode(202)
  async triggerAnalysis(@Param('mediaId') mediaId: string) {
    await this.mediaService.triggerAnalysis(mediaId);
    return { status: 'processing', mediaId };
  }
}
