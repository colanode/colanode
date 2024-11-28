import express, { Request, Response } from 'express';
import cors from 'cors';
import http from 'http';

import { accountsRouter } from '@/routes/accounts';
import { workspacesRouter } from '@/routes/workspaces';
import { authMiddleware } from '@/middlewares/auth';
import { syncRouter } from '@/routes/sync';
import { configRouter } from '@/routes/config';
import { avatarsRouter } from '@/routes/avatars';
import { filesRouter } from '@/routes/files';
import { synapse } from '@/services/synapse-service';
import { logService } from '@/services/log-service';

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

  const server = http.createServer(app);
  await synapse.init(server);

  server.listen(port, () => {
    logger.info(`Server is running at http://localhost:${port}`);
  });
};
