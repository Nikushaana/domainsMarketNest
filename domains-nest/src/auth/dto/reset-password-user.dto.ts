import { IsEmail, IsString, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class ResetPasswordUserDto {
  @IsEmail()
  @Transform(({ value }: { value: string }) => value.toLowerCase())
  email: string;

  @IsString()
  code: string;

  @IsString()
  @MinLength(6, { message: 'New Password must be at least 6 characters long' })
  newPassword: string;
}
