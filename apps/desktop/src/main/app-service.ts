import { AppService } from '@colanode/client/services';
import { appBuild } from '@colanode/desktop/main/app-build';
import { paths } from '@colanode/desktop/main/app-paths';
import { DesktopFileSystem } from '@colanode/desktop/main/file-system';
import { DesktopKyselyService } from '@colanode/desktop/main/kysely-service';

export const app = new AppService(
  new DesktopFileSystem(),
  appBuild,
  new DesktopKyselyService(),
  paths
);
