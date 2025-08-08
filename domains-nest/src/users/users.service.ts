import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { RegisterUserDto } from './dto/register-user.dto';
import * as bcrypt from 'bcrypt';
import { EmailService, EmailType } from 'src/email/email.service';
import { instanceToPlain } from 'class-transformer';
import { UpdateUserDto } from './dto/update-user.dto';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { Domain } from 'src/domains/entities/domain.entity';
import { UpdateUserDomainDto } from 'src/domains/dto/update-user-domain.dto';
import { NotificationsService } from 'src/notifications/notifications.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,

    private emailService: EmailService,

    private readonly cloudinaryService: CloudinaryService,

    @InjectRepository(Domain)
    private domainRepo: Repository<Domain>,

    private notificationsService: NotificationsService,
  ) {}

  async register(dto: RegisterUserDto) {
    const existing = await this.userRepo.findOne({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('Email is already in use');

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = this.userRepo.create({ ...dto, password: hashedPassword });
    await this.userRepo.save(user);

    await this.emailService.sendEmailByType(EmailType.WELCOME, user.email, {
      email: user.email,
    });

    return { message: 'User registered successfully', user };
  }

  async getUser(userId: number) {
    const findUser = await this.userRepo.findOne({
      where: { id: userId },
    });
    if (!findUser) throw new NotFoundException('User don`t exists');

    return { user: instanceToPlain(findUser) };
  }

  async updateUser(
    userId: number,
    updateUserDto: UpdateUserDto,
    files?: {
      images?: Express.Multer.File[];
      videos?: Express.Multer.File[];
    },
  ) {
    const findUser = await this.userRepo.findOne({
      where: { id: userId },
    });
    if (!findUser) throw new NotFoundException('User don`t exists');

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
      findUser.images = (findUser.images || []).filter(
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
      findUser.videos = (findUser.videos || []).filter(
        (vid) => !deletedVideos.includes(vid.public_id),
      );
    }

    // Upload new images
    if (files?.images?.length) {
      const totalImages = files.images.length + (findUser.images?.length || 0);
      if (totalImages > 3) {
        throw new BadRequestException('You can upload a maximum of 3 images');
      }
      const uploadedImages = await Promise.all(
        files.images.map((file) => this.cloudinaryService.uploadImage(file)),
      );
      findUser.images = [...(findUser.images || []), ...uploadedImages];
    }

    // Upload new videos
    if (files?.videos?.length) {
      const totalVideos = files.videos.length + (findUser.videos?.length || 0);
      if (totalVideos > 2) {
        throw new BadRequestException('You can upload a maximum of 2 videos');
      }
      const uploadedVideos = await Promise.all(
        files.videos.map((file) => this.cloudinaryService.uploadVideo(file)),
      );
      findUser.videos = [...(findUser.videos || []), ...uploadedVideos];
    }

    const updatedUser = this.userRepo.merge(findUser, updateUserDto);
    await this.userRepo.save(updatedUser);

    return {
      message: 'User updated successfully',
      user: instanceToPlain(updatedUser),
    };
  }

  async getUserDomains(userId: number, status: string | undefined) {
    const findDomains = await this.domainRepo.find({
      where: {
        user: { id: userId },
        ...(status === '0' || status === '1'
          ? { status: parseInt(status) }
          : {}),
      },
      order: { createdAt: 'DESC' },
    });

    return instanceToPlain(findDomains);
  }

  async getUserOneDomain(userId: number, domainId: number) {
    const findOneDomain = await this.domainRepo.findOne({
      where: {
        id: domainId,
        user: { id: userId },
      },
    });

    if (!findOneDomain) {
      throw new NotFoundException('Domain not found or not owned by user');
    }

    return instanceToPlain(findOneDomain);
  }

  async updateUserOneDomain(
    userId: number,
    domainId: number,
    updateUserDomainDto: UpdateUserDomainDto,
    files?: {
      images?: Express.Multer.File[];
      videos?: Express.Multer.File[];
    },
  ) {
    const findOneDomain = await this.domainRepo.findOne({
      where: {
        id: domainId,
        user: { id: userId },
      },
    });

    if (!findOneDomain) {
      throw new NotFoundException('Domain not found or not owned by user');
    }

    // Delete selected images by public_id
    let deletedImages: string[] = [];

    if (updateUserDomainDto.deletedImages) {
      try {
        const parsed: unknown = JSON.parse(updateUserDomainDto.deletedImages);

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

    if (updateUserDomainDto.deletedVideos) {
      try {
        const parsed: unknown = JSON.parse(updateUserDomainDto.deletedVideos);

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
      event: 'admin:domain_updated_by_user',
      userId: userId,
      message: `User ${userId} updated Domain "${findOneDomain.name}".`,
      data: findOneDomain,
    });

    // Send notification to user if exists
    await this.notificationsService.sendNotification({
      room: `user_${userId}`,
      event: 'user:domain_updated_by_user',
      userId: userId,
      message: `You updated Your domain "${findOneDomain.name}".`,
      data: findOneDomain,
    });

    const updatedDomain = this.domainRepo.merge(
      findOneDomain,
      updateUserDomainDto,
    );
    await this.domainRepo.save(updatedDomain);

    return {
      message: 'domain updated successfully',
      domain: updatedDomain,
    };
  }

  async deleteUserOneDomain(userId: number, domainId: number) {
    const findOneDomain = await this.domainRepo.findOne({
      where: {
        id: domainId,
        user: { id: userId },
      },
    });

    if (!findOneDomain) {
      throw new NotFoundException('Domain not found or not owned by user');
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
      event: 'admin:domain_deleted_by_user',
      userId: userId,
      message: `User ${userId} deleted Domain "${findOneDomain.name}".`,
      data: findOneDomain,
    });

    // Send notification to user if exists
    await this.notificationsService.sendNotification({
      room: `user_${userId}`,
      event: 'user:domain_deleted_by_user',
      userId: userId,
      message: `You deleted Your domain "${findOneDomain.name}".`,
      data: findOneDomain,
    });

    // Delete the domain from the database
    await this.domainRepo.remove(findOneDomain);

    return {
      message: 'Domain deleted successfully',
      domains: instanceToPlain(findOneDomain),
    };
  }
}
