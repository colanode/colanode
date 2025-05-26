import { FastifyPluginCallback } from 'fastify';

import { fileDownloadRoute } from './file-download';
import { fileUploadRoute } from './file-upload';

export const fileRoutes: FastifyPluginCallback = (instance, _, done) => {
  instance.register(fileUploadRoute);
  instance.register(fileDownloadRoute);

  done();
};
