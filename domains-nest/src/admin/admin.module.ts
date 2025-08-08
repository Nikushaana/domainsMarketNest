import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { Admin } from './entities/admin.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminToken } from './entities/admin-token.entity';
import { Domain } from 'src/domains/entities/domain.entity';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
import { User } from 'src/users/entities/user.entity';
import { UserToken } from 'src/users/entities/user-token.entity';
import { NotificationsModule } from 'src/notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Admin, User, UserToken, AdminToken, Domain]),
    CloudinaryModule,
    NotificationsModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminsModule {}
