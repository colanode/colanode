import { AppService } from '@colanode/client/services';

import { WebKyselyService } from '@/services/kysely-service';
import { WebFileSystem } from '@/services/file-system';
import { appBuild } from '@/services/app-build';
import { paths } from '@/services/app-paths';

export const app = new AppService(
  new WebFileSystem(),
  appBuild,
  new WebKyselyService(),
  paths
);
