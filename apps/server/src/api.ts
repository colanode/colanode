import cors from 'cors';
import express, { Request, Response } from 'express';

import http from 'http';

import { clientRouter } from '@/routes/client';
import { socketService } from '@/services/socket-service';
import { createLogger } from '@/lib/logger';

const logger = createLogger('api');

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
    res.send(
      'This is a Colanode server. For more information, visit https://colanode.com'
    );
  });

  app.use('/client', clientRouter);

  const server = http.createServer(app);
  await socketService.init(server);

  server.listen(port, () => {
    logger.info(`Server is running at http://localhost:${port}`);
  });
};
