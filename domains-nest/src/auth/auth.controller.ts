import {
  Body,
  Controller,
  Delete,
  Headers,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LoginUserDto } from './dto/login-user.dto';
import { ForgotPasswordUserDto } from './dto/forgot-password-user.dto';
import { ResetPasswordUserDto } from './dto/reset-password-user.dto';
import { LoginAdminDto } from './dto/login-admin.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // user

  @Post('userLogin')
  async userLogin(@Body() loginUserDto: LoginUserDto) {
    return this.authService.userLogin(loginUserDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('userLogout')
  async userLogout(@Headers('authorization') authHeader: string) {
    return this.authService.userLogout(authHeader);
  }

  @Post('userForgotPassword')
  async userForgotPassword(
    @Body() forgotPasswordUserDto: ForgotPasswordUserDto,
  ) {
    return this.authService.userForgotPassword(forgotPasswordUserDto);
  }

  @Post('userResetPassword')
  async userResetPassword(@Body() resetPasswordUserDto: ResetPasswordUserDto) {
    return this.authService.userResetPassword(resetPasswordUserDto);
  }

  // admin

  @Post('adminLogin')
  async AdminLogin(@Body() loginAdminDto: LoginAdminDto) {
    return this.authService.adminLogin(loginAdminDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('adminLogout')
  async adminLogout(@Headers('authorization') authHeader: string) {
    return this.authService.adminLogout(authHeader);
  }
}
