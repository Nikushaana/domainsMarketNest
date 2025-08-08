/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Transform } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';

export class UpdateAdminDomainDto {
  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description: string;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  status: number;

  @IsOptional()
  @IsString()
  deletedImages?: string;

  @IsOptional()
  @IsString()
  deletedVideos?: string;
}
