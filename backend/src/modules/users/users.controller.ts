import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  HttpCode,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { SupabaseJwtGuard } from '../auth/supabase-jwt.guard';
import { UsersService, CreateUserDto } from './users.service';

@Controller('users')
@UseGuards(SupabaseJwtGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @HttpCode(200)
  async list(
    @Query('cursor') cursor?: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    const result = await this.usersService.listUsers(cursor, limit);
    return {
      users: result.users,
      nextCursor: result.nextCursor,
      hasMore: result.hasMore,
    };
  }

  @Post()
  @HttpCode(201)
  async create(@Body() body: CreateUserDto, @Request() req: any) {
    // Get admin ID from the authenticated user (set by guard)
    const adminId = req.user.userId; // This should be mapped to admin ID
    return await this.usersService.createUser(body, adminId);
  }

  @Get(':userId')
  @HttpCode(200)
  async getById(@Param('userId') userId: string) {
    return await this.usersService.getUserById(userId);
  }
}
