import { AppService } from '@colanode/client/services';

import { DesktopKyselyService } from '@/main/kysely-service';
import { DesktopFileSystem } from '@/main/file-system';
import { appBuild } from '@/main/app-build';
import { paths } from '@/main/app-paths';

export const app = new AppService(
  new DesktopFileSystem(),
  appBuild,
  new DesktopKyselyService(),
  paths
);
