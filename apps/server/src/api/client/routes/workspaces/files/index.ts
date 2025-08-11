import { FastifyPluginCallback } from 'fastify';

import { fileDownloadRoute } from './file-download';
import { fileUploadRoute } from './file-upload';
import { fileUploadTusRoute } from './file-upload-tus';

export const fileRoutes: FastifyPluginCallback = (instance, _, done) => {
  instance.register(fileUploadRoute);
  instance.register(fileUploadTusRoute);
  instance.register(fileDownloadRoute);

  done();
};
