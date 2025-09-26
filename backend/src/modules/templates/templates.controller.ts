import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  HttpCode,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { SupabaseJwtGuard } from '../auth/supabase-jwt.guard';
import { TemplatesService } from './templates.service';
import {
  CreateTemplateDto,
  UpdateTemplateDto,
  CreateRevisionDto,
  PublishRevisionDto,
  RevertTemplateDto,
} from './dto';

@Controller('templates')
@UseGuards(SupabaseJwtGuard)
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  // New database-driven template management endpoints
  @Get()
  @HttpCode(200)
  async list() {
    return await this.templatesService.listTemplates();
  }

  @Post()
  @HttpCode(201)
  async create(@Body() body: CreateTemplateDto) {
    return await this.templatesService.createTemplate(body);
  }

  @Get(':id')
  @HttpCode(200)
  async get(@Param('id') id: string) {
    return await this.templatesService.getTemplate(id);
  }

  @Put(':id')
  @HttpCode(200)
  async update(@Param('id') id: string, @Body() body: UpdateTemplateDto) {
    return await this.templatesService.updateTemplate(id, body);
  }

  @Delete(':id')
  @HttpCode(200)
  async archive(@Param('id') id: string) {
    return await this.templatesService.archiveTemplate(id);
  }

  @Post(':id/revisions')
  @HttpCode(201)
  async createRevision(@Param('id') id: string, @Body() body: CreateRevisionDto) {
    return await this.templatesService.createRevision(id, body);
  }

  @Get(':id/revisions')
  @HttpCode(200)
  async listRevisions(@Param('id') id: string) {
    return await this.templatesService.listTemplateRevisions(id);
  }

  @Post(':id/revisions/:revisionId/publish')
  @HttpCode(201)
  async publishRevision(@Param('id') id: string, @Param('revisionId') revisionId: string) {
    return await this.templatesService.publishRevision(id, { revisionId });
  }

  @Post(':id/revert')
  @HttpCode(200)
  async revert(@Param('id') id: string, @Body() body: RevertTemplateDto) {
    return await this.templatesService.revertTemplate(id, body);
  }
}
