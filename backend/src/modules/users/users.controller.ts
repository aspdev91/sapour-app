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
    console.log('Creating user with email:', req.user.email);
    // Get admin ID from the database using the authenticated user's email
    const admin = await this.usersService.getAdminByEmail(req.user.email);
    console.log('Found admin:', admin);
    const result = await this.usersService.createUser(body, admin.id);
    console.log('Created user result:', result);
    return result;
  }

  @Get(':userId')
  @HttpCode(200)
  async getById(@Param('userId') userId: string) {
    return await this.usersService.getUserById(userId);
  }
}
