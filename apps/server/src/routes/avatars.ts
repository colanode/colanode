import { GetObjectCommand,PutObjectCommand } from '@aws-sdk/client-s3';
import { generateId, IdType } from '@colanode/core';
import { Router } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import { Readable } from 'stream';

import { avatarStorage, BUCKET_NAMES } from '@/data/storage';

export const avatarsRouter = Router();

const storage = multer.memoryStorage();
const upload = multer({
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

avatarsRouter.post('/', upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
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
    return res.json({ success: true, id: avatarId });
  } catch (error) {
    console.error('Error uploading file:', error);
    return res.status(500).json({ error: 'Failed to upload avatar' });
  }
});

avatarsRouter.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAMES.AVATARS,
      Key: `avatars/${id}.jpeg`,
    });

    const avatarResponse = await avatarStorage.send(command);
    if (!avatarResponse.Body) {
      return res.status(404).json({ error: 'Avatar not found' });
    }

    if (avatarResponse.Body instanceof Readable) {
      avatarResponse.Body.pipe(res);
    } else {
      return res.status(404).json({ error: 'Avatar not found' });
    }
  } catch (error) {
    console.error('Error downloading avatar:', error);
    return res.status(500).json({ error: 'Failed to download avatar' });
  }
});
