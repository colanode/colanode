import { AppService } from '@colanode/client/services';
import { appBuild } from '@colanode/desktop/main/app-build';
import { DesktopFileSystem } from '@colanode/desktop/main/file-system';
import { DesktopKyselyService } from '@colanode/desktop/main/kysely-service';
import { DesktopPathService } from '@colanode/desktop/main/path-service';

export const app = new AppService(
  new DesktopFileSystem(),
  appBuild,
  new DesktopKyselyService(),
  new DesktopPathService()
);
