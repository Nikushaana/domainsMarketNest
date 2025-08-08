import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RegisterAdminDto } from './dto/register-admin.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { Admin } from './entities/admin.entity';
import * as bcrypt from 'bcrypt';
import { instanceToPlain } from 'class-transformer';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { Domain } from 'src/domains/entities/domain.entity';
import { UpdateAdminDomainDto } from 'src/domains/dto/update-admin-domain.dto';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { User } from 'src/users/entities/user.entity';
import { UpdateUserDto } from 'src/users/dto/update-user.dto';
import { UserToken } from 'src/users/entities/user-token.entity';
import { AdminToken } from './entities/admin-token.entity';
import { NotificationsService } from 'src/notifications/notifications.service';
import { NotificationsGateway } from 'src/notifications/notifications.gateway';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Admin)
    private adminRepo: Repository<Admin>,

    @InjectRepository(Domain)
    private domainRepo: Repository<Domain>,

    @InjectRepository(User)
    private userRepo: Repository<User>,

    @InjectRepository(UserToken)
    private userTokenRepo: Repository<UserToken>,

    @InjectRepository(AdminToken)
    private adminTokenRepo: Repository<AdminToken>,

    private readonly cloudinaryService: CloudinaryService,

    private notificationsService: NotificationsService,

    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  async register(dto: RegisterAdminDto) {
    const existing = await this.adminRepo.findOne({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('Email is already in use');

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const admin = this.adminRepo.create({ ...dto, password: hashedPassword });
    await this.adminRepo.save(admin);

    return { message: 'Admin registered successfully', admin };
  }

  async getAdmin(adminId: number) {
    const findAdmin = await this.adminRepo.findOne({
      where: { id: adminId },
    });

    if (!findAdmin) throw new NotFoundException('Admin don`t exists');

    return instanceToPlain(findAdmin);
  }

  async updateAdmin(adminId: number, updateAdminDto: UpdateAdminDto) {
    const findAdmin = await this.adminRepo.findOne({
      where: { id: adminId },
    });

    const existing = await this.adminRepo.findOne({
      where: { email: updateAdminDto.email, id: Not(adminId) },
    });
    if (existing) throw new ConflictException('Email is already in use');

    if (!findAdmin) throw new NotFoundException('Admin don`t exists');

    if (updateAdminDto.password) {
      updateAdminDto.password = await bcrypt.hash(updateAdminDto.password, 10);
    }

    const updatedAdmin = this.adminRepo.merge(findAdmin, updateAdminDto);
    await this.adminRepo.save(updatedAdmin);

    return {
      message: 'Admin updated successfully',
      user: instanceToPlain(updatedAdmin),
    };
  }

  // admin domains

  async getAdminDomains(status: string | undefined) {
    const findDomains = await this.domainRepo.find({
      where: {
        ...(status === '0' || status === '1'
          ? { status: parseInt(status) }
          : {}),
      },
      order: { createdAt: 'DESC' },
      relations: ['user'],
    });

    return instanceToPlain(findDomains);
  }

  async getAdminOneDomain(domainId: number) {
    const findOneDomain = await this.domainRepo.findOne({
      where: {
        id: domainId,
      },
      relations: ['user'],
    });

    if (!findOneDomain) {
      throw new NotFoundException('Domain not found');
    }

    return { domains: instanceToPlain(findOneDomain) };
  }

  async updateAdminOneDomain(
    domainId: number,
    updateAdminDomainDto: UpdateAdminDomainDto,
    files?: {
      images?: Express.Multer.File[];
      videos?: Express.Multer.File[];
    },
  ) {
    const findOneDomain = await this.domainRepo.findOne({
      where: {
        id: domainId,
      },
      relations: ['user'],
    });

    if (!findOneDomain) {
      throw new NotFoundException('Domain not found or not owned by user');
    }

    // Delete selected images by public_id
    let deletedImages: string[] = [];

    if (updateAdminDomainDto.deletedImages) {
      try {
        const parsed: unknown = JSON.parse(updateAdminDomainDto.deletedImages);

        if (
          Array.isArray(parsed) &&
          parsed.every((v) => typeof v === 'string')
        ) {
          deletedImages = parsed;
        } else {
          throw new Error('Invalid format for deletedImages');
        }
      } catch (error) {
        console.log(error);

        throw new BadRequestException('Invalid format for deletedImages');
      }
    }

    if (deletedImages.length) {
      await Promise.all(
        deletedImages.map((public_id) =>
          this.cloudinaryService.deleteFile(public_id, 'image'),
        ),
      );
      findOneDomain.images = (findOneDomain.images || []).filter(
        (img) => !deletedImages.includes(img.public_id),
      );
    }

    // Delete selected videos by public_id
    let deletedVideos: string[] = [];

    if (updateAdminDomainDto.deletedVideos) {
      try {
        const parsed: unknown = JSON.parse(updateAdminDomainDto.deletedVideos);

        if (
          Array.isArray(parsed) &&
          parsed.every((v) => typeof v === 'string')
        ) {
          deletedVideos = parsed;
        } else {
          throw new Error('Invalid format for deletedVideos');
        }
      } catch (error) {
        console.log(error);

        throw new BadRequestException('Invalid format for deletedVideos');
      }
    }

    if (deletedVideos.length > 0) {
      await Promise.all(
        deletedVideos.map((public_id) =>
          this.cloudinaryService.deleteFile(public_id, 'video'),
        ),
      );
      findOneDomain.videos = (findOneDomain.videos || []).filter(
        (vid) => !deletedVideos.includes(vid.public_id),
      );
    }

    // Upload new images
    if (files?.images?.length) {
      const totalImages =
        files.images.length + (findOneDomain.images?.length || 0);
      if (totalImages > 1) {
        throw new BadRequestException('You can upload a maximum of 1 images');
      }
      const uploadedImages = await Promise.all(
        files.images.map((file) => this.cloudinaryService.uploadImage(file)),
      );
      findOneDomain.images = [
        ...(findOneDomain.images || []),
        ...uploadedImages,
      ];
    }

    // Upload new videos
    if (files?.videos?.length) {
      const totalVideos =
        files.videos.length + (findOneDomain.videos?.length || 0);
      if (totalVideos > 1) {
        throw new BadRequestException('You can upload a maximum of 1 videos');
      }
      const uploadedVideos = await Promise.all(
        files.videos.map((file) => this.cloudinaryService.uploadVideo(file)),
      );
      findOneDomain.videos = [
        ...(findOneDomain.videos || []),
        ...uploadedVideos,
      ];
    }

    // Send notification to admin
    await this.notificationsService.sendNotification({
      room: 'admin',
      event: 'admin:domain_updated_by_admin',
      userId: findOneDomain.user?.id,
      message: `${
        findOneDomain.user?.id ? `User ${findOneDomain.user?.id}'s` : "Guest's"
      } Domain "${findOneDomain.name}" was ${
        updateAdminDomainDto.status != findOneDomain.status
          ? updateAdminDomainDto.status == 1
            ? 'Verified'
            : 'Blocked'
          : 'Updated'
      } by admin.`,
      data: findOneDomain,
    });

    // Send notification to user if exists
    await this.notificationsService.sendNotification({
      room: `user_${findOneDomain.user?.id}`,
      event: 'user:domain_updated_by_admin',
      userId: findOneDomain.user?.id,
      message: `Your domain "${findOneDomain.name}" was
         ${
           updateAdminDomainDto.status != findOneDomain.status
             ? updateAdminDomainDto.status == 1
               ? 'Verified'
               : 'Blocked'
             : 'Updated'
         }
        by Admin.`,
      data: findOneDomain,
    });

    const updatedDomain = this.domainRepo.merge(
      findOneDomain,
      updateAdminDomainDto,
    );
    await this.domainRepo.save(updatedDomain);

    return {
      message: 'domain updated successfully',
      domain: updatedDomain,
    };
  }

  async deleteAdminOneDomain(domainId: number) {
    const findOneDomain = await this.domainRepo.findOne({
      where: {
        id: domainId,
      },
      relations: ['user'],
    });

    if (!findOneDomain) {
      throw new NotFoundException('Domain not found');
    }

    // Delete associated images from Cloudinary
    if (findOneDomain.images?.length) {
      await Promise.all(
        findOneDomain.images.map((img) =>
          this.cloudinaryService.deleteFile(img.public_id, 'image'),
        ),
      );
    }

    // Delete associated videos from Cloudinary
    if (findOneDomain.videos?.length) {
      await Promise.all(
        findOneDomain.videos.map((vid) =>
          this.cloudinaryService.deleteFile(vid.public_id, 'video'),
        ),
      );
    }

    // Send notification to admin
    await this.notificationsService.sendNotification({
      room: 'admin',
      event: 'admin:domain_deleted_by_admin',
      userId: findOneDomain.user?.id,
      message: `${
        findOneDomain.user?.id ? `User ${findOneDomain.user?.id}'s` : "Guest's"
      } Domain "${findOneDomain.name}" was deleted by admin.`,
      data: findOneDomain,
    });

    // Send notification to user if exists
    await this.notificationsService.sendNotification({
      room: `user_${findOneDomain.user?.id}`,
      event: 'user:domain_deleted_by_admin',
      userId: findOneDomain.user?.id,
      message: `Your domain "${findOneDomain.name}" was deleted by Admin.`,
      data: findOneDomain,
    });

    // Delete the domain from the database
    await this.domainRepo.remove(findOneDomain);

    return {
      message: 'Domain deleted successfully',
      domains: instanceToPlain(findOneDomain),
    };
  }

  // admin domains
  // admin users

  async getAdminUsers() {
    const users = await this.userRepo.find({
      order: { createdAt: 'DESC' },
    });

    const onlineUserIds = this.notificationsGateway.getOnlineUsers();

    const usersWithOnlineStatus = users.map((user) => ({
      ...instanceToPlain(user),
      online: onlineUserIds.includes(user.id),
    }));

    return {
      users: usersWithOnlineStatus,
      onlineUsers: onlineUserIds,
    };
  }

  async getAdminOneUser(userId: number) {
    const findOneUser = await this.userRepo.findOne({
      where: {
        id: userId,
      },
    });

    if (!findOneUser) {
      throw new NotFoundException('User not found');
    }

    return instanceToPlain(findOneUser);
  }

  async updateAdminOneUser(
    userId: number,
    updateUserDto: UpdateUserDto,
    files?: {
      images?: Express.Multer.File[];
      videos?: Express.Multer.File[];
    },
  ) {
    const findOneUser = await this.userRepo.findOne({
      where: {
        id: userId,
      },
    });

    if (!findOneUser) {
      throw new NotFoundException('User don`t exists');
    }

    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    // Delete selected images by public_id
    let deletedImages: string[] = [];

    if (updateUserDto.deletedImages) {
      try {
        const parsed: unknown = JSON.parse(updateUserDto.deletedImages);

        if (
          Array.isArray(parsed) &&
          parsed.every((v) => typeof v === 'string')
        ) {
          deletedImages = parsed;
        } else {
          throw new Error('Invalid format for deletedImages');
        }
      } catch (error) {
        console.log(error);

        throw new BadRequestException('Invalid format for deletedImages');
      }
    }

    if (deletedImages.length) {
      await Promise.all(
        deletedImages.map((public_id) =>
          this.cloudinaryService.deleteFile(public_id, 'image'),
        ),
      );
      findOneUser.images = (findOneUser.images || []).filter(
        (img) => !deletedImages.includes(img.public_id),
      );
    }

    // Delete selected videos by public_id
    let deletedVideos: string[] = [];

    if (updateUserDto.deletedVideos) {
      try {
        const parsed: unknown = JSON.parse(updateUserDto.deletedVideos);

        if (
          Array.isArray(parsed) &&
          parsed.every((v) => typeof v === 'string')
        ) {
          deletedVideos = parsed;
        } else {
          throw new Error('Invalid format for deletedVideos');
        }
      } catch (error) {
        console.log(error);

        throw new BadRequestException('Invalid format for deletedVideos');
      }
    }

    if (deletedVideos.length > 0) {
      await Promise.all(
        deletedVideos.map((public_id) =>
          this.cloudinaryService.deleteFile(public_id, 'video'),
        ),
      );
      findOneUser.videos = (findOneUser.videos || []).filter(
        (vid) => !deletedVideos.includes(vid.public_id),
      );
    }

    // Upload new images
    if (files?.images?.length) {
      const totalImages =
        files.images.length + (findOneUser.images?.length || 0);
      if (totalImages > 3) {
        throw new BadRequestException('You can upload a maximum of 3 images');
      }
      const uploadedImages = await Promise.all(
        files.images.map((file) => this.cloudinaryService.uploadImage(file)),
      );
      findOneUser.images = [...(findOneUser.images || []), ...uploadedImages];
    }

    // Upload new videos
    if (files?.videos?.length) {
      const totalVideos =
        files.videos.length + (findOneUser.videos?.length || 0);
      if (totalVideos > 2) {
        throw new BadRequestException('You can upload a maximum of 2 videos');
      }
      const uploadedVideos = await Promise.all(
        files.videos.map((file) => this.cloudinaryService.uploadVideo(file)),
      );
      findOneUser.videos = [...(findOneUser.videos || []), ...uploadedVideos];
    }

    const updatedUser = this.userRepo.merge(findOneUser, updateUserDto);
    await this.userRepo.save(updatedUser);

    return {
      message: 'user updated successfully',
      domain: updatedUser,
    };
  }

  async deleteAdminOneUser(userId: number) {
    const findOneUser = await this.userRepo.findOne({
      where: {
        id: userId,
      },
    });

    if (!findOneUser) {
      throw new NotFoundException('User not found');
    }

    // Delete associated images from Cloudinary
    if (findOneUser.images?.length) {
      await Promise.all(
        findOneUser.images.map((img) =>
          this.cloudinaryService.deleteFile(img.public_id, 'image'),
        ),
      );
    }

    // Delete associated videos from Cloudinary
    if (findOneUser.videos?.length) {
      await Promise.all(
        findOneUser.videos.map((vid) =>
          this.cloudinaryService.deleteFile(vid.public_id, 'video'),
        ),
      );
    }

    // Delete the domain from the database
    await this.userRepo.remove(findOneUser);

    return {
      message: 'User deleted successfully',
      domains: instanceToPlain(findOneUser),
    };
  }

  // admin users
  // admins

  async getAdmins() {
    const findAdmins = await this.adminRepo.find({
      order: { createdAt: 'DESC' },
    });

    return instanceToPlain(findAdmins);
  }

  async getOneAdmin(adminId: number) {
    const findOneAdmin = await this.adminRepo.findOne({
      where: {
        id: adminId,
      },
    });

    if (!findOneAdmin) {
      throw new NotFoundException('Admin not found');
    }

    return instanceToPlain(findOneAdmin);
  }

  async updateOneAdmin(adminId: number, updateAdminDto: UpdateAdminDto) {
    const findOneAdmin = await this.adminRepo.findOne({
      where: { id: adminId },
    });

    const existing = await this.adminRepo.findOne({
      where: { email: updateAdminDto.email, id: Not(adminId) },
    });
    if (existing) throw new ConflictException('Email is already in use');

    if (!findOneAdmin) throw new NotFoundException('Admin don`t exists');

    if (updateAdminDto.password) {
      updateAdminDto.password = await bcrypt.hash(updateAdminDto.password, 10);
    }

    const updatedOneAdmin = this.adminRepo.merge(findOneAdmin, updateAdminDto);
    await this.adminRepo.save(updatedOneAdmin);

    return {
      message: 'Admin updated successfully',
      user: instanceToPlain(updatedOneAdmin),
    };
  }

  async deleteOneAdmin(adminId: number) {
    const findOneAdmin = await this.adminRepo.findOne({
      where: {
        id: adminId,
      },
    });

    if (!findOneAdmin) {
      throw new NotFoundException('Admin not found');
    }

    // Delete the admin from the database
    await this.adminRepo.remove(findOneAdmin);

    return {
      message: 'Admin deleted successfully',
      domains: instanceToPlain(findOneAdmin),
    };
  }

  // admins
  // tokens

  async getAdminTokens() {
    const findAdminTokens = await this.adminTokenRepo.find({
      order: { created_at: 'DESC' },
    });

    return instanceToPlain(findAdminTokens);
  }

  async deleteOneAdminToken(adminTokenId: number) {
    const findOneAdminToken = await this.adminTokenRepo.findOne({
      where: {
        id: adminTokenId,
      },
    });

    if (!findOneAdminToken) {
      throw new NotFoundException('Admin Token not found');
    }

    // Delete the admin token from the database
    await this.adminTokenRepo.remove(findOneAdminToken);

    return {
      message: 'Admin Token deleted successfully',
      token: findOneAdminToken,
    };
  }

  async getUserTokens() {
    const findUserTokens = await this.userTokenRepo.find({
      order: { created_at: 'DESC' },
    });

    return instanceToPlain(findUserTokens);
  }

  async deleteOneUserToken(userTokenId: number) {
    const findOneUserToken = await this.userTokenRepo.findOne({
      where: {
        id: userTokenId,
      },
    });

    if (!findOneUserToken) {
      throw new NotFoundException('User Token not found');
    }

    // Delete the user token from the database
    await this.userTokenRepo.remove(findOneUserToken);

    return {
      message: 'User Token deleted successfully',
      token: findOneUserToken,
    };
  }

  // tokens
}
