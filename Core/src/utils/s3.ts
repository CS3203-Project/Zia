import multer from 'multer';
import { Request } from 'express';
import fs from 'fs';
import path from 'path';

// Define the root uploads directory
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Ensure subdirectories exist
['profile-images', 'uploads', 'service-videos'].forEach(folder => {
  const folderPath = path.join(UPLOADS_DIR, folder);
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }
});

// Configure multer for memory storage
const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit for images
  },
  fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Check if file is an image
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// Upload file to Local Storage
export const uploadToS3 = async (
  file: Express.Multer.File,
  folder: string = 'profile-images'
): Promise<string> => {
  // Sanitize filename
  const sanitizedFilename = file.originalname
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9._-]/g, '')
    .replace(/_+/g, '_');
  const filename = `${Date.now()}-${Math.random().toString(36).substring(2)}-${sanitizedFilename}`;
  
  // Ensure the specific folder exists
  const targetFolder = path.join(UPLOADS_DIR, folder);
  if (!fs.existsSync(targetFolder)) {
    fs.mkdirSync(targetFolder, { recursive: true });
  }

  const filePath = path.join(targetFolder, filename);

  try {
    await fs.promises.writeFile(filePath, file.buffer);
    // Return relative URL path
    return `/uploads/${folder}/${filename}`;
  } catch (error) {
    console.error('Error uploading file locally:', error);
    throw new Error('Failed to upload image');
  }
};

// Configure multer for video uploads with higher limits
export const uploadVideo = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit for videos
  },
  fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Check if file is a video
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed'));
    }
  },
});

// Upload video to Local Storage
export const uploadVideoToS3 = async (
  file: Express.Multer.File,
  folder: string = 'service-videos'
): Promise<string> => {
  const sanitizedFilename = file.originalname
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9._-]/g, '')
    .replace(/_+/g, '_');
  const filename = `${Date.now()}-${Math.random().toString(36).substring(2)}-${sanitizedFilename}`;
  
  const targetFolder = path.join(UPLOADS_DIR, folder);
  if (!fs.existsSync(targetFolder)) {
    fs.mkdirSync(targetFolder, { recursive: true });
  }

  const filePath = path.join(targetFolder, filename);

  try {
    await fs.promises.writeFile(filePath, file.buffer);
    return `/uploads/${folder}/${filename}`;
  } catch (error) {
    console.error('Error uploading video locally:', error);
    throw new Error('Failed to upload video');
  }
};

// Delete file from Local Storage
export const deleteFromS3 = async (fileUrl: string): Promise<void> => {
  try {
    if (!fileUrl.startsWith('/uploads/')) return;
    
    // Convert /uploads/folder/filename.ext to absolute path
    const relativePath = fileUrl.replace('/uploads/', '');
    const filePath = path.join(UPLOADS_DIR, relativePath);

    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
  } catch (error) {
    console.error('Error deleting local file:', error);
  }
};
