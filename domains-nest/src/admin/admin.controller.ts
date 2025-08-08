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
import { RegisterAdminDto } from './dto/register-admin.dto';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RequestInfo } from 'src/common/types/request-info';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { UpdateAdminDomainDto } from 'src/domains/dto/update-admin-domain.dto';
import { UpdateUserDto } from 'src/users/dto/update-user.dto';
import { createFileUploadInterceptor } from 'src/common/interceptors/file-fields.interceptor';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('register')
  async register(@Body() dto: RegisterAdminDto) {
    return this.adminService.register(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('')
  async getAdmin(@Req() req: RequestInfo) {
    if (req.user.role == 'admin') {
      return this.adminService.getAdmin(req.user.id);
    } else {
      throw new ForbiddenException('Access denied');
    }
  }

  @UseGuards(JwtAuthGuard)
  @Put('')
  async updateAdmin(
    @Req() req: RequestInfo,
    @Body() updateAdminDto: UpdateAdminDto,
  ) {
    if (req.user.role == 'admin') {
      return this.adminService.updateAdmin(req.user.id, updateAdminDto);
    } else {
      throw new ForbiddenException('Access denied');
    }
  }

  // admin domains

  @UseGuards(JwtAuthGuard)
  @Get('domains')
  async getAdminDomains(
    @Req() req: RequestInfo,
    @Query('status') status?: string,
  ) {
    if (req.user.role == 'admin') {
      return this.adminService.getAdminDomains(status);
    } else {
      throw new ForbiddenException('Access denied');
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('domains/:id')
  async getAdminOneDomain(
    @Req() req: RequestInfo,
    @Param('id', ParseIntPipe) id: number,
  ) {
    if (req.user.role == 'admin') {
      return this.adminService.getAdminOneDomain(id);
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
  async updateAdminOneDomain(
    @Req() req: RequestInfo,
    @Param('id', ParseIntPipe) id: number,
    @UploadedFiles()
    files: {
      images?: Express.Multer.File[];
      videos?: Express.Multer.File[];
    },
    @Body() updateAdminDomainDto: UpdateAdminDomainDto,
  ) {
    if (req.user.role == 'admin') {
      return this.adminService.updateAdminOneDomain(
        id,
        updateAdminDomainDto,
        files,
      );
    } else {
      throw new ForbiddenException('Access denied');
    }
  }

  @UseGuards(JwtAuthGuard)
  @Delete('domains/:id')
  async deleteAdminOneDomain(
    @Req() req: RequestInfo,
    @Param('id', ParseIntPipe) id: number,
  ) {
    if (req.user.role == 'admin') {
      return this.adminService.deleteAdminOneDomain(id);
    } else {
      throw new ForbiddenException('Access denied');
    }
  }

  // admin domains
  // admin users

  @UseGuards(JwtAuthGuard)
  @Get('users')
  async getAdminUsers(@Req() req: RequestInfo) {
    if (req.user.role == 'admin') {
      return this.adminService.getAdminUsers();
    } else {
      throw new ForbiddenException('Access denied');
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('users/:id')
  async getAdminOneUser(
    @Req() req: RequestInfo,
    @Param('id', ParseIntPipe) id: number,
  ) {
    if (req.user.role == 'admin') {
      return this.adminService.getAdminOneUser(id);
    } else {
      throw new ForbiddenException('Access denied');
    }
  }

  @UseGuards(JwtAuthGuard)
  @Put('users/:id')
  @UseInterceptors(
    createFileUploadInterceptor([
      { name: 'images', maxCount: 3 },
      { name: 'videos', maxCount: 2 },
    ]),
  )
  async updateAdminOneUser(
    @Req() req: RequestInfo,
    @Param('id', ParseIntPipe) id: number,
    @UploadedFiles()
    files: {
      images?: Express.Multer.File[];
      videos?: Express.Multer.File[];
    },
    @Body() updateUserDto: UpdateUserDto,
  ) {
    if (req.user.role == 'admin') {
      return this.adminService.updateAdminOneUser(id, updateUserDto, files);
    } else {
      throw new ForbiddenException('Access denied');
    }
  }

  @UseGuards(JwtAuthGuard)
  @Delete('users/:id')
  async deleteAdminOneUser(
    @Req() req: RequestInfo,
    @Param('id', ParseIntPipe) id: number,
  ) {
    if (req.user.role == 'admin') {
      return this.adminService.deleteAdminOneUser(id);
    } else {
      throw new ForbiddenException('Access denied');
    }
  }

  // admin users
  // admins

  @UseGuards(JwtAuthGuard)
  @Get('admins')
  async getAdmins(@Req() req: RequestInfo) {
    if (req.user.role == 'admin') {
      return this.adminService.getAdmins();
    } else {
      throw new ForbiddenException('Access denied');
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('admins/:id')
  async getOneAdmin(
    @Req() req: RequestInfo,
    @Param('id', ParseIntPipe) id: number,
  ) {
    if (req.user.role == 'admin') {
      return this.adminService.getOneAdmin(id);
    } else {
      throw new ForbiddenException('Access denied');
    }
  }

  @UseGuards(JwtAuthGuard)
  @Put('admins/:id')
  async updateOneAdmin(
    @Req() req: RequestInfo,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAdminDto: UpdateAdminDto,
  ) {
    if (req.user.role == 'admin') {
      return this.adminService.updateOneAdmin(id, updateAdminDto);
    } else {
      throw new ForbiddenException('Access denied');
    }
  }

  @UseGuards(JwtAuthGuard)
  @Delete('admins/:id')
  async deleteOneAdmin(
    @Req() req: RequestInfo,
    @Param('id', ParseIntPipe) id: number,
  ) {
    if (req.user.role == 'admin') {
      return this.adminService.deleteOneAdmin(id);
    } else {
      throw new ForbiddenException('Access denied');
    }
  }

  // admins
  // tokens

  @UseGuards(JwtAuthGuard)
  @Get('adminTokens')
  async getAdminTokens(@Req() req: RequestInfo) {
    if (req.user.role == 'admin') {
      return this.adminService.getAdminTokens();
    } else {
      throw new ForbiddenException('Access denied');
    }
  }

  @UseGuards(JwtAuthGuard)
  @Delete('adminTokens/:id')
  async deleteOneAdminToken(
    @Req() req: RequestInfo,
    @Param('id', ParseIntPipe) id: number,
  ) {
    if (req.user.role == 'admin') {
      return this.adminService.deleteOneAdminToken(id);
    } else {
      throw new ForbiddenException('Access denied');
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('userTokens')
  async getUserTokens(@Req() req: RequestInfo) {
    if (req.user.role == 'admin') {
      return this.adminService.getUserTokens();
    } else {
      throw new ForbiddenException('Access denied');
    }
  }

  @UseGuards(JwtAuthGuard)
  @Delete('userTokens/:id')
  async deleteOneUserToken(
    @Req() req: RequestInfo,
    @Param('id', ParseIntPipe) id: number,
  ) {
    if (req.user.role == 'admin') {
      return this.adminService.deleteOneUserToken(id);
    } else {
      throw new ForbiddenException('Access denied');
    }
  }

  // tokens
}
