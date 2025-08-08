import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { Like, Repository } from 'typeorm';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepo: Repository<Notification>,

    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  // admin notifications

  async getAdminNotfications(page = 1, limit = 10) {
    const offset = (page - 1) * limit;

    const total = await this.notificationRepo.count({
      where: {
        type: Like('admin:%'),
      },
    });

    const totalPages = Math.ceil(total / limit);

    const data = await this.notificationRepo.find({
      where: {
        type: Like('admin:%'),
      },
      relations: ['user'],
      order: {
        read: 'ASC',
        createdAt: 'DESC',
      },
      take: limit,
      skip: offset,
    });

    const unseenCount = await this.notificationRepo.count({
      where: {
        type: Like('admin:%'),
        read: false,
      },
    });

    return {
      currentPage: page,
      limit,
      unseenCount,
      totalPages,
      totalItems: total,
      data,
    };
  }

  async deleteAdminNotfications() {
    const data = await this.notificationRepo.find({
      where: {
        type: Like('admin:%'),
      },
    });

    if (data.length === 0) {
      return { message: 'No admin notifications found' };
    }

    await this.notificationRepo.remove(data);

    return { message: 'Admin notifications deleted successfully' };
  }

  // user notifications

  async getUserNotfications(userId: number, page = 1, limit = 10) {
    const offset = (page - 1) * limit;

    const total = await this.notificationRepo.count({
      where: {
        type: Like('user:%'),
        user_id: userId,
      },
    });

    const totalPages = Math.ceil(total / limit);

    const data = await this.notificationRepo.find({
      where: {
        type: Like('user:%'),
        user_id: userId,
      },
      order: {
        read: 'ASC',
        createdAt: 'DESC',
      },
      take: limit,
      skip: offset,
    });

    const unseenCount = await this.notificationRepo.count({
      where: {
        type: Like('user:%'),
        user_id: userId,
        read: false,
      },
    });

    return {
      currentPage: page,
      limit,
      unseenCount,
      totalPages,
      totalItems: total,
      data,
    };
  }

  async deleteUserNotfications(userId: number) {
    const data = await this.notificationRepo.find({
      where: {
        type: Like('user:%'),
        user_id: userId,
      },
    });

    if (data.length === 0) {
      return { message: `No User id ${userId} notifications found` };
    }

    await this.notificationRepo.remove(data);

    return { message: `User id ${userId} notifications deleted successfully` };
  }

  // read notification

  async readNotification(notificationId: number) {
    const notification = await this.notificationRepo.findOne({
      where: { id: notificationId },
    });

    if (!notification) {
      return { message: 'Notification not found' };
    }

    notification.read = true;
    await this.notificationRepo.save(notification);

    return {
      message: 'Notification marked as read successfully',
      data: notification,
    };
  }

  // send notification

  async sendNotification<T = any>({
    userId,
    event,
    message,
    room,
    data,
  }: {
    userId?: number | null;
    event: string;
    message: string;
    room: string;
    data?: T;
  }) {
    await this.notificationRepo.save({
      user_id: userId,
      type: event,
      message,
    });

    this.notificationsGateway.emitToRoom(room, event, {
      userId,
      message,
      data,
      timestamp: new Date(),
    });
  }
}
