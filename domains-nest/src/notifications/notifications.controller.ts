import {
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RequestInfo } from 'src/common/types/request-info';

@Controller()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  // admin notifications

  @UseGuards(JwtAuthGuard)
  @Get('admin/notifications')
  async getAdminNotfications(
    @Req() req: RequestInfo,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    if (req.user.role == 'admin') {
      return this.notificationsService.getAdminNotfications(page, limit);
    } else {
      throw new ForbiddenException('Access denied');
    }
  }

  @UseGuards(JwtAuthGuard)
  @Delete('admin/notifications')
  async deleteAdminNotfications(@Req() req: RequestInfo) {
    if (req.user.role == 'admin') {
      return this.notificationsService.deleteAdminNotfications();
    } else {
      throw new ForbiddenException('Access denied');
    }
  }

  // user notifications

  @UseGuards(JwtAuthGuard)
  @Get('user/notifications')
  async getUserNotfications(
    @Req() req: RequestInfo,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    if (req.user.role == 'user') {
      return this.notificationsService.getUserNotfications(
        req.user.id,
        page,
        limit,
      );
    } else {
      throw new ForbiddenException('Access denied');
    }
  }

  @UseGuards(JwtAuthGuard)
  @Delete('user/notifications')
  async deleteUserNotfications(@Req() req: RequestInfo) {
    if (req.user.role == 'user') {
      return this.notificationsService.deleteUserNotfications(req.user.id);
    } else {
      throw new ForbiddenException('Access denied');
    }
  }

  // read notification

  @UseGuards(JwtAuthGuard)
  @Put('notifications/:id/read')
  async readNotification(@Param('id') id: string) {
    return this.notificationsService.readNotification(+id);
  }
}
