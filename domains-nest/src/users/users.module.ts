import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { UserToken } from './entities/user-token.entity';
import { EmailModule } from 'src/email/email.module';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
import { DomainsModule } from 'src/domains/domains.module';
import { Domain } from 'src/domains/entities/domain.entity';
import { NotificationsModule } from 'src/notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserToken, Domain]),
    ConfigModule,
    EmailModule,
    CloudinaryModule,
    DomainsModule,
    NotificationsModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
