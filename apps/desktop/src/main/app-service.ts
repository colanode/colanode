import { AppMeta, AppService } from '@colanode/client/services';
import { DesktopFileSystem } from '@colanode/desktop/main/file-system';
import { DesktopKyselyService } from '@colanode/desktop/main/kysely-service';
import { DesktopPathService } from '@colanode/desktop/main/path-service';

const appMeta: AppMeta = {
  type: 'desktop',
  platform: process.platform,
};

export const app = new AppService(
  appMeta,
  new DesktopFileSystem(),
  new DesktopKyselyService(),
  new DesktopPathService()
);
