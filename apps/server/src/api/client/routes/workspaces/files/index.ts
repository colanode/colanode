import { FastifyPluginCallback } from 'fastify';

import { fileUploadCompleteRoute } from './file-upload-complete';
import { fileUploadInitRoute } from './file-upload-init';

export const fileRoutes: FastifyPluginCallback = (instance, _, done) => {
  instance.register(fileUploadCompleteRoute);
  instance.register(fileUploadInitRoute);

  done();
};
