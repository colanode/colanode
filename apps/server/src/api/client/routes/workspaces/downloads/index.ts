import { FastifyPluginCallback } from 'fastify';

import { fileDownloadGetRoute } from './file-download-get';

export const downloadRoutes: FastifyPluginCallback = (instance, _, done) => {
  instance.register(fileDownloadGetRoute);

  done();
};
