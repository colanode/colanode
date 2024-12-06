import { Request, Response } from 'express';
import sharp from 'sharp';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { generateId, IdType } from '@colanode/core';
import multer from 'multer';

import path from 'path';

import { avatarStorage, BUCKET_NAMES } from '@/data/storage';

const storage = multer.memoryStorage();
const uploadMulter = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images are allowed'));
    }
  },
});

export const avatarUploadParameter = uploadMulter.single('avatar');

export const avatarUploadHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    // Resize image to a maximum of 500x500 pixels while keeping aspect ratio, and convert to JPEG using Sharp
    const jpegBuffer = await sharp(req.file.buffer)
      .resize({
        width: 500,
        height: 500,
        fit: 'inside',
      })
      .jpeg()
      .toBuffer();

    const avatarId = generateId(IdType.Avatar);
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAMES.AVATARS,
      Key: `avatars/${avatarId}.jpeg`,
      Body: jpegBuffer,
      ContentType: 'image/jpeg',
    });

    await avatarStorage.send(command);
    res.json({ success: true, id: avatarId });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Failed to upload avatar' });
  }
};
