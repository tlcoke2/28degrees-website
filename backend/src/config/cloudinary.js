import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Uploads a file to Cloudinary
 * @param {Buffer} fileBuffer - The file buffer to upload
 * @param {string} folder - The folder to upload to
 * @param {number} height - The height to resize the image to
 * @param {number} quality - The quality of the image (1-100)
 * @returns {Promise<Object>} The upload result
 */
export const uploadToCloudinary = (fileBuffer, folder, height, quality) => {
  return new Promise((resolve, reject) => {
    const options = { folder };
    
    if (height) options.height = height;
    if (quality) options.quality = quality;
    
    options.resource_type = 'auto';
    
    const uploadStream = cloudinary.uploader.upload_stream(
      options,
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    
    uploadStream.end(fileBuffer);
  });
};

/**
 * Deletes a file from Cloudinary
 * @param {string} publicId - The public ID of the file to delete
 * @param {string} resourceType - The resource type (image, video, raw, etc.)
 * @returns {Promise<Object>} The deletion result
 */
export const deleteFromCloudinary = (publicId, resourceType = 'image') => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(
      publicId,
      { resource_type: resourceType },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
  });
};

export default cloudinary;
