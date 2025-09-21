import { Controller, Get, HttpCode, Param, UseGuards } from '@nestjs/common';
import { SupabaseJwtGuard } from '../auth/supabase-jwt.guard';
import { TemplatesService } from './templates.service';

@Controller('templates')
@UseGuards(SupabaseJwtGuard)
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Get(':templateType/revisions')
  @HttpCode(200)
  async listRevisions(@Param('templateType') templateType: string) {
    return await this.templatesService.getTemplateRevisions(templateType);
  }
}
