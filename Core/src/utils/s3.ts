import multer from 'multer';
import { Request } from 'express';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

// Object storage for uploaded images/videos, talked to via the S3 API (hence the
// @aws-sdk/client-s3 import below — MinIO implements that same API) but pointed at our
// self-hosted MinIO (see docker-compose.yml/k8s), not real AWS S3.
//
// This replaces writing uploads to local disk under /app/uploads: that required an
// RWO (single-node) PVC, which pinned Core to exactly one replica — any pod other than
// the one that received a given upload couldn't serve it. Object storage has no such
// per-pod locality, so Core can now run multiple replicas.
const MINIO_BUCKET = process.env.MINIO_BUCKET || 'zia-uploads';
const MINIO_PUBLIC_URL = (process.env.MINIO_PUBLIC_URL || 'http://localhost:9000').replace(/\/$/, '');

const s3Client = new S3Client({
  endpoint: process.env.MINIO_ENDPOINT || 'http://localhost:9000',
  region: process.env.MINIO_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY || 'minioadmin',
    secretAccessKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
  },
  // MinIO needs path-style URLs (http://host/bucket/key) rather than AWS's
  // virtual-hosted style (http://bucket.host/key), which only real AWS S3 supports.
  forcePathStyle: true,
});

// Configure multer for memory storage — files are buffered in memory (not written to
// disk anywhere) and handed straight to the S3 upload functions below.
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

const buildObjectKey = (file: Express.Multer.File, folder: string): string => {
  const sanitizedFilename = file.originalname
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9._-]/g, '')
    .replace(/_+/g, '_');
  const filename = `${Date.now()}-${Math.random().toString(36).substring(2)}-${sanitizedFilename}`;
  return `${folder}/${filename}`;
};

// Upload file to S3-compatible storage
export const uploadToS3 = async (
  file: Express.Multer.File,
  folder: string = 'profile-images'
): Promise<string> => {
  const key = buildObjectKey(file, folder);

  try {
    await s3Client.send(new PutObjectCommand({
      Bucket: MINIO_BUCKET,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    }));

    return `${MINIO_PUBLIC_URL}/${MINIO_BUCKET}/${key}`;
  } catch (error) {
    console.error('Error uploading file to S3:', error);
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

// Upload video to S3-compatible storage
export const uploadVideoToS3 = async (
  file: Express.Multer.File,
  folder: string = 'service-videos'
): Promise<string> => {
  const key = buildObjectKey(file, folder);

  try {
    await s3Client.send(new PutObjectCommand({
      Bucket: MINIO_BUCKET,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    }));

    return `${MINIO_PUBLIC_URL}/${MINIO_BUCKET}/${key}`;
  } catch (error) {
    console.error('Error uploading video to S3:', error);
    throw new Error('Failed to upload video');
  }
};

// Delete file from S3-compatible storage
export const deleteFromS3 = async (fileUrl: string): Promise<void> => {
  try {
    const prefix = `${MINIO_PUBLIC_URL}/${MINIO_BUCKET}/`;
    if (!fileUrl.startsWith(prefix)) return;

    const key = fileUrl.slice(prefix.length);

    await s3Client.send(new DeleteObjectCommand({
      Bucket: MINIO_BUCKET,
      Key: key,
    }));
  } catch (error) {
    console.error('Error deleting file from S3:', error);
  }
};
