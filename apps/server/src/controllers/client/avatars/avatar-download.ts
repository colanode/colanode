import { Request, Response } from 'express';
import { GetObjectCommand } from '@aws-sdk/client-s3';

import { Readable } from 'stream';

import { avatarStorage, BUCKET_NAMES } from '@/data/storage';

export const avatarDownloadHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const avatarId = req.params.avatarId;
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAMES.AVATARS,
      Key: `avatars/${avatarId}.jpeg`,
    });

    const avatarResponse = await avatarStorage.send(command);
    if (!avatarResponse.Body) {
      res.status(404).json({ error: 'Avatar not found' });
      return;
    }

    if (avatarResponse.Body instanceof Readable) {
      avatarResponse.Body.pipe(res);
    } else {
      res.status(404).json({ error: 'Avatar not found' });
    }
  } catch (error) {
    console.error('Error downloading avatar:', error);
    res.status(500).json({ error: 'Failed to download avatar' });
  }
};
