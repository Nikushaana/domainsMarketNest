import { Module } from '@nestjs/common';
import { DomainsController } from './domains.controller';
import { DomainsService } from './domains.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Domain } from './entities/domain.entity';
import { AuthModule } from 'src/auth/auth.module';
import { User } from 'src/users/entities/user.entity';
import { NotificationsModule } from 'src/notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Domain, User]),
    AuthModule,
    NotificationsModule,
  ],
  controllers: [DomainsController],
  providers: [DomainsService],
  exports: [TypeOrmModule],
})
export class DomainsModule {}
