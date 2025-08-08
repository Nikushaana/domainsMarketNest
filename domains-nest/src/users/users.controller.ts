import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserDomainDto } from 'src/domains/dto/update-user-domain.dto';
import { createFileUploadInterceptor } from 'src/common/interceptors/file-fields.interceptor';
import { RequestInfo } from 'src/common/types/request-info';

@Controller('user')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('register')
  async register(@Body() dto: RegisterUserDto) {
    return this.usersService.register(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('')
  async getUser(@Req() req: RequestInfo) {
    if (req.user.role == 'user') {
      return this.usersService.getUser(req.user.id);
    } else {
      throw new ForbiddenException('Access denied');
    }
  }

  @UseGuards(JwtAuthGuard)
  @Put('')
  @UseInterceptors(
    createFileUploadInterceptor([
      { name: 'images', maxCount: 3 },
      { name: 'videos', maxCount: 2 },
    ]),
  )
  async updateUser(
    @Req() req: RequestInfo,
    @UploadedFiles()
    files: {
      images?: Express.Multer.File[];
      videos?: Express.Multer.File[];
    },
    @Body() updateUserDto: UpdateUserDto,
  ) {
    if (req.user.role == 'user') {
      return this.usersService.updateUser(req.user.id, updateUserDto, files);
    } else {
      throw new ForbiddenException('Access denied');
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('domains')
  async getUserDomains(
    @Req() req: RequestInfo,
    @Query('status') status?: string,
  ) {
    if (req.user.role == 'user') {
      return this.usersService.getUserDomains(req.user.id, status);
    } else {
      throw new ForbiddenException('Access denied');
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('domains/:id')
  async getUserOneDomain(
    @Req() req: RequestInfo,
    @Param('id', ParseIntPipe) id: number,
  ) {
    if (req.user.role == 'user') {
      return this.usersService.getUserOneDomain(req.user.id, id);
    } else {
      throw new ForbiddenException('Access denied');
    }
  }

  @UseGuards(JwtAuthGuard)
  @Put('domains/:id')
  @UseInterceptors(
    createFileUploadInterceptor([
      { name: 'images', maxCount: 1 },
      { name: 'videos', maxCount: 1 },
    ]),
  )
  async updateUserOneDomain(
    @Req() req: RequestInfo,
    @Param('id', ParseIntPipe) id: number,
    @UploadedFiles()
    files: {
      images?: Express.Multer.File[];
      videos?: Express.Multer.File[];
    },
    @Body() updateUserDomainDto: UpdateUserDomainDto,
  ) {
    if (req.user.role == 'user') {
      return this.usersService.updateUserOneDomain(
        req.user.id,
        id,
        updateUserDomainDto,
        files,
      );
    } else {
      throw new ForbiddenException('Access denied');
    }
  }

  @UseGuards(JwtAuthGuard)
  @Delete('domains/:id')
  async deleteUserOneDomain(
    @Req() req: RequestInfo,
    @Param('id', ParseIntPipe) id: number,
  ) {
    if (req.user.role == 'user') {
      return this.usersService.deleteUserOneDomain(req.user.id, id);
    } else {
      throw new ForbiddenException('Access denied');
    }
  }
}
