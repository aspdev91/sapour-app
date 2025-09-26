import { Body, Controller, Get, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
import { SupabaseJwtGuard } from '../auth/supabase-jwt.guard';
import { ReportsService, CreateReportDto } from './reports.service';

@Controller('reports')
@UseGuards(SupabaseJwtGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  @HttpCode(201)
  async create(@Body() body: CreateReportDto) {
    return await this.reportsService.createReport(body);
  }

  @Get(':reportId')
  @HttpCode(200)
  async getById(@Param('reportId') reportId: string) {
    return await this.reportsService.getReportById(reportId);
  }
}
