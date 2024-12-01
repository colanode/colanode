import { ServerConfig } from '@colanode/core';
import { Request, Response,Router } from 'express';

export const configRouter = Router();

configRouter.get('/', async (_: Request, res: Response) => {
  const config: ServerConfig = {
    name: 'Colanode Cloud',
    avatar: '',
    version: '0.1.0',
    attributes: {},
  };

  res.status(200).json(config);
});
