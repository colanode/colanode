import cors from 'cors';
import express, { Request, Response } from 'express';

import http from 'http';

import { authMiddleware } from '@/middlewares/auth';
import { accountsRouter } from '@/routes/accounts';
import { avatarsRouter } from '@/routes/avatars';
import { configRouter } from '@/routes/config';
import { filesRouter } from '@/routes/files';
import { nodesRouter } from '@/routes/nodes';
import { syncRouter } from '@/routes/sync';
import { workspacesRouter } from '@/routes/workspaces';
import { logService } from '@/services/log-service';
import { synapse } from '@/services/synapse-service';

const logger = logService.createLogger('api');

export const initApi = async () => {
  const app = express();
  const port = 3000;

  app.use(
    express.json({
      limit: '50mb',
    })
  );
  app.use(cors());

  app.get('/', (_: Request, res: Response) => {
    res.send('Colanode');
  });

  app.use('/v1/accounts', accountsRouter);
  app.use('/v1/config', configRouter);
  app.use('/v1/workspaces', authMiddleware, workspacesRouter);
  app.use('/v1/sync', authMiddleware, syncRouter);
  app.use('/v1/avatars', authMiddleware, avatarsRouter);
  app.use('/v1/files', authMiddleware, filesRouter);
  app.use('/v1/nodes', authMiddleware, nodesRouter);

  const server = http.createServer(app);
  await synapse.init(server);

  server.listen(port, () => {
    logger.info(`Server is running at http://localhost:${port}`);
  });
};
