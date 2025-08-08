import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.strategy';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { UserToken } from 'src/users/entities/user-token.entity';
import { EmailModule } from 'src/email/email.module';
import { PasswordResetCode } from './entities/password-reset-code.entity';
import { AdminToken } from 'src/admin/entities/admin-token.entity';
import { Admin } from 'src/admin/entities/admin.entity';

@Module({
  imports: [
    PassportModule,
    ConfigModule,
    EmailModule,
    TypeOrmModule.forFeature([
      User,
      UserToken,
      Admin,
      AdminToken,
      PasswordResetCode,
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: config.get<string>('JWT_EXPIRES_IN') || '1d',
        },
      }),
    }),
  ],
  providers: [JwtStrategy, AuthService],
  exports: [JwtModule, AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
