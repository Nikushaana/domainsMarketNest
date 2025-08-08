import { IsEmail } from 'class-validator';
import { Transform } from 'class-transformer';

export class ForgotPasswordUserDto {
  @IsEmail()
  @Transform(({ value }: { value: string }) => value.toLowerCase())
  email: string;
}
