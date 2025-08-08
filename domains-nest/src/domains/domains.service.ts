import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Domain } from './entities/domain.entity';
import { Repository } from 'typeorm';
import { CreateDomainDto } from './dto/create-domain.dto';
import { User } from 'src/users/entities/user.entity';
import { instanceToPlain } from 'class-transformer';
import { NotificationsService } from 'src/notifications/notifications.service';

@Injectable()
export class DomainsService {
  constructor(
    @InjectRepository(Domain)
    private domainRepo: Repository<Domain>,

    @InjectRepository(User)
    private userRepo: Repository<User>,

    private notificationsService: NotificationsService,
  ) {}

  async create(dto: CreateDomainDto, userId: number | null) {
    const domainData = { ...dto };

    if (userId) {
      const fullUser = await this.userRepo.findOne({ where: { id: userId } });
      if (fullUser) {
        domainData['user'] = fullUser;
      }
    }

    const domain = this.domainRepo.create(domainData);

    const savedDomain = await this.domainRepo.save(domain);

    // Send notification to admin
    await this.notificationsService.sendNotification({
      room: 'admin',
      event: 'admin:domain_request',
      userId: userId,
      message: `${
        userId ? `User ${userId}` : 'Guest'
      } requested to add domain "${savedDomain.name}"`,
      data: savedDomain,
    });

    // Send notification to user if exists
    if (userId) {
      await this.notificationsService.sendNotification({
        room: `user_${userId}`,
        event: 'user:domain_requested',
        userId: userId,
        message: `Your domain "${savedDomain.name}" was submitted for review.`,
        data: savedDomain,
      });
    }

    return {
      message: 'The domain will be added after admin approval.',
      domain: instanceToPlain(savedDomain),
    };
  }

  async findAll(page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [domains, total] = await this.domainRepo.findAndCount({
      where: { status: 1 },
      order: { createdAt: 'DESC' },
      relations: ['user'],
      skip,
      take: limit,
    });

    const domainsWithUser = instanceToPlain(domains);

    const totalPages = Math.ceil(total / limit);

    return {
      currentPage: page,
      limit,
      totalPages,
      totalItems: total,
      data: domainsWithUser,
    };
  }

  async findOne(id: number) {
    const domain = await this.domainRepo.findOne({
      where: { id, status: 1 },
      relations: ['user'],
    });
    if (!domain) throw new NotFoundException('Domain not found');
    return instanceToPlain(domain);
  }
}
