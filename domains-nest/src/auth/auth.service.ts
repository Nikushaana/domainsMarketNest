import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { UserToken } from 'src/users/entities/user-token.entity';
import { User } from 'src/users/entities/user.entity';
import { LessThan, MoreThan, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { EmailService, EmailType } from 'src/email/email.service';
import { LoginUserDto } from './dto/login-user.dto';
import { ResetPasswordUserDto } from './dto/reset-password-user.dto';
import { ForgotPasswordUserDto } from './dto/forgot-password-user.dto';
import { PasswordResetCode } from './entities/password-reset-code.entity';
import { LoginAdminDto } from './dto/login-admin.dto';
import { Admin } from 'src/admin/entities/admin.entity';
import { AdminToken } from 'src/admin/entities/admin-token.entity';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,

    @InjectRepository(User)
    private userRepo: Repository<User>,

    @InjectRepository(UserToken)
    private userTokenRepo: Repository<UserToken>,

    @InjectRepository(PasswordResetCode)
    private resetCodeRepo: Repository<PasswordResetCode>,

    private emailService: EmailService,

    @InjectRepository(Admin)
    private adminRepo: Repository<Admin>,

    @InjectRepository(AdminToken)
    private adminTokenRepo: Repository<AdminToken>,
  ) {}

  signToken(payload: any): string {
    return this.jwtService.sign(payload);
  }

  verifyToken(token: string): any {
    return this.jwtService.verify(token);
  }

  async userLogin(loginUserDto: LoginUserDto) {
    const user = await this.userRepo.findOne({
      where: { email: loginUserDto.email },
    });

    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isMatch = await bcrypt.compare(loginUserDto.password, user.password);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    const payload = { id: user.id, role: 'user' };
    const token = this.signToken(payload);

    let userToken = await this.userTokenRepo.findOne({
      where: { user_id: user.id },
    });

    if (userToken) {
      userToken.token = token;
      await this.userTokenRepo.save(userToken);
    } else {
      userToken = this.userTokenRepo.create({ user_id: user.id, token });
      await this.userTokenRepo.save(userToken);
    }

    return {
      message: 'User logged in successfully',
      token,
      user: { id: user.id, email: user.email },
    };
  }

  async userLogout(authHeader: string) {
    const token = authHeader?.split(' ')[1];
    if (!token) return { message: 'Token not found' };
    await this.userTokenRepo.delete({ token });
    return { message: 'User logged out successfully' };
  }

  async userForgotPassword(forgotPasswordUserDto: ForgotPasswordUserDto) {
    const user = await this.userRepo.findOne({
      where: { email: forgotPasswordUserDto.email },
    });
    if (!user) throw new NotFoundException('User not found');

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    const resetCode = this.resetCodeRepo.create({
      user_id: user.id,
      code,
      expires_at: expiresAt,
    });

    await this.resetCodeRepo.save(resetCode);
    await this.resetCodeRepo.delete({
      expires_at: LessThan(new Date()),
    });

    await this.emailService.sendEmailByType(
      EmailType.FORGOT_PASSWORD,
      user.email,
      {
        code,
      },
    );

    return { message: 'Reset code sent to email' };
  }

  async userResetPassword(resetPasswordUserDto: ResetPasswordUserDto) {
    const user = await this.userRepo.findOne({
      where: { email: resetPasswordUserDto.email },
    });
    if (!user) throw new NotFoundException('User not found');

    const validCodes = await this.resetCodeRepo.find({
      where: {
        user: { id: user.id },
        expires_at: MoreThan(new Date()),
      },
      order: { created_at: 'DESC' },
    });

    if (validCodes.length === 0) {
      throw new BadRequestException('No valid reset code found');
    }

    const latestCode = validCodes[0];

    if (latestCode.code !== resetPasswordUserDto.code) {
      throw new BadRequestException('Invalid or outdated code');
    }

    const hashed = await bcrypt.hash(resetPasswordUserDto.newPassword, 10);
    user.password = hashed;
    await this.userRepo.save(user);

    await this.resetCodeRepo.delete({ user_id: user.id });

    return { message: 'Password reset successfully' };
  }

  async adminLogin(loginAdminDto: LoginAdminDto) {
    const admin = await this.adminRepo.findOne({
      where: { email: loginAdminDto.email },
    });

    if (!admin) throw new UnauthorizedException('Invalid credentials');

    const isMatch = await bcrypt.compare(
      loginAdminDto.password,
      admin.password,
    );
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    const payload = { id: admin.id, role: 'admin' };
    const token = this.signToken(payload);

    let adminToken = await this.adminTokenRepo.findOne({
      where: { admin_id: admin.id },
    });

    if (adminToken) {
      adminToken.token = token;
      await this.adminTokenRepo.save(adminToken);
    } else {
      adminToken = this.adminTokenRepo.create({ admin_id: admin.id, token });
      await this.adminTokenRepo.save(adminToken);
    }

    return {
      message: 'Admin logged in successfully',
      token,
      user: { id: admin.id, email: admin.email },
    };
  }

  async adminLogout(authHeader: string) {
    const token = authHeader?.split(' ')[1];
    if (!token) return { message: 'Token not found' };
    await this.adminTokenRepo.delete({ token });
    return { message: 'Admin logged out successfully' };
  }
}
