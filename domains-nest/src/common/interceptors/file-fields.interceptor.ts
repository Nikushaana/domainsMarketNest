import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { memoryStorage } from 'multer';

export function createFileUploadInterceptor(
  fields: Array<{ name: string; maxCount: number }>,
) {
  const imageTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const videoTypes = ['video/mp4', 'video/webm', 'video/ogg'];

  const options: MulterOptions = {
    storage: memoryStorage(),
    limits: {
      fileSize: 5 * 1024 * 1024, // 5 MB
    },
    fileFilter: (req, file, cb) => {
      if (file.fieldname === 'images') {
        if (imageTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('Only JPEG, PNG, or WEBP images are allowed'), false);
        }
      } else if (file.fieldname === 'videos') {
        if (videoTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('Only MP4, WEBM, or OGG videos are allowed'), false);
        }
      } else {
        cb(new Error('Unexpected file field'), false);
      }
    },
  };

  return FileFieldsInterceptor(fields, options);
}
