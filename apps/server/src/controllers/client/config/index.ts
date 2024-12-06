import { ServerConfig } from '@colanode/core';
import { Request, Response } from 'express';

export const configGetHandler = async (
  _: Request,
  res: Response
): Promise<void> => {
  const config: ServerConfig = {
    name: 'Colanode Cloud',
    avatar: '',
    version: '0.1.0',
    attributes: {},
  };

  res.status(200).json(config);
};
