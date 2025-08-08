/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Transform } from 'class-transformer';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateAdminDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }): string | undefined =>
    value === '' ? undefined : value,
  )
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password?: string;
}
