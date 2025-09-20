import { Body, Controller, Get, HttpCode, Param, Post } from '@nestjs/common';

@Controller('reports')
export class ReportsController {
  @Post()
  @HttpCode(201)
  create(
    @Body()
    body: {
      reportType: string;
      primaryUserId: string;
      secondaryUserId?: string;
      templateType: string;
      templateRevisionId: string;
      selfObservedDifferences?: string;
    },
  ) {
    return {
      id: '00000000-0000-0000-0000-000000000000',
      reportType: body.reportType,
      primaryUserId: body.primaryUserId,
      content: 'stub',
      createdAt: new Date().toISOString(),
    };
  }

  @Get(':reportId')
  @HttpCode(200)
  getById(@Param('reportId') reportId: string) {
    return {
      id: reportId,
      reportType: 'first_impression',
      primaryUserId: '00000000-0000-0000-0000-000000000000',
      content: 'stub',
      createdAt: new Date().toISOString(),
    };
  }
}
