import { Injectable, OnModuleInit } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { ConfigService } from '@nestjs/config';
import { Readable } from 'stream';

@Injectable()
export class CloudinaryService implements OnModuleInit {
  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.configService.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.configService.get<string>('CLOUDINARY_API_SECRET');

    console.log({ cloudName, apiKey, apiSecret }); // ✅ Debug log

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });
  }

  private async uploadFromBuffer(
    file: Express.Multer.File,
    folder: string,
    resource_type: 'image' | 'video',
  ): Promise<{ url: string; public_id: string }> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type,
        },
        (error, result) => {
          if (error) {
            return reject(
              new Error(error.message || 'Cloudinary upload error'),
            );
          }
          if (!result) {
            return reject(new Error('No result from Cloudinary'));
          }
          resolve({
            url: result.secure_url,
            public_id: result.public_id,
          });
        },
      );

      Readable.from(file.buffer).pipe(uploadStream);
    });
  }

  async uploadImage(file: Express.Multer.File) {
    return this.uploadFromBuffer(file, 'domainsProject/images', 'image');
  }

  async uploadVideo(file: Express.Multer.File) {
    return this.uploadFromBuffer(file, 'domainsProject/videos', 'video');
  }

  async deleteFile(publicId: string, type: 'image' | 'video'): Promise<void> {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: type,
    });
  }
}
