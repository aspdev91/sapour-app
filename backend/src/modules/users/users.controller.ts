import { Body, Controller, Get, Param, Post, Query, HttpCode } from '@nestjs/common';

@Controller('users')
export class UsersController {
  @Get()
  @HttpCode(200)
  list(
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return { items: [], nextCursor: null };
  }

  @Post()
  @HttpCode(201)
  create(@Body() body: { name: string }) {
    return {
      id: '00000000-0000-0000-0000-000000000000',
      name: body?.name ?? 'Unnamed',
      consent: true,
      createdAt: new Date().toISOString(),
    };
  }

  @Get(':userId')
  @HttpCode(200)
  getById(@Param('userId') userId: string) {
    return {
      id: userId,
      name: 'Test User',
      consent: true,
      createdAt: new Date().toISOString(),
      media: [],
      reports: [],
    };
  }
}
