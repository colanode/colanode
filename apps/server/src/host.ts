import { generateId, IdType } from '@colanode/core';

type HostEnvironment = 'development' | 'production';

export const host = {
  id: generateId(IdType.Host),
  environment: (process.env.NODE_ENV as HostEnvironment) || 'development',
};
