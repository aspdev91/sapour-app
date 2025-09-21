import { Body, Controller, HttpCode, Param, Post } from '@nestjs/common';

@Controller('media')
export class MediaController {
  @Post('signed-url')
  @HttpCode(201)
  signedUrl(
    @Body()
    body: {
      userId: string;
      type: 'image' | 'audio';
      contentType: string;
    },
  ) {
    return {
      uploadUrl: 'https://storage.supabase.fake/upload',
      storagePath: `uploads/${body.userId}/file`,
    };
  }

  @Post(':mediaId/analysis')
  @HttpCode(202)
  triggerAnalysis(@Param('mediaId') mediaId: string) {
    return { status: 'started', mediaId };
  }
}
