import { Controller, Get, HttpCode, Param } from '@nestjs/common';

@Controller('templates')
export class TemplatesController {
  @Get(':templateType/revisions')
  @HttpCode(200)
  listRevisions(@Param('templateType') templateType: string) {
    return {
      revisions: [
        { id: '1', label: `${templateType} v1`, createdAt: new Date().toISOString() },
      ],
    };
  }
}
