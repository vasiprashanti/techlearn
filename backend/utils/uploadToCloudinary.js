import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadToCloudinary = async (buffer, filename) => {
  return new Promise((resolve, reject) => {
    const sanitized = filename
      .replace(/^certificates_/, '') // remove prefix if present
      .replace('.pdf', '')
      .replace(/[^a-zA-Z0-9-_]/g, '_');

    cloudinary.uploader.upload_stream(
      {
        resource_type: 'raw',
        public_id: `certificates/${sanitized}`,
        format: 'pdf',
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          reject(error);
        } else {
          resolve(result);
        }
      }
    ).end(buffer);
  });
};

